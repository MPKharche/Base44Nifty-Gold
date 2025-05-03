import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown } from "lucide-react";

export default function MarketOverview({ niftyData, goldData }) {
  // Calculate daily change and percentage
  const calculateChange = (current, previous) => {
    if (!current || !previous) return { change: 0, percentage: 0, isPositive: false };
    const change = current - previous;
    const percentage = (change / previous) * 100;
    return {
      change: change.toFixed(2),
      percentage: percentage.toFixed(2),
      isPositive: change > 0
    };
  };

  const niftyLatest = niftyData && niftyData.length > 0 ? niftyData[0] : null;
  const niftyPrevious = niftyData && niftyData.length > 1 ? niftyData[1] : null;
  const goldLatest = goldData && goldData.length > 0 ? goldData[0] : null;
  const goldPrevious = goldData && goldData.length > 1 ? goldData[1] : null;

  const niftyChange = calculateChange(
    niftyLatest?.close,
    niftyPrevious?.close
  );
  const goldChange = calculateChange(
    goldLatest?.close,
    goldPrevious?.close
  );
  
  // Determine market phase based on technical indicators
  const determineMarketPhase = (asset, latestData, previousData) => {
    if (!latestData) return { phase: "Neutral", color: "text-slate-600", description: "Insufficient data" };
    
    // Simple phase determination logic:
    // Using price momentum, volatility, and recent returns
    const returns = latestData.returns || 0;
    const priceChange = latestData.close - (previousData?.close || latestData.close);
    const isVolatile = Math.abs(returns) > 1.5; // 1.5% daily move is considered volatile
    
    // Calculate momentum (simple 5-day EMA)
    const momentum = asset === 'nifty' ?
      niftyData.slice(0, 5).reduce((sum, d) => sum + d.returns, 0) / 5 :
      goldData.slice(0, 5).reduce((sum, d) => sum + d.returns, 0) / 5;
    
    if (returns > 0.8 && priceChange > 0 && momentum > 0.5) {
      return { 
        phase: "Bullish", 
        color: "text-green-600",
        description: "Strong uptrend with momentum"
      };
    } else if (returns > 0 && priceChange > 0) {
      return { 
        phase: "Accumulation", 
        color: "text-emerald-600",
        description: "Gradual buying pressure"
      };
    } else if (returns < -0.8 && priceChange < 0 && momentum < -0.5) {
      return { 
        phase: "Bearish", 
        color: "text-red-600",
        description: "Strong downtrend with momentum" 
      };
    } else if (returns < 0 && priceChange < 0) {
      return { 
        phase: "Distribution", 
        color: "text-orange-600",
        description: "Gradual selling pressure"
      };
    } else if (isVolatile) {
      return { 
        phase: "Volatile", 
        color: "text-purple-600",
        description: "High volatility phase"
      };
    } else {
      return { 
        phase: "Consolidation", 
        color: "text-blue-600",
        description: "Sideways movement, low volatility"
      };
    }
  };

  // Calculate correlation (simplified)
  const calculateCorrelation = () => {
    if (!niftyData || !goldData || niftyData.length < 5 || goldData.length < 5) {
      return { value: "N/A", status: "neutral" };
    }
    
    // Simple 5-day correlation
    const niftyReturns = niftyData.slice(0, 5).map(d => d.returns || 0);
    const goldReturns = goldData.slice(0, 5).map(d => d.returns || 0);
    
    // Calculate mean
    const niftyMean = niftyReturns.reduce((sum, val) => sum + val, 0) / niftyReturns.length;
    const goldMean = goldReturns.reduce((sum, val) => sum + val, 0) / goldReturns.length;
    
    // Calculate covariance and variances
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
    
    let status = "neutral";
    if (correlation > 0.5) status = "positive";
    else if (correlation < -0.5) status = "negative";
    
    return {
      value: correlation.toFixed(2),
      status
    };
  };

  const correlation = calculateCorrelation();
  const niftyPhase = determineMarketPhase('nifty', niftyLatest, niftyPrevious);
  const goldPhase = determineMarketPhase('gold', goldLatest, goldPrevious);

  const statusColors = {
    positive: "text-green-600",
    negative: "text-red-600",
    neutral: "text-amber-600"
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="overflow-hidden shadow-md hover:shadow-lg transition-shadow">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 pb-2">
          <CardTitle className="text-blue-800 flex items-center text-lg">
            <div className="w-2 h-6 bg-blue-600 rounded mr-2"></div>
            Nifty
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex justify-between items-baseline">
            <div className="text-2xl font-bold">
              {niftyLatest ? niftyLatest.close.toFixed(2) : "N/A"}
            </div>
            <div className={`flex items-center ${niftyChange.isPositive ? "text-green-600" : "text-red-600"}`}>
              {niftyChange.isPositive ? (
                <ArrowUpRight className="mr-1 h-4 w-4" />
              ) : (
                <ArrowDownRight className="mr-1 h-4 w-4" />
              )}
              <span className="text-sm font-medium">
                {niftyChange.change} ({niftyChange.percentage}%)
              </span>
            </div>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-500">
            <div>Open: <span className="font-medium text-slate-700">{niftyLatest?.open.toFixed(2) || "N/A"}</span></div>
            <div>High: <span className="font-medium text-slate-700">{niftyLatest?.high.toFixed(2) || "N/A"}</span></div>
            <div>Low: <span className="font-medium text-slate-700">{niftyLatest?.low.toFixed(2) || "N/A"}</span></div>
            <div>Vol: <span className="font-medium text-slate-700">{niftyLatest?.volume?.toLocaleString() || "N/A"}</span></div>
          </div>
          
          {/* Market Phase Indicator */}
          <div className="mt-3 pt-3 border-t border-slate-100">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Market Phase:</span>
              <span className={`text-sm font-medium ${niftyPhase.color}`}>
                {niftyPhase.phase}
              </span>
            </div>
            <p className="text-xs mt-1 text-slate-500">
              {niftyPhase.description}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden shadow-md hover:shadow-lg transition-shadow">
        <CardHeader className="bg-gradient-to-r from-amber-50 to-amber-100 pb-2">
          <CardTitle className="text-amber-800 flex items-center text-lg">
            <div className="w-2 h-6 bg-amber-500 rounded mr-2"></div>
            Gold
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex justify-between items-baseline">
            <div className="text-2xl font-bold">
              {goldLatest ? goldLatest.close.toFixed(2) : "N/A"}
            </div>
            <div className={`flex items-center ${goldChange.isPositive ? "text-green-600" : "text-red-600"}`}>
              {goldChange.isPositive ? (
                <ArrowUpRight className="mr-1 h-4 w-4" />
              ) : (
                <ArrowDownRight className="mr-1 h-4 w-4" />
              )}
              <span className="text-sm font-medium">
                {goldChange.change} ({goldChange.percentage}%)
              </span>
            </div>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-500">
            <div>Open: <span className="font-medium text-slate-700">{goldLatest?.open.toFixed(2) || "N/A"}</span></div>
            <div>High: <span className="font-medium text-slate-700">{goldLatest?.high.toFixed(2) || "N/A"}</span></div>
            <div>Low: <span className="font-medium text-slate-700">{goldLatest?.low.toFixed(2) || "N/A"}</span></div>
            <div>Vol: <span className="font-medium text-slate-700">{goldLatest?.volume?.toLocaleString() || "N/A"}</span></div>
          </div>
          
          {/* Market Phase Indicator */}
          <div className="mt-3 pt-3 border-t border-slate-100">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Market Phase:</span>
              <span className={`text-sm font-medium ${goldPhase.color}`}>
                {goldPhase.phase}
              </span>
            </div>
            <p className="text-xs mt-1 text-slate-500">
              {goldPhase.description}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden shadow-md hover:shadow-lg transition-shadow">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 pb-2">
          <CardTitle className="text-slate-800 flex items-center text-lg">
            <div className="w-2 h-6 bg-slate-400 rounded mr-2"></div>
            Correlation
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex justify-between items-center">
            <div className="text-2xl font-bold">
              {correlation.value}
            </div>
            <div className={`flex items-center ${statusColors[correlation.status]}`}>
              {correlation.status === "positive" ? (
                <TrendingUp className="mr-1 h-4 w-4" />
              ) : correlation.status === "negative" ? (
                <TrendingDown className="mr-1 h-4 w-4" />
              ) : null}
              <span className="text-sm font-medium capitalize">
                {correlation.status} correlation
              </span>
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-600">
            <p>5-day rolling correlation between Nifty and Gold returns.</p>
            <div className="mt-1">
              <span className={statusColors[correlation.status]}>●</span>{" "}
              {correlation.status === "positive" 
                ? "Assets are moving in the same direction" 
                : correlation.status === "negative"
                ? "Assets are moving in opposite directions"
                : "No clear relationship currently"}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}