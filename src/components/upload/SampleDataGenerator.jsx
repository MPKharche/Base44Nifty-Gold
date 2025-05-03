import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Database, Check } from "lucide-react";
import { MarketData } from "@/api/entities";
import { Progress } from "@/components/ui/progress";

// Throttle helper function
const throttledBatch = async (items, batchSize, operation, delay = 1000) => {
  const results = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    
    // Wait to avoid rate limiting
    if (i > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    const result = await operation(batch);
    results.push(...result);
  }
  
  return results;
};

export default function SampleDataGenerator({ onDataGenerated }) {
  const [years, setYears] = useState("5");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [generated, setGenerated] = useState(false);

  const formatProgress = (value) => Math.round(value);

  const generateSampleData = async () => {
    try {
      setGenerating(true);
      setProgress(formatProgress(5));
      setError("");

      // Parse number of years
      const numYears = parseInt(years);
      if (isNaN(numYears) || numYears <= 0) {
        throw new Error("Please select a valid number of years");
      }

      // Start date calculation
      const startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - numYears);
      startDate.setHours(0, 0, 0, 0);

      // Generate dates
      const dates = [];
      const currentDate = new Date(startDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      while (currentDate <= today) {
        // Skip weekends
        if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
          dates.push(new Date(currentDate));
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }

      setProgress(formatProgress(10));

      // Generate Nifty data
      const niftyData = generateAssetData(dates, "nifty", 18000, 0.8, 2.5);
      
      setProgress(formatProgress(30));

      // Generate Gold data
      const goldData = generateAssetData(dates, "gold", 60000, 0.7, 1.8);
      
      setProgress(formatProgress(50));

      // Delete existing data first
      try {
        const niftyItems = await MarketData.filter({ asset_type: "nifty" });
        const goldItems = await MarketData.filter({ asset_type: "gold" });
        
        if (niftyItems && niftyItems.length > 0) {
          console.log(`Deleting ${niftyItems.length} existing Nifty records`);
          // Delete in small batches
          for (let i = 0; i < niftyItems.length; i += 20) {
            const batch = niftyItems.slice(i, i + 20);
            for (const item of batch) {
              await MarketData.delete(item.id);
            }
            // Small delay between batches
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
        
        if (goldItems && goldItems.length > 0) {
          console.log(`Deleting ${goldItems.length} existing Gold records`);
          // Delete in small batches
          for (let i = 0; i < goldItems.length; i += 20) {
            const batch = goldItems.slice(i, i + 20);
            for (const item of batch) {
              await MarketData.delete(item.id);
            }
            // Small delay between batches
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      } catch (err) {
        console.warn("Error deleting existing data:", err);
      }
      
      setProgress(formatProgress(70));

      // Upload Nifty data in smaller batches with delays
      const batchSize = 20; // Even smaller batch size to avoid rate limiting
      
      // Upload Nifty data
      for (let i = 0; i < niftyData.length; i += batchSize) {
        const batch = niftyData.slice(i, i + batchSize);
        await MarketData.bulkCreate(batch);
        
        // Update progress
        const progress = 70 + ((i / niftyData.length) * 15);
        setProgress(formatProgress(progress));
        
        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Upload Gold data
      for (let i = 0; i < goldData.length; i += batchSize) {
        const batch = goldData.slice(i, i + batchSize);
        await MarketData.bulkCreate(batch);
        
        // Update progress
        const progress = 85 + ((i / goldData.length) * 15);
        setProgress(formatProgress(progress));
        
        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      setProgress(formatProgress(100));
      setGenerated(true);
      
      // Trigger refresh event
      const refreshEvent = new CustomEvent('marketDataRefresh', {
        detail: {
          source: 'sampleDataGenerator',
          recordCount: niftyData.length + goldData.length,
          timestamp: Date.now()
        }
      });
      window.dispatchEvent(refreshEvent);
      
      if (onDataGenerated) {
        onDataGenerated();
      }
      
    } catch (err) {
      console.error("Error generating sample data:", err);
      setError(`Failed to generate sample data: ${err.message}`);
      setProgress(0);
    } finally {
      setGenerating(false);
    }
  };

  const generateAssetData = (dates, assetType, basePrice, volatility, trend) => {
    let price = basePrice;
    let volume = assetType === "nifty" ? 500000 : 10000;
    
    return dates.map((date, index) => {
      // Calculate price movement with trend and volatility
      const dailyChange = (Math.random() - 0.5) * volatility;
      const trendFactor = (Math.random() * trend) / 100;
      
      price = price * (1 + dailyChange / 100 + trendFactor);
      const open = price * (1 + (Math.random() - 0.5) * 0.5 / 100);
      const high = Math.max(open, price) * (1 + Math.random() * 0.8 / 100);
      const low = Math.min(open, price) * (1 - Math.random() * 0.8 / 100);
      const close = price;
      
      // Calculate returns compared to previous day
      const prevItem = index > 0 ? dates[index - 1] : null;
      const prevClose = prevItem ? price / (1 + dailyChange / 100 + trendFactor) : null;
      const returns = prevClose ? ((close - prevClose) / prevClose) * 100 : null;
      
      // Random volume with trend
      volume = volume * (1 + (Math.random() - 0.5) * 0.3);
      
      return {
        date: date.toISOString().split("T")[0],
        asset_type: assetType,
        open: parseFloat(open.toFixed(2)),
        high: parseFloat(high.toFixed(2)),
        low: parseFloat(low.toFixed(2)),
        close: parseFloat(close.toFixed(2)),
        volume: Math.round(volume),
        returns: returns !== null ? parseFloat(returns.toFixed(2)) : null
      };
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Sample Data</CardTitle>
        <CardDescription>
          Create sample market data for both Nifty and Gold
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">
              Select Time Period
            </label>
            <Select
              value={years}
              onValueChange={setYears}
              disabled={generating}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select years" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2 Years</SelectItem>
                <SelectItem value="5">5 Years</SelectItem>
                <SelectItem value="10">10 Years</SelectItem>
                <SelectItem value="15">15 Years</SelectItem>
                <SelectItem value="20">20 Years</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {generating && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Generating data...</span>
                <span>{formatProgress(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
          
          {generated && !generating && (
            <Alert className="bg-green-50 border-green-200">
              <Check className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Sample data successfully generated!
              </AlertDescription>
            </Alert>
          )}
          
          <Button
            onClick={generateSampleData}
            disabled={generating}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {generating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Database className="mr-2 h-4 w-4" />
                Generate {years} Years of Data
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}