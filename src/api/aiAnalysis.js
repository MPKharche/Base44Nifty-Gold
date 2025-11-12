/**
 * Local AI Analysis Functions
 * Replaces Base44 InvokeLLM integration with local analysis
 */

/**
 * Generate market insights based on data analysis
 */
export function generateMarketInsights(niftyData, goldData, signals) {
  if (!niftyData || !goldData || niftyData.length === 0 || goldData.length === 0) {
    return {
      summary: "Insufficient data for analysis. Please upload market data.",
      recommendations: [],
      riskFactors: []
    };
  }

  // Calculate key metrics
  const niftyReturns = calculateReturns(niftyData);
  const goldReturns = calculateReturns(goldData);
  const niftyVolatility = calculateVolatility(niftyReturns);
  const goldVolatility = calculateVolatility(goldReturns);
  const correlation = calculateCorrelation(niftyReturns, goldReturns);
  
  // Recent trends
  const recentNifty = niftyData.slice(-30);
  const recentGold = goldData.slice(-30);
  const niftyTrend = calculateTrend(recentNifty);
  const goldTrend = calculateTrend(recentGold);
  
  // Generate insights
  const insights = {
    summary: generateSummary(niftyTrend, goldTrend, correlation, niftyVolatility, goldVolatility),
    recommendations: generateRecommendations(niftyTrend, goldTrend, correlation, signals),
    riskFactors: identifyRiskFactors(niftyVolatility, goldVolatility, correlation),
    metrics: {
      niftyVolatility: (niftyVolatility * 100).toFixed(2) + '%',
      goldVolatility: (goldVolatility * 100).toFixed(2) + '%',
      correlation: correlation.toFixed(3),
      niftyTrend: (niftyTrend * 100).toFixed(2) + '%',
      goldTrend: (goldTrend * 100).toFixed(2) + '%'
    }
  };

  return insights;
}

/**
 * Generate portfolio recommendations
 */
export function generatePortfolioRecommendations(portfolioWeights, niftyData, goldData, timeframe) {
  if (!niftyData || !goldData || niftyData.length === 0 || goldData.length === 0) {
    return {
      recommendation: "Please upload market data to generate recommendations.",
      reasoning: "",
      suggestedAllocation: { nifty: 50, gold: 50 }
    };
  }

  const niftyReturns = calculateReturns(niftyData);
  const goldReturns = calculateReturns(goldData);
  const niftyVolatility = calculateVolatility(niftyReturns);
  const goldVolatility = calculateVolatility(goldReturns);
  const correlation = calculateCorrelation(niftyReturns, goldReturns);
  
  // Calculate Sharpe ratios (simplified)
  const niftySharpe = calculateSharpeRatio(niftyReturns, niftyVolatility);
  const goldSharpe = calculateSharpeRatio(goldReturns, goldVolatility);
  
  // Calculate optimal allocation based on risk-return profile
  const totalRisk = niftyVolatility + goldVolatility;
  const diversificationBenefit = 1 - Math.abs(correlation);
  
  let suggestedNifty = 50;
  let suggestedGold = 50;
  
  if (niftySharpe > goldSharpe && diversificationBenefit > 0.3) {
    suggestedNifty = Math.min(70, Math.max(30, 50 + (niftySharpe - goldSharpe) * 20));
    suggestedGold = 100 - suggestedNifty;
  } else if (goldSharpe > niftySharpe && diversificationBenefit > 0.3) {
    suggestedGold = Math.min(70, Math.max(30, 50 + (goldSharpe - niftySharpe) * 20));
    suggestedNifty = 100 - suggestedGold;
  }
  
  const reasoning = generatePortfolioReasoning(
    suggestedNifty,
    suggestedGold,
    niftySharpe,
    goldSharpe,
    correlation,
    diversificationBenefit
  );

  return {
    recommendation: `Suggested allocation: ${suggestedNifty}% Nifty, ${suggestedGold}% Gold`,
    reasoning,
    suggestedAllocation: {
      nifty: Math.round(suggestedNifty),
      gold: Math.round(suggestedGold)
    },
    metrics: {
      niftySharpe: niftySharpe.toFixed(2),
      goldSharpe: goldSharpe.toFixed(2),
      correlation: correlation.toFixed(3),
      diversificationBenefit: (diversificationBenefit * 100).toFixed(1) + '%'
    }
  };
}

/**
 * Generate strategy insights
 */
