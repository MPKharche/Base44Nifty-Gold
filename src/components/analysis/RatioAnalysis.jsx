import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from "recharts";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function RatioAnalysis({ niftyData, goldData }) {
  const [timeWindow, setTimeWindow] = useState("252");
  const [showZScore, setShowZScore] = useState(true);
  const [ratioData, setRatioData] = useState([]);
  
  useEffect(() => {
    if (!niftyData || !goldData || niftyData.length === 0 || goldData.length === 0) {
      return;
    }
    
    calculateRatioData();
  }, [niftyData, goldData, timeWindow]);
  
  const calculateRatioData = () => {
    const days = parseInt(timeWindow);
    if (isNaN(days) || days <= 0) return;
    
    // Create date maps for quick access
    const niftyMap = new Map();
    const goldMap = new Map();
    
    niftyData.forEach(item => {
      niftyMap.set(item.date, item);
    });
    
    goldData.forEach(item => {
      goldMap.set(item.date, item);
    });
    
    // Get all dates in both datasets
    const allDates = Array.from(new Set([
      ...niftyData.map(item => item.date),
      ...goldData.map(item => item.date)
    ])).sort((a, b) => new Date(a) - new Date(b)); // Chronological order
    
    const result = [];
    
    // For each date, calculate ratio
    for (let i = 0; i < allDates.length; i++) {
      const currentDate = allDates[i];
      
      const niftyItem = niftyMap.get(currentDate);
      const goldItem = goldMap.get(currentDate);
      
      if (niftyItem && goldItem && niftyItem.close && goldItem.close) {
        // Calculate gold/nifty ratio
        const ratio = goldItem.close / niftyItem.close;
        
        // Calculate Z-Score if we have enough history
        let zScore = null;
        if (i >= days) {
          // Get historical ratios for the window
          const historicalRatios = [];
          for (let j = i - days; j < i; j++) {
            const pastDate = allDates[j];
            const pastNifty = niftyMap.get(pastDate);
            const pastGold = goldMap.get(pastDate);
            
            if (pastNifty && pastGold && pastNifty.close && pastGold.close) {
              historicalRatios.push(pastGold.close / pastNifty.close);
            }
          }
          
          // Calculate mean and standard deviation
          if (historicalRatios.length > 0) {
            const mean = historicalRatios.reduce((sum, val) => sum + val, 0) / historicalRatios.length;
            const variance = historicalRatios.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / historicalRatios.length;
            const stdDev = Math.sqrt(variance);
            
            // Calculate z-score
            if (stdDev > 0) {
              zScore = (ratio - mean) / stdDev;
            }
          }
        }
        
        result.push({
          date: currentDate,
          formattedDate: format(new Date(currentDate), "MMM dd, yyyy"),
          ratio: parseFloat(ratio.toFixed(4)),
          zScore: zScore !== null ? parseFloat(zScore.toFixed(2)) : null
        });
      }
    }
    
    setRatioData(result);
  };
  
  if (!niftyData || !goldData || niftyData.length === 0 || goldData.length === 0) {
    return (
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Gold/Nifty Ratio Analysis</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-slate-500">No data available for ratio analysis</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-md">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Gold/Nifty Ratio Analysis</CardTitle>
        <div className="flex space-x-4 items-center">
          <div className="flex items-center space-x-2">
            <Switch
              id="show-zscore"
              checked={showZScore}
              onCheckedChange={setShowZScore}
            />
            <Label htmlFor="show-zscore" className="text-sm">Show Z-Score</Label>
          </div>
          <Tabs defaultValue={timeWindow} onValueChange={setTimeWindow}>
            <TabsList>
              <TabsTrigger value="63">63D</TabsTrigger>
              <TabsTrigger value="126">126D</TabsTrigger>
              <TabsTrigger value="252">252D</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={ratioData}
              margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis
                dataKey="formattedDate"
                tick={{ fontSize: 10 }}
                tickFormatter={(value) => value.substring(0, 6)}
                interval={Math.ceil(ratioData.length / 10)}
              />
              <YAxis 
                yAxisId="left"
                domain={['auto', 'auto']}
                tick={{ fontSize: 10 }}
              />
              {showZScore && (
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  domain={[-3, 3]}
                  ticks={[-3, -2, -1, 0, 1, 2, 3]}
                  tick={{ fontSize: 10 }}
                />
              )}
              <Tooltip
                formatter={(value, name) => {
                  if (name === "ratio") {
                    return [value, "Gold/Nifty Ratio"];
                  } else if (name === "zScore") {
                    return [value, "Z-Score"];
                  }
                  return [value, name];
                }}
                labelFormatter={(label) => format(new Date(ratioData.find(d => d.formattedDate === label)?.date || new Date()), "MMMM d, yyyy")}
              />
              <Line
                type="monotone"
                dataKey="ratio"
                yAxisId="left"
                stroke="#6366f1"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              {showZScore && (
                <>
                  <Line
                    type="monotone"
                    dataKey="zScore"
                    yAxisId="right"
                    stroke="#ef4444"
                    strokeWidth={1.5}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                  <ReferenceLine y={0} yAxisId="right" stroke="#94a3b8" strokeDasharray="3 3" />
                  <ReferenceLine y={2} yAxisId="right" stroke="#ef4444" strokeDasharray="3 3" opacity={0.5} />
                  <ReferenceLine y={-2} yAxisId="right" stroke="#22c55e" strokeDasharray="3 3" opacity={0.5} />
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 text-xs text-slate-600 space-y-1">
          <div className="flex items-center">
            <span className="inline-block w-3 h-3 bg-indigo-600 mr-1 rounded-full"></span>
            <span>Gold/Nifty Price Ratio - Higher values mean Gold is outperforming Nifty</span>
          </div>
          {showZScore && (
            <>
              <div className="flex items-center">
                <span className="inline-block w-3 h-3 bg-red-500 mr-1 rounded-full"></span>
                <span>Z-Score (standardized deviation from mean) - Extremes suggest mean reversion opportunity</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-green-600">Z &lt; -2: Gold undervalued vs Nifty</span>
                <span className="text-red-600">Z &gt; 2: Gold overvalued vs Nifty</span>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}