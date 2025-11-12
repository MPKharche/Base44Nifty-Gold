import React, { useState, useEffect } from "react";
import { MarketData } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle } from "lucide-react";

export default function VolatilityAnalysis() {
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

  const calculateVolatility = (data) => {
    if (!data || data.length < 2) return null;
    
    const returns = [];
    for (let i = 1; i < data.length; i++) {
      if (data[i].close && data[i - 1].close) {
        returns.push((data[i].close - data[i - 1].close) / data[i - 1].close);
      }
    }
    
    if (returns.length === 0) return null;
    
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    
    return {
      daily: stdDev,
      annualized: stdDev * Math.sqrt(252),
      mean,
      min: Math.min(...returns),
      max: Math.max(...returns)
    };
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6">Volatility Analysis</h1>
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
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6">Volatility Analysis</h1>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const niftyVol = calculateVolatility(niftyData);
  const goldVol = calculateVolatility(goldData);

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6">Volatility Analysis</h1>
        
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Nifty Volatility</CardTitle>
            </CardHeader>
            <CardContent>
              {niftyVol ? (
                <div className="space-y-2">
                  <p><strong>Daily Volatility:</strong> {(niftyVol.daily * 100).toFixed(2)}%</p>
                  <p><strong>Annualized Volatility:</strong> {(niftyVol.annualized * 100).toFixed(2)}%</p>
                  <p><strong>Mean Daily Return:</strong> {(niftyVol.mean * 100).toFixed(4)}%</p>
                  <p><strong>Min Return:</strong> {(niftyVol.min * 100).toFixed(2)}%</p>
                  <p><strong>Max Return:</strong> {(niftyVol.max * 100).toFixed(2)}%</p>
                </div>
              ) : (
                <p>Insufficient data for volatility calculation</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Gold Volatility</CardTitle>
            </CardHeader>
            <CardContent>
              {goldVol ? (
                <div className="space-y-2">
                  <p><strong>Daily Volatility:</strong> {(goldVol.daily * 100).toFixed(2)}%</p>
                  <p><strong>Annualized Volatility:</strong> {(goldVol.annualized * 100).toFixed(2)}%</p>
                  <p><strong>Mean Daily Return:</strong> {(goldVol.mean * 100).toFixed(4)}%</p>
                  <p><strong>Min Return:</strong> {(goldVol.min * 100).toFixed(2)}%</p>
                  <p><strong>Max Return:</strong> {(goldVol.max * 100).toFixed(2)}%</p>
                </div>
              ) : (
                <p>Insufficient data for volatility calculation</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
