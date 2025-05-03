import React, { useState, useEffect } from "react";
import { MarketData } from "@/api/entities";
import { Signal } from "@/api/entities";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InvokeLLM } from "@/api/integrations";
import { format, subDays } from "date-fns";
import { Loader2, LightbulbIcon, AlertCircle } from "lucide-react";

export default function AdvancedInsights() {
  const [niftyData, setNiftyData] = useState([]);
  const [goldData, setGoldData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeframe, setTimeframe] = useState("90");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [signals, setSignals] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load Nifty data
      const niftyResult = await MarketData.filter(
        { asset_type: "nifty" },
        "-date",
        1000
      );

      // Load Gold data
      const goldResult = await MarketData.filter(
        { asset_type: "gold" },
        "-date",
        1000
      );

      // Load recent signals
      const signalsResult = await Signal.list("-date", 10);

      setNiftyData(niftyResult.reverse()); // Chronological order
      setGoldData(goldResult.reverse()); // Chronological order
      setSignals(signalsResult);
    } catch (err) {
      console.error("Error loading data:", err);
      setError("Failed to load market data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const performAdvancedAnalysis = async () => {
    try {
      setAnalyzing(true);
      setError(null);
      
      // Filter data based on timeframe
      const days = parseInt(timeframe);
      if (isNaN(days)) return;
      
      const cutoffDate = format(subDays(new Date(), days), "yyyy-MM-dd");
      
      const filteredNifty = niftyData.filter(item => item.date >= cutoffDate);
      const filteredGold = goldData.filter(item => item.date >= cutoffDate);
      
      // Prepare input data by matching dates
      const combinedData = [];
      const niftyMap = new Map();
      
      filteredNifty.forEach(item => {
        niftyMap.set(item.date, item);
      });
      
      for (const goldItem of filteredGold) {
        const niftyItem = niftyMap.get(goldItem.date);
        
        if (niftyItem) {
          combinedData.push({
            date: goldItem.date,
            nifty_close: niftyItem.close,
            nifty_return: niftyItem.returns,
            gold_close: goldItem.close,
            gold_return: goldItem.returns
          });
        }
      }
      
      // Get recent signals
      const recentSignals = signals.slice(0, 5);
      
      // Use LLM to perform advanced analysis
      const response = await InvokeLLM({
        prompt: `Analyze the relationship between Nifty and Gold markets based on the provided data. 
Identify any meaningful patterns or regimes in their relationship.
Provide trading strategies based on the current market conditions.

Market data (last ${days} days): ${JSON.stringify(combinedData.slice(-30))}

Recent trading signals: ${JSON.stringify(recentSignals)}

Respond with a comprehensive analysis including:
1. Current market regime identification
2. Key technical observations
3. Correlation pattern analysis
4. Specific trading strategies for the current conditions
5. Risk management considerations
6. Outlook for the coming week`,
        response_json_schema: {
          type: "object",
          properties: {
            marketRegime: { type: "string" },
            regimeDescription: { type: "string" },
            keyObservations: { type: "array", items: { type: "string" } },
            correlationAnalysis: { type: "string" },
            technicalIndicators: {
              type: "object",
              properties: {
                nifty: { type: "array", items: { type: "string" } },
                gold: { type: "array", items: { type: "string" } }
              }
            },
            tradingStrategies: { type: "array", items: { type: "string" } },
            riskManagement: { type: "array", items: { type: "string" } },
            outlook: { type: "string" }
          }
        }
      });
      
      setAnalysisResult(response);
    } catch (err) {
      console.error("Error performing advanced analysis:", err);
      setError("Failed to perform advanced analysis. Please try again later.");
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6">Advanced Insights</h1>
          <div className="h-96 bg-slate-100 animate-pulse rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6">Advanced Insights</h1>
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Advanced Insights</h1>
          <p className="text-slate-500 mt-1">
            AI-powered deep analysis and trading strategies
          </p>
        </div>

        <div className="flex justify-between items-center mb-6">
          <Tabs defaultValue={timeframe} onValueChange={setTimeframe}>
            <TabsList>
              <TabsTrigger value="30">30D</TabsTrigger>
              <TabsTrigger value="90">90D</TabsTrigger>
              <TabsTrigger value="180">180D</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Button 
            onClick={performAdvancedAnalysis}
            disabled={analyzing || niftyData.length === 0 || goldData.length === 0}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {analyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <LightbulbIcon className="mr-2 h-4 w-4" />
                Analyze Markets
              </>
            )}
          </Button>
        </div>

        {analyzing ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10">
              <Loader2 className="h-10 w-10 text-indigo-600 animate-spin mb-4" />
              <p className="text-lg font-medium text-slate-800">Analyzing Market Patterns</p>
              <p className="text-slate-500 mt-2">This may take a few moments...</p>
            </CardContent>
          </Card>
        ) : analysisResult ? (
          <div className="space-y-6">
            <Card className="shadow-md overflow-hidden border-t-4" style={{ borderTopColor: "#4f46e5" }}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-8 bg-indigo-600 rounded-full"></div>
                  <div>
                    <CardTitle>Current Market Regime</CardTitle>
                    <CardDescription>
                      Pattern classification based on statistical analysis
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4 pb-4 border-b">
                  <div className="text-lg font-semibold text-indigo-700">
                    {analysisResult.marketRegime}
                  </div>
                  <p className="mt-2 text-slate-600">
                    {analysisResult.regimeDescription}
                  </p>
                </div>
                
                <div className="mb-4">
                  <h3 className="text-md font-medium mb-2">Correlation Analysis</h3>
                  <p className="text-slate-600">
                    {analysisResult.correlationAnalysis}
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-blue-50">
                    <h4 className="font-medium text-blue-700 mb-2">Nifty Indicators</h4>
                    <ul className="space-y-1 text-sm text-slate-700">
                      {analysisResult.technicalIndicators.nifty.map((indicator, i) => (
                        <li key={i} className="flex items-start">
                          <span className="inline-block w-2 h-2 bg-blue-600 rounded-full mt-1.5 mr-2"></span>
                          {indicator}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-amber-50">
                    <h4 className="font-medium text-amber-700 mb-2">Gold Indicators</h4>
                    <ul className="space-y-1 text-sm text-slate-700">
                      {analysisResult.technicalIndicators.gold.map((indicator, i) => (
                        <li key={i} className="flex items-start">
                          <span className="inline-block w-2 h-2 bg-amber-600 rounded-full mt-1.5 mr-2"></span>
                          {indicator}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center">
                      <div className="w-3 h-3 rounded-full bg-purple-600"></div>
                    </div>
                    Key Observations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysisResult.keyObservations.map((observation, i) => (
                      <li key={i} className="flex items-start pb-2 border-b border-slate-100 last:border-0">
                        <span className="inline-block w-5 h-5 bg-purple-100 rounded-full text-purple-700 flex items-center justify-center text-xs font-medium mr-2 mt-0.5">
                          {i + 1}
                        </span>
                        <span className="text-slate-700">{observation}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                      <div className="w-3 h-3 rounded-full bg-green-600"></div>
                    </div>
                    Trading Strategies
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysisResult.tradingStrategies.map((strategy, i) => (
                      <li key={i} className="flex items-start pb-2 border-b border-slate-100 last:border-0">
                        <span className="inline-block w-5 h-5 bg-green-100 rounded-full text-green-700 flex items-center justify-center text-xs font-medium mr-2 mt-0.5">
                          {i + 1}
                        </span>
                        <span className="text-slate-700">{strategy}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
            
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-red-600"></div>
                  </div>
                  Risk Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysisResult.riskManagement.map((risk, i) => (
                    <li key={i} className="flex items-start">
                      <AlertCircle className="w-4 h-4 text-red-600 mr-2 mt-0.5" />
                      <span className="text-slate-700">{risk}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            
            <Card className="shadow-md bg-gradient-to-r from-slate-50 to-indigo-50">
              <CardHeader>
                <CardTitle>Market Outlook</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-white p-4 rounded-lg border border-slate-200">
                  <p className="text-slate-700 italic">"{analysisResult.outlook}"</p>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <LightbulbIcon className="h-16 w-16 text-slate-300 mb-4" />
              <p className="text-lg font-medium text-slate-700">Generate Advanced Market Insights</p>
              <p className="text-slate-500 mt-1 mb-6 text-center max-w-md">
                Click the "Analyze Markets" button to get AI-powered analysis and trading strategies
                based on the correlation patterns between Nifty and Gold
              </p>
              <Button
                onClick={performAdvancedAnalysis}
                disabled={analyzing || niftyData.length === 0 || goldData.length === 0}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <LightbulbIcon className="mr-2 h-4 w-4" />
                Analyze Markets
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}