export function generateStrategyInsights(portfolioHistory, niftyData, goldData) {
  if (!portfolioHistory || portfolioHistory.length === 0) {
    return {
      insights: ["No portfolio history available for analysis."],
      performance: null,
      recommendations: []
    };
  }

  const insights = [];
  const recentAllocations = portfolioHistory.slice(-10);
  
  // Analyze allocation changes
  const allocationVolatility = calculateAllocationVolatility(recentAllocations);
  if (allocationVolatility > 0.15) {
    insights.push("Portfolio allocation has been highly dynamic, indicating active rebalancing strategy.");
  } else {
    insights.push("Portfolio allocation has remained relatively stable.");
  }
  
  // Performance analysis
  const returns = portfolioHistory.map(h => h.totalReturn || 0);
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const positiveDays = returns.filter(r => r > 0).length;
  const winRate = (positiveDays / returns.length) * 100;
  
  insights.push(`Average daily return: ${(avgReturn * 100).toFixed(2)}%`);
  insights.push(`Win rate: ${winRate.toFixed(1)}%`);
  
  const recommendations = [];
  if (winRate < 50) {
    recommendations.push("Consider reviewing rebalancing thresholds to reduce transaction costs.");
  }
  if (allocationVolatility > 0.2) {
    recommendations.push("High allocation volatility detected. Consider smoothing rebalancing triggers.");
  }

  return {
    insights,
    performance: {
      avgReturn: (avgReturn * 100).toFixed(2) + '%',
      winRate: winRate.toFixed(1) + '%',
      allocationVolatility: (allocationVolatility * 100).toFixed(1) + '%'
    },
    recommendations
  };
}

/**
 * Generate Granger causality analysis insights
 */
export function generateGrangerCausalityInsights(niftyData, goldData, lag) {
  if (!niftyData || !goldData || niftyData.length < lag * 2) {
    return {
      analysis: "Insufficient data for Granger causality analysis. Need at least " + (lag * 2) + " data points.",
      conclusion: "Cannot determine causality with current data."
    };
  }

  const niftyReturns = calculateReturns(niftyData);
  const goldReturns = calculateReturns(goldData);
  
  // Simplified Granger causality test
  const correlations = [];
  for (let i = lag; i < Math.min(niftyReturns.length, goldReturns.length); i++) {
    const niftyLag = niftyReturns.slice(i - lag, i);
    const goldCurrent = goldReturns[i];
    const correlation = calculateCorrelation(niftyLag, [goldCurrent]);
    correlations.push(correlation);
  }
  
  const avgCorrelation = correlations.reduce((a, b) => a + b, 0) / correlations.length;
  
  let conclusion = "";
  if (Math.abs(avgCorrelation) > 0.3) {
    conclusion = `Strong evidence of ${avgCorrelation > 0 ? 'positive' : 'negative'} relationship. `;
    conclusion += `Nifty returns at lag ${lag} may help predict Gold returns.`;
  } else {
    conclusion = "Weak evidence of predictive relationship. Nifty and Gold appear to move independently.";
  }

  return {
    analysis: `Analyzed ${correlations.length} observations with lag ${lag}.`,
    conclusion,
    correlation: avgCorrelation.toFixed(3),
    significance: Math.abs(avgCorrelation) > 0.3 ? "Significant" : "Not Significant"
  };
}

// Helper functions
function calculateReturns(data) {
  const returns = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i].close && data[i - 1].close) {
      returns.push((data[i].close - data[i - 1].close) / data[i - 1].close);
    }
  }
  return returns;
}

function calculateVolatility(returns) {
  if (returns.length === 0) return 0;
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
  return Math.sqrt(variance);
}

function calculateCorrelation(returns1, returns2) {
  const minLength = Math.min(returns1.length, returns2.length);
  if (minLength === 0) return 0;
  
  const r1 = returns1.slice(0, minLength);
  const r2 = returns2.slice(0, minLength);
  
  const mean1 = r1.reduce((a, b) => a + b, 0) / r1.length;
  const mean2 = r2.reduce((a, b) => a + b, 0) / r2.length;
  
  let numerator = 0;
  let sumSq1 = 0;
  let sumSq2 = 0;
  
  for (let i = 0; i < minLength; i++) {
    const diff1 = r1[i] - mean1;
    const diff2 = r2[i] - mean2;
    numerator += diff1 * diff2;
    sumSq1 += diff1 * diff1;
    sumSq2 += diff2 * diff2;
  }
  
  const denominator = Math.sqrt(sumSq1 * sumSq2);
  return denominator === 0 ? 0 : numerator / denominator;
}

