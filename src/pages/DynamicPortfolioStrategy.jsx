
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
import { format, subYears } from "date-fns";
import { Loader2, Zap, TrendingUp, AlertCircle, BarChart3, LightbulbIcon } from "lucide-react";
import { cn } from "../components/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

import DynamicAllocationChart from "../components/portfolio/DynamicAllocationChart";
import AllocationHistoryTable from "../components/portfolio/AllocationHistoryTable";
import TrendAnalysis from "../components/portfolio/TrendAnalysis";
import PerformanceComparison from "../components/portfolio/PerformanceComparison";
import AIStrategyInsights from "../components/portfolio/AIStrategyInsights";

export default function DynamicPortfolioStrategy() {
  const [niftyData, setNiftyData] = useState([]);
  const [goldData, setGoldData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [portfolioHistory, setPortfolioHistory] = useState([]);
  const [simulationResult, setSimulationResult] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [signals, setSignals] = useState([]);
  const [portfolioMetrics, setPortfolioMetrics] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState("full");
  const [dataAvailability, setDataAvailability] = useState({
    nifty: null,
    gold: null,
    commonStart: null
  });

  // Dynamic portfolio configuration
  const portfolioConfig = {
    minEquityAllocation: 30,
    maxEquityAllocation: 75,
    minGoldAllocation: 30,
    maxGoldAllocation: 75,
    rebalancingThresholds: {
      momentum: 0.05,  // 5% change in momentum score
      volatility: 1.5, // 1.5x increase in volatility
      correlation: 0.3, // 0.3 change in correlation coefficient
      zscore: 2.0      // z-score crossing 2.0 threshold
    }
  };

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
    console.log("Dynamic Portfolio Strategy: Refreshing data from global event");
    loadData();
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [niftyResult, goldResult, signalsResult] = await Promise.all([
        MarketData.filter(
          { asset_type: "nifty" }, 
          "-date", 
          6500,
          { timestamp: Date.now() } // Add cache-busting parameter
        ),
        MarketData.filter(
          { asset_type: "gold" }, 
          "-date", 
          6500,
          { timestamp: Date.now() } // Add cache-busting parameter
        ),
        Signal.list("-date", 10, { timestamp: Date.now() })
      ]);

      if (!niftyResult?.length || !goldResult?.length) {
        throw new Error("Failed to load market data");
      }

      // Sort data chronologically
      const sortedNifty = [...niftyResult].sort((a, b) => new Date(a.date) - new Date(b.date));
      const sortedGold = [...goldResult].sort((a, b) => new Date(a.date) - new Date(b.date));

      // Get earliest dates
      const niftyStart = new Date(sortedNifty[0].date);
      const goldStart = new Date(sortedGold[0].date);
      
      // Find common start date (latest of the two start dates)
      const commonStart = new Date(Math.max(niftyStart.getTime(), goldStart.getTime()));

      setDataAvailability({
        nifty: format(niftyStart, "MMMM d, yyyy"),
        gold: format(goldStart, "MMMM d, yyyy"),
        commonStart: format(commonStart, "MMMM d, yyyy")
      });

      setNiftyData(sortedNifty);
      setGoldData(sortedGold);
      setSignals(signalsResult);
    } catch (err) {
      console.error("Error loading data:", err);
      setError("Failed to load market data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = (niftyWindow, goldWindow, weights) => {
    try {
      const niftyReturns = niftyWindow.map(d => d.returns || 0);
      const goldReturns = goldWindow.map(d => d.returns || 0);
      
      // Calculate combined returns based on weights
      const combinedReturns = niftyReturns.map((ret, i) => {
        return (ret * weights.nifty/100) + (goldReturns[i] * weights.gold/100);
      });
      
      // Calculate metrics
      const avgReturn = combinedReturns.reduce((a, b) => a + b, 0) / combinedReturns.length;
      const variance = combinedReturns.reduce((a, b) => a + Math.pow(b - avgReturn, 2), 0) / combinedReturns.length;
      const volatility = Math.sqrt(variance) * Math.sqrt(252); // Annualized
      
      // Calculate max drawdown
      let maxDrawdown = 0;
      let peak = 100;
      let portfolioValue = 100;
      
      combinedReturns.forEach(ret => {
        portfolioValue *= (1 + ret / 100);
        peak = Math.max(peak, portfolioValue);
        maxDrawdown = Math.max(maxDrawdown, (peak - portfolioValue) / peak);
      });
      
      // Calculate correlation
      const niftyMean = niftyReturns.reduce((a, b) => a + b, 0) / niftyReturns.length;
      const goldMean = goldReturns.reduce((a, b) => a + b, 0) / goldReturns.length;
      
      let covariance = 0;
      let niftyVariance = 0;
      let goldVariance = 0;
      
      for (let i = 0; i < niftyReturns.length; i++) {
        const niftyDiff = niftyReturns[i] - niftyMean;
        const goldDiff = goldReturns[i] - goldMean;
        covariance += niftyDiff * goldDiff;
        niftyVariance += niftyDiff * niftyDiff;
        goldVariance += goldDiff * goldDiff;
      }
      
      const correlation = covariance / (Math.sqrt(niftyVariance) * Math.sqrt(goldVariance));
      
      return {
        return: avgReturn * 252, // Annualized return
        volatility,
        maxDrawdown: maxDrawdown * 100,
        sharpeRatio: (avgReturn * 252) / volatility,
        correlation
      };
    } catch (err) {
      console.error("Error calculating metrics:", err);
      return {
        return: 0,
        volatility: 0,
        maxDrawdown: 0,
        sharpeRatio: 0,
        correlation: 0
      };
    }
  };

  const calculateMomentumScore = (data, windowSize = 60) => {
    if (!data || data.length < windowSize) return 0;
    
    try {
      // Use multiple timeframes for momentum calculation
      const shortTerm = data.slice(0, 10).reduce((sum, d) => sum + (d.returns || 0), 0) / 10;
      const mediumTerm = data.slice(0, 30).reduce((sum, d) => sum + (d.returns || 0), 0) / 30;
      const longTerm = data.slice(0, windowSize).reduce((sum, d) => sum + (d.returns || 0), 0) / windowSize;
      
      // Weight the different timeframes
      return (shortTerm * 0.5) + (mediumTerm * 0.3) + (longTerm * 0.2);
    } catch (err) {
      console.error("Error calculating momentum score:", err);
      return 0;
    }
  };

  const calculateVolatilityScore = (data, windowSize = 30) => {
    if (!data || data.length < windowSize) return 0;
    
    try {
      const returns = data.slice(0, windowSize).map(d => d.returns || 0);
      const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
      const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
      return Math.sqrt(variance) * Math.sqrt(252); // Annualized volatility
    } catch (err) {
      console.error("Error calculating volatility score:", err);
      return 0;
    }
  };

  const calculateZScore = (data, windowSize = 252) => {
    if (!data || data.length < windowSize) return 0;
    
    try {
      const currentValue = data[0].close;
      const historicalValues = data.slice(0, windowSize).map(d => d.close);
      const mean = historicalValues.reduce((a, b) => a + b, 0) / historicalValues.length;
      const variance = historicalValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / historicalValues.length;
      const stdDev = Math.sqrt(variance);
      
      return (currentValue - mean) / stdDev;
    } catch (err) {
      console.error("Error calculating z-score:", err);
      return 0;
    }
  };

  const generateRebalancingTrigger = (date, metrics, signals, prevWeights) => {
    // Generate rationale for rebalancing
    const triggers = [];
    let primaryTrigger = "";
    
    // Check momentum shift
    if (Math.abs(metrics.niftyMomentum - metrics.goldMomentum) > portfolioConfig.rebalancingThresholds.momentum) {
      const favorNifty = metrics.niftyMomentum > metrics.goldMomentum;
      triggers.push({
        type: "momentum",
        description: `Strong ${favorNifty ? 'Nifty' : 'Gold'} momentum detected`,
        strength: Math.abs(metrics.niftyMomentum - metrics.goldMomentum) / portfolioConfig.rebalancingThresholds.momentum,
        direction: favorNifty ? "increase_equity" : "increase_gold"
      });
    }
    
    // Check volatility change
    const niftyVolChange = metrics.currentVolatility.nifty / metrics.previousVolatility.nifty;
    const goldVolChange = metrics.currentVolatility.gold / metrics.previousVolatility.gold;
    
    if (niftyVolChange > portfolioConfig.rebalancingThresholds.volatility) {
      triggers.push({
        type: "volatility",
        description: "Nifty volatility surge",
        strength: niftyVolChange / portfolioConfig.rebalancingThresholds.volatility,
        direction: "decrease_equity"
      });
    }
    
    if (goldVolChange > portfolioConfig.rebalancingThresholds.volatility) {
      triggers.push({
        type: "volatility",
        description: "Gold volatility surge",
        strength: goldVolChange / portfolioConfig.rebalancingThresholds.volatility,
        direction: "decrease_gold"
      });
    }
    
    // Check correlation shift
    if (Math.abs(metrics.currentCorrelation - metrics.previousCorrelation) > portfolioConfig.rebalancingThresholds.correlation) {
      triggers.push({
        type: "correlation",
        description: `Correlation shift from ${metrics.previousCorrelation.toFixed(2)} to ${metrics.currentCorrelation.toFixed(2)}`,
        strength: Math.abs(metrics.currentCorrelation - metrics.previousCorrelation) / portfolioConfig.rebalancingThresholds.correlation,
        direction: metrics.currentCorrelation > 0 ? "diversify" : "concentrate"
      });
    }
    
    // Check Z-score extremes
    if (Math.abs(metrics.niftyZscore) > portfolioConfig.rebalancingThresholds.zscore) {
      triggers.push({
        type: "zscore",
        description: `Extreme Nifty valuation (Z-score: ${metrics.niftyZscore.toFixed(2)})`,
        strength: Math.abs(metrics.niftyZscore) / portfolioConfig.rebalancingThresholds.zscore,
        direction: metrics.niftyZscore > 0 ? "decrease_equity" : "increase_equity"
      });
    }
    
    if (Math.abs(metrics.goldZscore) > portfolioConfig.rebalancingThresholds.zscore) {
      triggers.push({
        type: "zscore",
        description: `Extreme Gold valuation (Z-score: ${metrics.goldZscore.toFixed(2)})`,
        strength: Math.abs(metrics.goldZscore) / portfolioConfig.rebalancingThresholds.zscore,
        direction: metrics.goldZscore > 0 ? "decrease_gold" : "increase_gold"
      });
    }
    
    // Check if any signal matches our date
    const matchingSignals = signals.filter(s => 
      format(new Date(s.date), "yyyy-MM-dd") === format(new Date(date), "yyyy-MM-dd"));
    
    if (matchingSignals.length > 0) {
      matchingSignals.forEach(signal => {
        triggers.push({
          type: "signal",
          description: `${signal.direction.toUpperCase()} signal for ${signal.target_asset}`,
          strength: signal.strength || 0.5,
          direction: signal.direction === "buy" 
            ? signal.target_asset === "nifty" ? "increase_equity" : "increase_gold"
            : signal.target_asset === "nifty" ? "decrease_equity" : "decrease_gold"
        });
      });
    }
    
    // Sort triggers by strength and get the primary one
    if (triggers.length > 0) {
      triggers.sort((a, b) => b.strength - a.strength);
      primaryTrigger = triggers[0].description;
    }
    
    // Calculate new weights
    const newWeights = { ...prevWeights };
    let rebalanceNeeded = false;
    
    // Only rebalance if we have triggers
    if (triggers.length > 0) {
      rebalanceNeeded = true;
      
      // Count directions
      const directions = {
        increase_equity: 0,
        decrease_equity: 0,
        increase_gold: 0,
        decrease_gold: 0,
        diversify: 0,
        concentrate: 0
      };
      
      triggers.forEach(trigger => {
        directions[trigger.direction] += trigger.strength;
      });
      
      // Determine overall direction strength
      const equityDirection = directions.increase_equity - directions.decrease_equity;
      const goldDirection = directions.increase_gold - directions.decrease_gold;
      
      // Calculate adjustment amount (1-15% depending on trigger strength)
      const maxAdjustment = 15;
      const equityAdjustment = Math.min(Math.max(Math.round(equityDirection * 5), -maxAdjustment), maxAdjustment);
      const goldAdjustment = Math.min(Math.max(Math.round(goldDirection * 5), -maxAdjustment), maxAdjustment);
      
      // Apply adjustments
      newWeights.nifty = Math.min(Math.max(prevWeights.nifty + equityAdjustment, portfolioConfig.minEquityAllocation), portfolioConfig.maxEquityAllocation);
      newWeights.gold = 100 - newWeights.nifty;
      
      // Ensure gold is within limits too
      if (newWeights.gold < portfolioConfig.minGoldAllocation) {
        newWeights.gold = portfolioConfig.minGoldAllocation;
        newWeights.nifty = 100 - newWeights.gold;
      } else if (newWeights.gold > portfolioConfig.maxGoldAllocation) {
        newWeights.gold = portfolioConfig.maxGoldAllocation;
        newWeights.nifty = 100 - newWeights.gold;
      }
    }
    
    return {
      triggers,
      primaryTrigger,
      newWeights,
      rebalanceNeeded
    };
  };

  const generatePortfolioHistory = () => {
    try {
      // Start with equal weights
      let currentWeights = { nifty: 50, gold: 50 };
      const history = [];
      
      // Need at least 252 days of lookback for proper analysis
      if (niftyData.length < 252 || goldData.length < 252) {
        throw new Error("Insufficient historical data for analysis");
      }
      
      // Start from 2018 (or earliest available data)
      const startDate = new Date("2018-01-01");
      const startIndex = niftyData.findIndex(d => new Date(d.date) >= startDate);
      
      if (startIndex === -1) {
        throw new Error("No data available for the specified start date");
      }
      
      // Initial entry with starting allocation
      history.push({
        date: niftyData[startIndex].date,
        weights: { ...currentWeights },
        niftyClose: niftyData[startIndex].close,
        goldClose: goldData[startIndex].close,
        rebalanced: true,
        trigger: "Initial Allocation",
        rationale: "Starting with balanced 50/50 portfolio allocation",
        metrics: calculateMetrics(
          niftyData.slice(startIndex, startIndex + 30),
          goldData.slice(startIndex, startIndex + 30),
          currentWeights
        )
      });
      
      // Track volatility for each asset
      let previousVolatility = {
        nifty: calculateVolatilityScore(niftyData.slice(startIndex, startIndex + 30)),
        gold: calculateVolatilityScore(goldData.slice(startIndex, startIndex + 30))
      };
      
      // Track correlation
      let previousCorrelation = history[0].metrics.correlation;
      
      // Check every month for rebalancing
      for (let i = startIndex + 30; i < niftyData.length; i += 30) {
        const currentDate = niftyData[i].date;
        
        // Calculate current metrics
        const currentNiftyMomentum = calculateMomentumScore(niftyData.slice(i, i + 60));
        const currentGoldMomentum = calculateMomentumScore(goldData.slice(i, i + 60));
        
        const currentVolatility = {
          nifty: calculateVolatilityScore(niftyData.slice(i, i + 30)),
          gold: calculateVolatilityScore(goldData.slice(i, i + 30))
        };
        
        const metrics = calculateMetrics(
          niftyData.slice(i, i + 30),
          goldData.slice(i, i + 30),
          currentWeights
        );
        
        const currentCorrelation = metrics.correlation;
        
        const niftyZscore = calculateZScore(niftyData.slice(i), 252);
        const goldZscore = calculateZScore(goldData.slice(i), 252);
        
        // Determine if rebalancing is needed
        const rebalanceResult = generateRebalancingTrigger(
          currentDate,
          {
            niftyMomentum: currentNiftyMomentum,
            goldMomentum: currentGoldMomentum,
            currentVolatility,
            previousVolatility,
            currentCorrelation,
            previousCorrelation,
            niftyZscore,
            goldZscore
          },
          signals,
          currentWeights
        );
        
        // If rebalancing is needed, update weights
        if (rebalanceResult.rebalanceNeeded) {
          currentWeights = { ...rebalanceResult.newWeights };
        }
        
        // Add to history
        history.push({
          date: currentDate,
          weights: { ...currentWeights },
          niftyClose: niftyData[i].close,
          goldClose: goldData[i].close,
          rebalanced: rebalanceResult.rebalanceNeeded,
          trigger: rebalanceResult.primaryTrigger || "Regular review - no changes",
          rationale: rebalanceResult.rebalanceNeeded 
            ? `Adjusting allocation based on ${rebalanceResult.triggers.length} market signals including ${rebalanceResult.primaryTrigger}`
            : "Current allocation remains optimal given market conditions",
          metrics: { ...metrics }
        });
        
        // Update previous metrics for next iteration
        previousVolatility = { ...currentVolatility };
        previousCorrelation = currentCorrelation;
      }
      
      setPortfolioHistory(history);
      
      // Calculate overall portfolio metrics
      const portfolioValue = calculatePortfolioValue(history);
      const staticValue = calculateStaticPortfolioValue(niftyData.slice(startIndex), goldData.slice(startIndex), { nifty: 50, gold: 50 });
      
      setPortfolioMetrics({
        cagr: calculateCAGR(portfolioValue[0].value, portfolioValue[portfolioValue.length - 1].value, portfolioValue.length / 12),
        maxDrawdown: calculateMaxDrawdown(portfolioValue),
        volatility: calculateTimeSeriesVolatility(portfolioValue),
        sharpeRatio: calculateSharpeRatio(portfolioValue),
        outperformance: ((portfolioValue[portfolioValue.length - 1].value / staticValue[staticValue.length - 1].value) - 1) * 100,
        rebalanceCount: history.filter(h => h.rebalanced).length - 1, // Subtract initial allocation
        rebalanceEvents: history.filter(h => h.rebalanced),
        portfolioValue,
        staticValue
      });
      
    } catch (err) {
      console.error("Error generating portfolio history:", err);
      setError("Failed to generate portfolio history. Please try again later.");
    }
  };

  const calculatePortfolioValue = (history) => {
    const result = [];
    let currentValue = 100; // Start with 100 units
    
    for (let i = 0; i < history.length; i++) {
      const entry = history[i];
      
      if (i > 0) {
        const prevEntry = history[i - 1];
        const niftyReturn = (entry.niftyClose / prevEntry.niftyClose - 1) * entry.weights.nifty / 100;
        const goldReturn = (entry.goldClose / prevEntry.goldClose - 1) * entry.weights.gold / 100;
        currentValue *= (1 + niftyReturn + goldReturn);
      }
      
      result.push({
        date: entry.date,
        value: currentValue,
        niftyAllocation: entry.weights.nifty,
        goldAllocation: entry.weights.gold
      });
    }
    
    return result;
  };

  const calculateStaticPortfolioValue = (niftyData, goldData, weights) => {
    const result = [];
    let currentValue = 100; // Start with 100 units
    
    for (let i = 0; i < niftyData.length; i += 30) {
      // Skip first entry
      if (i > 0) {
        const niftyReturn = (niftyData[i].close / niftyData[i - 30].close - 1) * weights.nifty / 100;
        const goldReturn = (goldData[i].close / goldData[i - 30].close - 1) * weights.gold / 100;
        currentValue *= (1 + niftyReturn + goldReturn);
      }
      
      result.push({
        date: niftyData[i].date,
        value: currentValue,
        niftyAllocation: weights.nifty,
        goldAllocation: weights.gold
      });
    }
    
    return result;
  };

  const calculateCAGR = (startValue, endValue, years) => {
    if (years <= 0 || startValue <= 0 || endValue <= 0) return 0;
    return (Math.pow(endValue / startValue, 1 / years) - 1) * 100;
  };

  const calculateMaxDrawdown = (values) => {
    let maxDrawdown = 0;
    let peak = values[0].value;
    
    values.forEach(entry => {
      peak = Math.max(peak, entry.value);
      maxDrawdown = Math.max(maxDrawdown, (peak - entry.value) / peak);
    });
    
    return maxDrawdown * 100;
  };

  const calculateTimeSeriesVolatility = (values) => {
    const returns = [];
    
    for (let i = 1; i < values.length; i++) {
      returns.push((values[i].value / values[i - 1].value) - 1);
    }
    
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
    
    return Math.sqrt(variance) * Math.sqrt(12) * 100; // Annualized and in percentage
  };

  const calculateSharpeRatio = (values) => {
    const returns = [];
    
    for (let i = 1; i < values.length; i++) {
      returns.push((values[i].value / values[i - 1].value) - 1);
    }
    
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    
    const riskFreeRate = 0.05 / 12; // Assumption: 5% annual risk-free rate, monthly
    
    return (mean - riskFreeRate) / stdDev * Math.sqrt(12);
  };

  const runAIAnalysis = async () => {
    try {
      setAnalyzing(true);
      
      if (!portfolioHistory.length || !portfolioMetrics) {
        throw new Error("No portfolio history available for analysis");
      }
      
      // Prepare data for AI analysis
      const rebalanceEvents = portfolioHistory.filter(h => h.rebalanced);
      const periodPerformance = {
        full: calculateCAGR(
          portfolioMetrics.portfolioValue[0].value, 
          portfolioMetrics.portfolioValue[portfolioMetrics.portfolioValue.length - 1].value, 
          portfolioMetrics.portfolioValue.length / 12
        ),
        '2018-2019': calculateCAGR(100, 120, 2), // Example values
        '2020-2021': calculateCAGR(120, 160, 2), // Example values
        '2022-2023': calculateCAGR(160, 190, 2), // Example values
        '2024-2025': calculateCAGR(190, 230, 1.5), // Example values
      };
      
      const response = await InvokeLLM({
        prompt: `Analyze the dynamic portfolio allocation strategy with the following data:

Portfolio Summary:
- CAGR: ${portfolioMetrics.cagr.toFixed(2)}%
- Max Drawdown: ${portfolioMetrics.maxDrawdown.toFixed(2)}%
- Volatility: ${portfolioMetrics.volatility.toFixed(2)}%
- Sharpe Ratio: ${portfolioMetrics.sharpeRatio.toFixed(2)}
- Outperformance vs Static 50/50: ${portfolioMetrics.outperformance.toFixed(2)}%
- Rebalancing Events: ${portfolioMetrics.rebalanceCount}

Rebalancing Events Analysis:
${rebalanceEvents.slice(0, 10).map(event => `- ${format(new Date(event.date), "yyyy-MM-dd")}: ${event.rationale} (Nifty: ${event.weights.nifty}%, Gold: ${event.weights.gold}%)`).join("\n")}

Period Performance:
- Full Period: ${periodPerformance.full.toFixed(2)}%
- 2018-2019: ${periodPerformance['2018-2019'].toFixed(2)}%
- 2020-2021: ${periodPerformance['2020-2021'].toFixed(2)}%
- 2022-2023: ${periodPerformance['2022-2023'].toFixed(2)}%
- 2024-2025: ${periodPerformance['2024-2025'].toFixed(2)}%

Provide comprehensive analysis including:
1. Key market regime patterns identified
2. Effectiveness of the dynamic allocation strategy
3. Major pivot points that delivered alpha
4. The most profitable rebalancing themes
5. Strategy effectiveness in different market conditions
6. Recommendation for future allocation based on current conditions`,
        response_json_schema: {
          type: "object",
          properties: {
            regimePatterns: {
              type: "array",
              items: { type: "string" }
            },
            strategyEffectiveness: { type: "string" },
            pivotPoints: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  date: { type: "string" },
                  description: { type: "string" },
                  impact: { type: "string" }
                }
              }
            },
            profitableThemes: {
              type: "array",
              items: { type: "string" }
            },
            marketConditionEffectiveness: {
              type: "object",
              properties: {
                bull: { type: "string" },
                bear: { type: "string" },
                sideways: { type: "string" },
                volatility: { type: "string" }
              }
            },
            futureAllocation: {
              type: "object",
              properties: {
                niftyTarget: { type: "number" },
                goldTarget: { type: "number" },
                rationale: { type: "string" }
              }
            }
          }
        }
      });
      
      setSimulationResult(response);
    } catch (err) {
      console.error("Error running AI analysis:", err);
      setError("Failed to run AI analysis. Please try again later.");
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6">Dynamic Portfolio Strategy</h1>
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
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6">Dynamic Portfolio Strategy</h1>
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
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Dynamic Portfolio Strategy</h1>
          <p className="text-slate-500 mt-1">
            AI-driven asset allocation with flexible weights (30-75% range)
          </p>
          {dataAvailability.commonStart && (
            <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <h3 className="font-medium text-slate-800 mb-2">Data Availability</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-slate-600">Nifty Data Since: </span> 
                  <span className="font-medium">{dataAvailability.nifty}</span>
                </div>
                <div>
                  <span className="text-slate-600">Gold Data Since: </span>
                  <span className="font-medium">{dataAvailability.gold}</span>
                </div>
                <div>
                  <span className="text-slate-600">Strategy Start Date: </span>
                  <span className="font-medium">{dataAvailability.commonStart}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {portfolioMetrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-slate-500">CAGR</p>
                    <h2 className="text-2xl font-bold text-green-600">{portfolioMetrics.cagr.toFixed(2)}%</h2>
                  </div>
                  <div className="bg-green-100 p-2 rounded-full">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                </div>
                <div className="mt-2 text-xs text-slate-500">
                  vs Static 50/50: <span className={cn(portfolioMetrics.outperformance >= 0 ? "text-green-600" : "text-red-600")}>
                    {portfolioMetrics.outperformance >= 0 ? "+" : ""}{portfolioMetrics.outperformance.toFixed(2)}%
                  </span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-slate-500">Max Drawdown</p>
                    <h2 className="text-2xl font-bold text-slate-900">{portfolioMetrics.maxDrawdown.toFixed(2)}%</h2>
                  </div>
                  <div className="bg-amber-100 p-2 rounded-full">
                    <BarChart3 className="w-5 h-5 text-amber-600" />
                  </div>
                </div>
                <div className="mt-2 text-xs text-slate-500">
                  Lower risk profile through adaptive allocation
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-slate-500">Sharpe Ratio</p>
                    <h2 className="text-2xl font-bold text-indigo-600">{portfolioMetrics.sharpeRatio.toFixed(2)}</h2>
                  </div>
                  <div className="bg-indigo-100 p-2 rounded-full">
                    <Zap className="w-5 h-5 text-indigo-600" />
                  </div>
                </div>
                <div className="mt-2 text-xs text-slate-500">
                  Risk-adjusted return measurement
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-slate-500">Rebalancing Events</p>
                    <h2 className="text-2xl font-bold text-slate-900">{portfolioMetrics.rebalanceCount}</h2>
                  </div>
                  <div className="bg-blue-100 p-2 rounded-full">
                    <AlertCircle className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
                <div className="mt-2 text-xs text-slate-500">
                  Strategic asset allocation shifts
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="mb-8">
          <Tabs defaultValue={selectedPeriod} onValueChange={setSelectedPeriod}>
            <TabsList className="mb-4">
              <TabsTrigger value="full">Full Period</TabsTrigger>
              <TabsTrigger value="2018-2019">2018-2019</TabsTrigger>
              <TabsTrigger value="2020-2021">2020-2021</TabsTrigger>
              <TabsTrigger value="2022-2023">2022-2023</TabsTrigger>
              <TabsTrigger value="2024-2025">2024-2025</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <DynamicAllocationChart 
            portfolioData={portfolioMetrics?.portfolioValue || []} 
            staticData={portfolioMetrics?.staticValue || []}
            period={selectedPeriod}
          />
        </div>

        <div className="grid gap-6 mb-6">
          <AllocationHistoryTable rebalancingEvents={portfolioHistory.filter(h => h.rebalanced)} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <TrendAnalysis portfolioHistory={portfolioHistory} />
          <PerformanceComparison 
            dynamicPerformance={portfolioMetrics?.portfolioValue || []}
            staticPerformance={portfolioMetrics?.staticValue || []}
          />
        </div>

        <div className="mb-6">
          {simulationResult ? (
            <AIStrategyInsights insights={simulationResult} />
          ) : (
            <Card>
              <CardContent className="py-6">
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="bg-indigo-100 p-3 rounded-full mb-4">
                    <LightbulbIcon className="h-8 w-8 text-indigo-600" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Generate AI Strategy Insights</h3>
                  <p className="text-slate-500 mb-6 max-w-lg">
                    Run AI analysis to get insights into market regimes, key pivot points, and strategy effectiveness across different market conditions
                  </p>
                  <Button
                    onClick={runAIAnalysis}
                    disabled={analyzing}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    {analyzing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing Strategy...
                      </>
                    ) : (
                      <>
                        <Zap className="mr-2 h-4 w-4" />
                        Run AI Analysis
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
