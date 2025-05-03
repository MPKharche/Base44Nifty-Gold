import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InvokeLLM } from "@/api/integrations";
import { Loader2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, subDays } from "date-fns";

export default function GrangerCausality({ niftyData, goldData }) {
  const [timeWindow, setTimeWindow] = useState("90");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (!niftyData || !goldData || niftyData.length === 0 || goldData.length === 0) return;
    
    analyzeGrangerCausality();
  }, [niftyData, goldData, timeWindow]);
  
  const analyzeGrangerCausality = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Filter data based on timeWindow
      const days = parseInt(timeWindow);
      if (isNaN(days)) return;
      
      const cutoffDate = format(subDays(new Date(), days), "yyyy-MM-dd");
      
      const filteredNifty = niftyData.filter(item => item.date >= cutoffDate);
      const filteredGold = goldData.filter(item => item.date >= cutoffDate);
      
      // Extract returns
      const niftyReturns = filteredNifty.map(item => ({
        date: item.date,
        returns: item.returns
      }));
      
      const goldReturns = filteredGold.map(item => ({
        date: item.date,
        returns: item.returns
      }));
      
      // Use LLM to analyze Granger causality
      const response = await InvokeLLM({
        prompt: `Analyze the following time series data for Nifty and Gold returns to test for Granger causality. 
Determine if changes in Nifty returns cause changes in Gold returns, or vice versa.
Return a comprehensive analysis with p-values, interpretation, and trading implications.

Nifty Returns: ${JSON.stringify(niftyReturns)}
Gold Returns: ${JSON.stringify(goldReturns)}

Time window: ${timeWindow} days

Respond with a JSON object containing the following fields:
1. niftyToGold: object with test results for Nifty causing Gold
2. goldToNifty: object with test results for Gold causing Nifty
3. interpretation: text explaining the results
4. tradingImplications: text explaining how traders can use this information
5. robustness: assessment of how robust/reliable these results are given the data`,
        response_json_schema: {
          type: "object",
          properties: {
            niftyToGold: {
              type: "object",
              properties: {
                pValue: { type: "number" },
                significant: { type: "boolean" },
                lagStrength: { type: "array", items: { type: "number" } }
              }
            },
            goldToNifty: {
              type: "object",
              properties: {
                pValue: { type: "number" },
                significant: { type: "boolean" },
                lagStrength: { type: "array", items: { type: "number" } }
              }
            },
            interpretation: { type: "string" },
            tradingImplications: { type: "string" },
            robustness: { type: "string" }
          }
        }
      });
      
      setResults(response);
    } catch (err) {
      console.error("Error analyzing Granger causality:", err);
      setError("Failed to analyze the causal relationship. Please try again later.");
    } finally {
      setLoading(false);
    }
  };
  
  if (!niftyData || !goldData || niftyData.length === 0 || goldData.length === 0) {
    return (
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Granger Causality Analysis</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-slate-500">No data available for causality analysis</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-md">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Granger Causality Analysis</CardTitle>
        <Tabs defaultValue={timeWindow} onValueChange={setTimeWindow}>
          <TabsList>
            <TabsTrigger value="30">30D</TabsTrigger>
            <TabsTrigger value="90">90D</TabsTrigger>
            <TabsTrigger value="180">180D</TabsTrigger>
            <TabsTrigger value="365">365D</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[300px] flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600 mb-4" />
              <p className="text-slate-600">Analyzing causality relationships...</p>
              <p className="text-xs text-slate-500 mt-1">This may take a few moments</p>
            </div>
          </div>
        ) : error ? (
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-red-500">{error}</p>
          </div>
        ) : results ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-2">Nifty → Gold</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-600">p-value:</span>
                    <span className="font-medium">{results.niftyToGold.pValue.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Significant:</span>
                    <span className={results.niftyToGold.significant ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                      {results.niftyToGold.significant ? "Yes" : "No"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-600 block mb-1">Lag strength:</span>
                    <div className="flex items-center gap-1">
                      {results.niftyToGold.lagStrength.map((strength, index) => (
                        <div 
                          key={index}
                          className="h-16 w-6 bg-blue-100 rounded-sm relative"
                        >
                          <div 
                            className="absolute bottom-0 left-0 right-0 bg-blue-600 rounded-sm"
                            style={{ height: `${Math.abs(strength) * 100}%` }}
                          ></div>
                          <span className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-xs">
                            {index + 1}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="text-xs text-slate-500 mt-6">Lag (days)</div>
                  </div>
                </div>
              </div>
              
              <div className="border p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-2">Gold → Nifty</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-600">p-value:</span>
                    <span className="font-medium">{results.goldToNifty.pValue.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Significant:</span>
                    <span className={results.goldToNifty.significant ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                      {results.goldToNifty.significant ? "Yes" : "No"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-600 block mb-1">Lag strength:</span>
                    <div className="flex items-center gap-1">
                      {results.goldToNifty.lagStrength.map((strength, index) => (
                        <div 
                          key={index}
                          className="h-16 w-6 bg-amber-100 rounded-sm relative"
                        >
                          <div 
                            className="absolute bottom-0 left-0 right-0 bg-amber-600 rounded-sm"
                            style={{ height: `${Math.abs(strength) * 100}%` }}
                          ></div>
                          <span className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-xs">
                            {index + 1}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="text-xs text-slate-500 mt-6">Lag (days)</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="border-t pt-4">
              <h3 className="text-lg font-medium mb-2">Interpretation</h3>
              <p className="text-slate-700">{results.interpretation}</p>
            </div>
            
            <div className="border-t pt-4">
              <h3 className="text-lg font-medium mb-2">Trading Implications</h3>
              <p className="text-slate-700">{results.tradingImplications}</p>
            </div>
            
            <div className="border-t pt-4">
              <h3 className="text-lg font-medium mb-2">Robustness Assessment</h3>
              <p className="text-slate-700">{results.robustness}</p>
            </div>
          </div>
        ) : (
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-slate-500">Click "Analyze" to perform Granger causality tests</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}