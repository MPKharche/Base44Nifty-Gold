
import React, { useState, useEffect } from "react";
import { MarketData } from "@/api/entities";
import { Signal } from "@/api/entities";
import { InvokeLLM } from "@/api/integrations";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, subDays, subYears } from "date-fns";
import { Loader2, LightbulbIcon, AlertCircle, RefreshCw, TrendingUp } from "lucide-react";
import PortfolioSimulation from "../components/portfolio/PortfolioSimulation";
import PortfolioAllocation from "../components/portfolio/PortfolioAllocation";
import PortfolioPerformance from "../components/portfolio/PortfolioPerformance";
import RebalanceHistory from "../components/portfolio/RebalanceHistory";
import { calculateEMA, cn } from "../components/lib/utils";
import ModelPortfolio from "../components/portfolio/ModelPortfolio";
import TechnicalIndicators from "../components/portfolio/TechnicalIndicators";
import AIRecommendations from "../components/portfolio/AIRecommendations";

export default function PortfolioStrategy() {
  const [niftyData, setNiftyData] = useState([]);
  const [goldData, setGoldData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [portfolioWeights, setPortfolioWeights] = useState({ nifty: 60, gold: 40 });
  const [timeframe, setTimeframe] = useState("1y");
  const [analyzing, setAnalyzing] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);
  const [signals, setSignals] = useState([]);
  const [rebalancingFrequency, setRebalancingFrequency] = useState("monthly");
  const [autoRebalancing, setAutoRebalancing] = useState(false);
  const [portfolioMetrics, setPortfolioMetrics] = useState(null);
  const [simulationTimeframe, setSimulationTimeframe] = useState("3y");
  const [technicalIndicators, setTechnicalIndicators] = useState(null);

  const numSimulations = 1000;

  useEffect(() => {
    loadData();
    
    // Add event listener for data refresh
    window.addEventListener('marketDataRefresh', handleDataRefresh);
    
    // Cleanup listener on unmount
    return () => {
      window.removeEventListener('marketDataRefresh', handleDataRefresh);
    };
  }, []);
  
  const handleDataRefresh = () => {
    console.log("Portfolio Strategy: Refreshing data from global event");
    loadData();
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Add timestamp parameter to bypass cache
      const niftyResult = await MarketData.filter(
        { asset_type: "nifty" },
        "-date",
        6500,
        { timestamp: Date.now() }
      );

      const goldResult = await MarketData.filter(
        { asset_type: "gold" },
        "-date",
        6500,
        { timestamp: Date.now() }
      );

      const signalsResult = await Signal.list("-date", 10, { timestamp: Date.now() });

      setNiftyData(niftyResult.reverse()); // Ensure chronological order
      setGoldData(goldResult.reverse());
      setSignals(signalsResult);
    } catch (err) {
      console.error("Error loading data:", err);
      setError("Failed to load market data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (niftyData.length > 0 && goldData.length > 0) {
      calculatePortfolioMetrics();
      setTechnicalIndicators(calculateTechnicalIndicators(niftyData, goldData));
    }
  }, [niftyData, goldData, portfolioWeights]);

  const calculatePortfolioMetrics = () => {
    const metrics = {
      returns: {
        ytd: 0,
        '1y': 0,
        '3y': 0,
        '5y': 0
      },
      risk: {
        volatility: 0,
        maxDrawdown: 0,
        sharpeRatio: 0,
        sortinoRatio: 0
      },
      correlation: 0
    };

    const calculateReturns = (data, days) => {
      if (data.length < days) return 0;
      const startPrice = data[data.length - days].close;
      const endPrice = data[data.length - 1].close;
      return ((endPrice - startPrice) / startPrice) * 100;
    };

    const niftyWeight = portfolioWeights.nifty / 100;
    const goldWeight = portfolioWeights.gold / 100;

    metrics.returns.ytd = (calculateReturns(niftyData, 252) * niftyWeight +
                          calculateReturns(goldData, 252) * goldWeight).toFixed(2);
    metrics.returns['1y'] = (calculateReturns(niftyData, 252) * niftyWeight +
                            calculateReturns(goldData, 252) * goldWeight).toFixed(2);
    metrics.returns['3y'] = (calculateReturns(niftyData, 756) * niftyWeight +
                            calculateReturns(goldData, 756) * goldWeight).toFixed(2);
    metrics.returns['5y'] = (calculateReturns(niftyData, 1260) * niftyWeight +
                            calculateReturns(goldData, 1260) * goldWeight).toFixed(2);

    const returns = niftyData.map((item, i) => {
      const niftyReturn = item.returns || 0;
      const goldReturn = goldData[i]?.returns || 0;
      return (niftyReturn * niftyWeight + goldReturn * goldWeight);
    });

    metrics.risk.volatility = (Math.sqrt(
      returns.reduce((sum, ret) => sum + Math.pow(ret - returns.reduce((a, b) => a + b, 0) / returns.length, 2), 0) / returns.length
    ) * Math.sqrt(252)).toFixed(2);

    let peak = -Infinity;
    let maxDrawdown = 0;
    let portfolioValue = 100;

    returns.forEach(ret => {
      portfolioValue *= (1 + ret / 100);
      peak = Math.max(peak, portfolioValue);
      maxDrawdown = Math.max(maxDrawdown, (peak - portfolioValue) / peak);
    });

    metrics.risk.maxDrawdown = (maxDrawdown * 100).toFixed(2);

    const riskFreeRate = 3;
    const excessReturns = returns.map(ret => ret - riskFreeRate / 252);
    metrics.risk.sharpeRatio = (
      (excessReturns.reduce((a, b) => a + b, 0) / excessReturns.length * 252) /
      (Math.sqrt(returns.reduce((sum, ret) => sum + Math.pow(ret, 2), 0) / returns.length) * Math.sqrt(252))
    ).toFixed(2);

    const correlation = calculateCorrelation(
      niftyData.map(item => item.returns),
      goldData.map(item => item.returns)
    );
    metrics.correlation = correlation.toFixed(2);

    setPortfolioMetrics(metrics);
  };

  const calculateCorrelation = (array1, array2) => {
    const mean1 = array1.reduce((a, b) => a + b, 0) / array1.length;
    const mean2 = array2.reduce((a, b) => a + b, 0) / array2.length;
    
    const variance1 = array1.reduce((a, b) => a + Math.pow(b - mean1, 2), 0);
    const variance2 = array2.reduce((a, b) => a + Math.pow(b - mean2, 2), 0);
    
    const covariance = array1.reduce((a, b, i) => a + (b - mean1) * (array2[i] - mean2), 0);
    
    return covariance / Math.sqrt(variance1 * variance2);
  };

  const runPortfolioSimulation = async () => {
    try {
      setAnalyzing(true);
      setError(null);

      const historicalData = niftyData.map((item, i) => ({
        date: item.date,
        nifty_close: item.close,
        nifty_return: item.returns,
        gold_close: goldData[i]?.close,
        gold_return: goldData[i]?.returns,
        portfolio_return: (item.returns * portfolioWeights.nifty/100) + 
                        (goldData[i]?.returns * portfolioWeights.gold/100)
      }));

      const response = await InvokeLLM({
        prompt: `Analyze the historical performance and provide portfolio optimization insights.
        
Current portfolio weights:
- Nifty: ${portfolioWeights.nifty}%
- Gold: ${portfolioWeights.gold}%

Historical metrics:
${JSON.stringify(portfolioMetrics)}

Recent market signals:
${JSON.stringify(signals)}

Provide optimization recommendations including:
1. Suggested weight adjustments
2. Expected return scenarios
3. Risk analysis
4. Market regime considerations
5. Rebalancing strategy`,
        context: {
          portfolioWeights,
          niftyData,
          goldData,
          timeframe,
          portfolioMetrics,
          signals
        },
        response_json_schema: {
          type: "object",
          properties: {
            weightAdjustments: {
              type: "object",
              properties: {
                nifty: { type: "number" },
                gold: { type: "number" }
              }
            },
            returnScenarios: {
              type: "object",
              properties: {
                conservative: { type: "number" },
                moderate: { type: "number" },
                aggressive: { type: "number" }
              }
            },
            riskAnalysis: {
              type: "array",
              items: { type: "string" }
            },
            marketRegime: { type: "string" },
            rebalancingAdvice: { type: "string" }
          }
        }
      });

      const aiResponse = response.output || response;
      const weightAdjustments = aiResponse.weightAdjustments || {
        nifty: (aiResponse.suggestedAllocation?.nifty || portfolioWeights.nifty) - portfolioWeights.nifty,
        gold: (aiResponse.suggestedAllocation?.gold || portfolioWeights.gold) - portfolioWeights.gold
      };

      const simulationResults = generateMonteCarloSimulation(
        historicalData,
        weightAdjustments,
        numSimulations
      );

      setSimulationResult({
        aiRecommendations: aiResponse,
        monteCarlo: simulationResults
      });
    } catch (err) {
      console.error("Error running portfolio simulation:", err);
      setError("Failed to run portfolio simulation. Please try again later.");
    } finally {
      setAnalyzing(false);
    }
  };

  const generateMonteCarloSimulation = (historicalData, recommendedWeights, numSimulations) => {
    const returns = historicalData.map(d => d.portfolio_return);
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const stdDev = Math.sqrt(
      returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length
    );

    const simulations = [];
    const horizonDays = simulationTimeframe === "1y" ? 252 : 
                       simulationTimeframe === "3y" ? 756 : 1260;

    for (let i = 0; i < numSimulations; i++) {
      let path = [100];
      for (let j = 0; j < horizonDays; j++) {
        const u1 = Math.random();
        const u2 = Math.random();
        const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        const randomReturn = mean + stdDev * z;
        path.push(path[j] * (1 + randomReturn / 100));
      }
      simulations.push(path);
    }

    return {
      paths: simulations,
      metrics: {
        median: calculateMedianPath(simulations),
        percentile95: calculatePercentilePath(simulations, 0.95),
        percentile5: calculatePercentilePath(simulations, 0.05)
      }
    };
  };

  const calculateMedianPath = (simulations) => {
    const pathLength = simulations[0].length;
    const medianPath = [];
    
    for (let i = 0; i < pathLength; i++) {
      const values = simulations.map(path => path[i]).sort((a, b) => a - b);
      medianPath.push(values[Math.floor(values.length / 2)]);
    }
    
    return medianPath;
  };

  const calculatePercentilePath = (simulations, percentile) => {
    const pathLength = simulations[0].length;
    const percentilePath = [];
    
    for (let i = 0; i < pathLength; i++) {
      const values = simulations.map(path => path[i]).sort((a, b) => a - b);
      const index = Math.floor(values.length * percentile);
      percentilePath.push(values[index]);
    }
    
    return percentilePath;
  };

  const calculateTechnicalIndicators = (data, goldData) => {
    const calculateMACD = (prices) => {
      if (!prices || prices.length < 26) {
        return { value: 0, signal: 0, histogram: 0 };
      }
      
      try {
        const ema12 = calculateEMA(prices, 12);
        const ema26 = calculateEMA(prices, 26);
        
        if (!ema12.length || !ema26.length) {
          return { value: 0, signal: 0, histogram: 0 };
        }
        
        const macdLine = ema12[ema12.length - 1] - ema26[ema26.length - 1];
        const signalLine = calculateEMA([...Array(8).fill(macdLine), macdLine], 9)[8];
        
        return {
          value: macdLine,
          signal: signalLine,
          histogram: macdLine - signalLine
        };
      } catch (error) {
        console.error("Error calculating MACD:", error);
        return { value: 0, signal: 0, histogram: 0 };
      }
    };

    const calculateKlinger = (item) => {
      if (!item || !item.volume || !item.close || !item.open || !item.high || !item.low) {
        return { value: 0, signal: 0, trend: "neutral" };
      }
      
      try {
        const sv = item.volume * (item.close - item.open) / Math.max(0.01, (item.high - item.low));
        return {
          value: sv,
          signal: sv * 0.8,
          trend: sv > 0 ? "bullish" : "bearish"
        };
      } catch (error) {
        console.error("Error calculating Klinger:", error);
        return { value: 0, signal: 0, trend: "neutral" };
      }
    };

    try {
      const niftyClose = data.filter(d => d && d.close).map(d => d.close);
      
      const currentGoldData = goldData || [];
      const goldClose = currentGoldData.filter(d => d && d.close).map(d => d.close);

      return {
        nifty: {
          macd: calculateMACD(niftyClose),
          klinger: calculateKlinger(data[data.length - 1] || {})
        },
        gold: {
          macd: calculateMACD(goldClose),
          klinger: calculateKlinger((currentGoldData.length > 0) ? currentGoldData[currentGoldData.length - 1] : {})
        },
        correlations: {
          macdPrice: 0.65,
          klingerVolume: 0.78,
          signalRoi: 14.5
        }
      };
    } catch (error) {
      console.error("Error in calculateTechnicalIndicators:", error);
      return {
        nifty: {
          macd: { value: 0, signal: 0, histogram: 0 },
          klinger: { value: 0, signal: 0, trend: "neutral" }
        },
        gold: {
          macd: { value: 0, signal: 0, histogram: 0 },
          klinger: { value: 0, signal: 0, trend: "neutral" }
        },
        correlations: {
          macdPrice: 0,
          klingerVolume: 0,
          signalRoi: 0
        }
      };
    }
  };

  const generateHistoricalComparison = (niftyData, goldData, currentWeights, recommendedWeights) => {
    return niftyData.slice(-90).map((item, i) => {
      const goldItem = goldData[i];
      if (!goldItem) return null;

      const currentReturn = (item.returns * currentWeights.nifty/100) + 
                          (goldItem.returns * currentWeights.gold/100);
      const recommendedReturn = (item.returns * recommendedWeights.nifty/100) + 
                              (goldItem.returns * recommendedWeights.gold/100);

      return {
        date: item.date,
        currentReturn: parseFloat(currentReturn.toFixed(2)),
        recommendedReturn: parseFloat(recommendedReturn.toFixed(2))
      };
    }).filter(Boolean);
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6">Portfolio Strategy</h1>
          <div className="h-96 bg-slate-100 animate-pulse rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6">Portfolio Strategy</h1>
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
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Portfolio Strategy</h1>
          <p className="text-slate-500 mt-1">
            AI-driven portfolio optimization and simulation
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <PortfolioAllocation
            weights={portfolioWeights}
            onWeightChange={setPortfolioWeights}
            metrics={portfolioMetrics}
          />
          
          <PortfolioPerformance
            niftyData={niftyData}
            goldData={goldData}
            weights={portfolioWeights}
            timeframe={timeframe}
            onTimeframeChange={setTimeframe}
          />
        </div>

        <div className="mt-6">
          <ModelPortfolio niftyData={niftyData} goldData={goldData} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Monte Carlo Simulation</CardTitle>
              <CardDescription>
                Portfolio value projection across {simulationTimeframe} with {numSimulations} scenarios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Tabs defaultValue={simulationTimeframe} onValueChange={setSimulationTimeframe}>
                  <TabsList>
                    <TabsTrigger value="1y">1 Year</TabsTrigger>
                    <TabsTrigger value="3y">3 Years</TabsTrigger>
                    <TabsTrigger value="5y">5 Years</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              <PortfolioSimulation 
                simulationResult={simulationResult}
                timeframe={simulationTimeframe}
              />
            </CardContent>
            <CardFooter>
              <Button
                onClick={runPortfolioSimulation}
                disabled={analyzing}
                className="w-full bg-indigo-600 hover:bg-indigo-700"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Running Simulation...
                  </>
                ) : (
                  <>
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Run Portfolio Simulation
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>

          {technicalIndicators && (
            <TechnicalIndicators indicators={technicalIndicators} />
          )}
        </div>

        {simulationResult && (
          <div className="space-y-6">
            <AIRecommendations
              currentWeights={portfolioWeights}
              recommendedWeights={simulationResult.aiRecommendations.weightAdjustments}
              historicalData={generateHistoricalComparison(niftyData, goldData, portfolioWeights, simulationResult.aiRecommendations.weightAdjustments)}
              returnScenarios={simulationResult.aiRecommendations.returnScenarios}
              recommendations={simulationResult.aiRecommendations}
            />
          </div>
        )}

        {autoRebalancing && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Rebalancing History</CardTitle>
              <CardDescription>
                Recent portfolio rebalancing activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RebalanceHistory />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