function calculateTrend(data) {
  if (data.length < 2) return 0;
  const first = data[0].close;
  const last = data[data.length - 1].close;
  return (last - first) / first;
}

function calculateSharpeRatio(returns, volatility, riskFreeRate = 0) {
  if (volatility === 0) return 0;
  const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  return (meanReturn - riskFreeRate) / volatility;
}

function calculateAllocationVolatility(allocations) {
  if (allocations.length < 2) return 0;
  const niftyAllocs = allocations.map(a => a.nifty || 0);
  const mean = niftyAllocs.reduce((a, b) => a + b, 0) / niftyAllocs.length;
  const variance = niftyAllocs.reduce((sum, a) => sum + Math.pow(a - mean, 2), 0) / niftyAllocs.length;
  return Math.sqrt(variance) / 100; // Normalize to 0-1
}

function generateSummary(niftyTrend, goldTrend, correlation, niftyVol, goldVol) {
  let summary = "Market Analysis Summary:\n\n";
  
  summary += `Nifty Trend: ${niftyTrend > 0 ? 'Bullish' : 'Bearish'} (${(niftyTrend * 100).toFixed(2)}%)\n`;
  summary += `Gold Trend: ${goldTrend > 0 ? 'Bullish' : 'Bearish'} (${(goldTrend * 100).toFixed(2)}%)\n`;
  summary += `Correlation: ${correlation > 0.5 ? 'High positive' : correlation < -0.5 ? 'High negative' : 'Low'} (${correlation.toFixed(3)})\n`;
  summary += `Nifty Volatility: ${(niftyVol * 100).toFixed(2)}%\n`;
  summary += `Gold Volatility: ${(goldVol * 100).toFixed(2)}%\n`;
  
  return summary;
}

function generateRecommendations(niftyTrend, goldTrend, correlation, signals) {
  const recommendations = [];
  
  if (niftyTrend > 0.05 && goldTrend < 0) {
    recommendations.push("Consider increasing Nifty allocation given strong upward trend.");
  }
  
  if (goldTrend > 0.05 && niftyTrend < 0) {
    recommendations.push("Consider increasing Gold allocation as a hedge during equity weakness.");
  }
  
  if (Math.abs(correlation) < 0.3) {
    recommendations.push("Low correlation provides good diversification opportunity.");
  }
  
  if (signals && signals.length > 0) {
    const recentSignals = signals.slice(0, 5);
    const buySignals = recentSignals.filter(s => s.signal_type === 'buy').length;
    if (buySignals > 2) {
      recommendations.push("Multiple buy signals detected. Consider reviewing entry points.");
    }
  }
  
  return recommendations.length > 0 ? recommendations : ["Maintain current allocation strategy."];
}

function identifyRiskFactors(niftyVol, goldVol, correlation) {
  const factors = [];
  
  if (niftyVol > 0.03) {
    factors.push("High Nifty volatility detected. Consider reducing equity exposure.");
  }
  
  if (goldVol > 0.025) {
    factors.push("Elevated Gold volatility. Monitor position sizing.");
  }
  
  if (Math.abs(correlation) > 0.7) {
    factors.push("High correlation reduces diversification benefits.");
  }
  
  return factors.length > 0 ? factors : ["Risk factors are within normal ranges."];
}

function generatePortfolioReasoning(nifty, gold, niftySharpe, goldSharpe, correlation, diversification) {
  let reasoning = `Recommended allocation based on risk-adjusted returns and diversification benefits.\n\n`;
  reasoning += `Nifty Sharpe Ratio: ${niftySharpe.toFixed(2)}\n`;
  reasoning += `Gold Sharpe Ratio: ${goldSharpe.toFixed(2)}\n`;
  reasoning += `Correlation: ${correlation.toFixed(3)}\n`;
  reasoning += `Diversification Benefit: ${(diversification * 100).toFixed(1)}%\n\n`;
  
  if (niftySharpe > goldSharpe) {
    reasoning += `Nifty shows better risk-adjusted returns, justifying higher allocation.`;
  } else {
    reasoning += `Gold shows better risk-adjusted returns, justifying higher allocation.`;
  }
  
  if (diversification > 0.3) {
    reasoning += ` The low correlation provides significant diversification benefits.`;
  }
  
  return reasoning;
}
