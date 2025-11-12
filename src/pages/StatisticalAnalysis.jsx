import React, { useState, useEffect } from "react";
import { MarketData } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle } from "lucide-react";

export default function StatisticalAnalysis() {
  const [niftyData, setNiftyData] = useState([]);
  const [goldData, setGoldData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [niftyResult, goldResult] = await Promise.all([
        MarketData.filter({ asset_type: "nifty" }, "-date", 6500),
        MarketData.filter({ asset_type: "gold" }, "-date", 6500)
      ]);

      setNiftyData(niftyResult || []);
      setGoldData(goldResult || []);
    } catch (err) {
      console.error("Error loading data:", err);
      setError("Failed to load market data. Please upload data first.");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    if (!data || data.length === 0) return null;
    
    const prices = data.map(d => d.close).filter(p => p !== null && p !== undefined);
    if (prices.length === 0) return null;
    
    const sorted = [...prices].sort((a, b) => a - b);
    const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
    const variance = prices.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / prices.length;
    const stdDev = Math.sqrt(variance);
    
    return {
      count: prices.length,
      mean,
      median: sorted[Math.floor(sorted.length / 2)],
      stdDev,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      q1: sorted[Math.floor(sorted.length * 0.25)],
      q3: sorted[Math.floor(sorted.length * 0.75)]
    };
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6">Statistical Analysis</h1>
          <div className="flex items-center justify-center h-96">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6">Statistical Analysis</h1>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const niftyStats = calculateStats(niftyData);
  const goldStats = calculateStats(goldData);

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6">Statistical Analysis</h1>
        
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Nifty Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              {niftyStats ? (
                <div className="space-y-2">
                  <p><strong>Sample Size:</strong> {niftyStats.count}</p>
                  <p><strong>Mean:</strong> {niftyStats.mean.toFixed(2)}</p>
                  <p><strong>Median:</strong> {niftyStats.median.toFixed(2)}</p>
                  <p><strong>Std Deviation:</strong> {niftyStats.stdDev.toFixed(2)}</p>
                  <p><strong>Min:</strong> {niftyStats.min.toFixed(2)}</p>
                  <p><strong>Max:</strong> {niftyStats.max.toFixed(2)}</p>
                  <p><strong>Q1:</strong> {niftyStats.q1.toFixed(2)}</p>
                  <p><strong>Q3:</strong> {niftyStats.q3.toFixed(2)}</p>
                </div>
              ) : (
                <p>Insufficient data for statistical analysis</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Gold Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              {goldStats ? (
                <div className="space-y-2">
                  <p><strong>Sample Size:</strong> {goldStats.count}</p>
                  <p><strong>Mean:</strong> {goldStats.mean.toFixed(2)}</p>
                  <p><strong>Median:</strong> {goldStats.median.toFixed(2)}</p>
                  <p><strong>Std Deviation:</strong> {goldStats.stdDev.toFixed(2)}</p>
                  <p><strong>Min:</strong> {goldStats.min.toFixed(2)}</p>
                  <p><strong>Max:</strong> {goldStats.max.toFixed(2)}</p>
                  <p><strong>Q1:</strong> {goldStats.q1.toFixed(2)}</p>
                  <p><strong>Q3:</strong> {goldStats.q3.toFixed(2)}</p>
                </div>
              ) : (
                <p>Insufficient data for statistical analysis</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
