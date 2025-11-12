import React, { useState, useEffect } from "react";
import { MarketData } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle } from "lucide-react";

export default function RatioZScore() {
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

  const calculateRatioZScore = () => {
    if (!niftyData.length || !goldData.length) return null;
    
    // Match data by date
    const ratios = [];
    const niftyMap = new Map(niftyData.map(d => [d.date, d.close]));
    
    goldData.forEach(gold => {
      const niftyClose = niftyMap.get(gold.date);
      if (niftyClose && gold.close) {
        ratios.push({
          date: gold.date,
          ratio: niftyClose / gold.close,
          nifty: niftyClose,
          gold: gold.close
        });
      }
    });
    
    if (ratios.length === 0) return null;
    
    const ratioValues = ratios.map(r => r.ratio);
    const mean = ratioValues.reduce((a, b) => a + b, 0) / ratioValues.length;
    const stdDev = Math.sqrt(
      ratioValues.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / ratioValues.length
    );
    
    const currentRatio = ratios[ratios.length - 1].ratio;
    const zScore = (currentRatio - mean) / stdDev;
    
    return {
      current: currentRatio,
      mean,
      stdDev,
      zScore,
      ratios: ratios.slice(-30) // Last 30 ratios
    };
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6">Ratio & Z-Score Analysis</h1>
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
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6">Ratio & Z-Score Analysis</h1>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const ratioAnalysis = calculateRatioZScore();

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6">Ratio & Z-Score Analysis</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Nifty/Gold Ratio Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            {ratioAnalysis ? (
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p><strong>Current Ratio:</strong> {ratioAnalysis.current.toFixed(4)}</p>
                    <p><strong>Mean Ratio:</strong> {ratioAnalysis.mean.toFixed(4)}</p>
                    <p><strong>Std Deviation:</strong> {ratioAnalysis.stdDev.toFixed(4)}</p>
                    <p><strong>Z-Score:</strong> {ratioAnalysis.zScore.toFixed(2)}</p>
                  </div>
                  <div>
                    {Math.abs(ratioAnalysis.zScore) > 2 ? (
                      <Alert className={ratioAnalysis.zScore > 2 ? "bg-red-50" : "bg-green-50"}>
                        <AlertDescription>
                          {ratioAnalysis.zScore > 2 
                            ? "Ratio is significantly above mean (potential overvaluation)"
                            : "Ratio is significantly below mean (potential undervaluation)"}
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <Alert>
                        <AlertDescription>
                          Ratio is within normal range (±2 standard deviations)
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p>Insufficient data for ratio analysis</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
