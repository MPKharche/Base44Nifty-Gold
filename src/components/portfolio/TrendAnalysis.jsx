import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";

export default function TrendAnalysis({ portfolioHistory }) {
  if (!portfolioHistory || portfolioHistory.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Allocation Trend Analysis</CardTitle>
          <CardDescription>No data available</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-slate-500">Insufficient data for trend analysis</p>
        </CardContent>
      </Card>
    );
  }
  
  // Calculate moving averages of allocations
  const allocations = portfolioHistory.map((entry, idx) => {
    // Calculate 3-period moving average for smoother visualization
    const movingAvgWindow = Math.min(3, idx + 1);
    let niftyMovingAvg = 0;
    let goldMovingAvg = 0;
    
    for (let i = 0; i < movingAvgWindow; i++) {
      niftyMovingAvg += portfolioHistory[idx - i]?.weights.nifty || 0;
      goldMovingAvg += portfolioHistory[idx - i]?.weights.gold || 0;
    }
    
    niftyMovingAvg /= movingAvgWindow;
    goldMovingAvg /= movingAvgWindow;
    
    // Calculate volatility score if metrics are available
    const volatility = entry.metrics?.volatility || 0;
    const correlation = entry.metrics?.correlation || 0;
    
    return {
      date: entry.date,
      niftyAllocation: entry.weights.nifty,
      goldAllocation: entry.weights.gold,
      niftyMovingAvg,
      goldMovingAvg,
      volatility,
      correlation: correlation * 50 + 50, // Scale to 0-100 range for visualization
      rebalanced: entry.rebalanced
    };
  });
  
  // Group allocations by year for trend analysis
  const yearlyAverages = {};
  portfolioHistory.forEach(entry => {
    const year = new Date(entry.date).getFullYear();
    
    if (!yearlyAverages[year]) {
      yearlyAverages[year] = { 
        niftyTotal: 0, 
        goldTotal: 0, 
        count: 0,
        volatilityTotal: 0,
        rebalanceCount: 0
      };
    }
    
    yearlyAverages[year].niftyTotal += entry.weights.nifty;
    yearlyAverages[year].goldTotal += entry.weights.gold;
    yearlyAverages[year].volatilityTotal += entry.metrics?.volatility || 0;
    yearlyAverages[year].count += 1;
    if (entry.rebalanced) yearlyAverages[year].rebalanceCount += 1;
  });
  
  const yearlyAllocationData = Object.keys(yearlyAverages).map(year => {
    const data = yearlyAverages[year];
    return {
      year,
      niftyAvg: Math.round(data.niftyTotal / data.count),
      goldAvg: Math.round(data.goldTotal / data.count),
      volatility: (data.volatilityTotal / data.count).toFixed(2),
      rebalanceCount: data.rebalanceCount
    };
  });
  
  const getFirstDateOfQuarter = (year, quarter) => {
    const month = (quarter - 1) * 3;
    return new Date(year, month, 1);
  };
  
  // Quarterly allocation trends
  const quarterlyAverages = {};
  portfolioHistory.forEach(entry => {
    const date = new Date(entry.date);
    const year = date.getFullYear();
    const quarter = Math.floor(date.getMonth() / 3) + 1;
    const key = `${year}-Q${quarter}`;
    
    if (!quarterlyAverages[key]) {
      quarterlyAverages[key] = { 
        date: getFirstDateOfQuarter(year, quarter),
        year,
        quarter,
        niftyTotal: 0, 
        goldTotal: 0, 
        count: 0,
        volatilityTotal: 0
      };
    }
    
    quarterlyAverages[key].niftyTotal += entry.weights.nifty;
    quarterlyAverages[key].goldTotal += entry.weights.gold;
    quarterlyAverages[key].volatilityTotal += entry.metrics?.volatility || 0;
    quarterlyAverages[key].count += 1;
  });
  
  const quarterlyAllocationData = Object.keys(quarterlyAverages)
    .sort((a, b) => {
      const dateA = quarterlyAverages[a].date;
      const dateB = quarterlyAverages[b].date;
      return dateA - dateB;
    })
    .map(key => {
      const data = quarterlyAverages[key];
      return {
        quarter: key,
        date: data.date,
        niftyAvg: Math.round(data.niftyTotal / data.count),
        goldAvg: Math.round(data.goldTotal / data.count),
        volatility: (data.volatilityTotal / data.count).toFixed(2)
      };
    });
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Allocation Trend Analysis</CardTitle>
        <CardDescription>
          Quarterly allocation trends with market regime shifts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={quarterlyAllocationData}
              margin={{
                top: 10,
                right: 30,
                left: 0,
                bottom: 30,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis 
                dataKey="quarter" 
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                domain={[0, 100]} 
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip 
                formatter={(value) => [`${value}%`]}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="niftyAvg"
                name="Nifty Allocation"
                stroke="#2563eb"
                fill="#2563eb"
                fillOpacity={0.6}
                stackId="1"
              />
              <Area
                type="monotone"
                dataKey="goldAvg"
                name="Gold Allocation"
                stroke="#d97706"
                fill="#d97706"
                fillOpacity={0.6}
                stackId="1"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={quarterlyAllocationData}
              margin={{
                top: 10,
                right: 30,
                left: 0,
                bottom: 0,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis 
                dataKey="quarter" 
                tick={{ fontSize: 12 }}
              />
              <YAxis
                yAxisId="left"
                domain={[0, dataMax => Math.ceil(dataMax * 1.1)]}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="volatility"
                name="Portfolio Volatility"
                stroke="#9333ea"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}