import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from "recharts";
import { format, parseISO } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function CorrelationChart({ niftyData, goldData }) {
  const [correlationPeriod, setCorrelationPeriod] = useState("10");
  const [correlationData, setCorrelationData] = useState([]);
  
  useEffect(() => {
    if (!niftyData || !goldData || niftyData.length === 0 || goldData.length === 0) {
      return;
    }
    
    calculateCorrelationData();
  }, [niftyData, goldData, correlationPeriod]);
  
  const calculateCorrelationData = () => {
    const days = parseInt(correlationPeriod);
    if (isNaN(days) || days <= 0) return;
    
    // Create date maps for quick access
    const niftyMap = new Map();
    const goldMap = new Map();
    
    niftyData.forEach(item => {
      niftyMap.set(item.date, item);
    });
    
    goldData.forEach(item => {
      goldMap.set(item.date, item);
    });
    
    // Get all dates in both datasets
    const allDates = Array.from(new Set([
      ...niftyData.map(item => item.date),
      ...goldData.map(item => item.date)
    ])).sort((a, b) => new Date(a) - new Date(b)); // Chronological order
    
    const result = [];
    
    // For each date, calculate rolling correlation
    for (let i = days; i < allDates.length; i++) {
      const endDate = allDates[i];
      
      // Get window of dates
      const dateWindow = allDates.slice(i - days, i + 1);
      
      // Extract returns for both assets in the window
      const niftyReturns = [];
      const goldReturns = [];
      
      for (const date of dateWindow) {
        const niftyItem = niftyMap.get(date);
        const goldItem = goldMap.get(date);
        
        if (niftyItem && goldItem && typeof niftyItem.returns === 'number' && typeof goldItem.returns === 'number') {
          niftyReturns.push(niftyItem.returns);
          goldReturns.push(goldItem.returns);
        }
      }
      
      // Only calculate if we have enough data points
      if (niftyReturns.length >= Math.min(5, days)) {
        const correlation = calculateCorrelation(niftyReturns, goldReturns);
        
        result.push({
          date: endDate,
          formattedDate: format(new Date(endDate), "MMM dd, yyyy"),
          correlation: parseFloat(correlation.toFixed(4))
        });
      }
    }
    
    setCorrelationData(result);
  };
  
  const calculateCorrelation = (xValues, yValues) => {
    const n = xValues.length;
    
    // Calculate means
    const xMean = xValues.reduce((sum, val) => sum + val, 0) / n;
    const yMean = yValues.reduce((sum, val) => sum + val, 0) / n;
    
    // Calculate covariance and variances
    let covariance = 0;
    let xVariance = 0;
    let yVariance = 0;
    
    for (let i = 0; i < n; i++) {
      const xDiff = xValues[i] - xMean;
      const yDiff = yValues[i] - yMean;
      covariance += xDiff * yDiff;
      xVariance += xDiff * xDiff;
      yVariance += yDiff * yDiff;
    }
    
    // Calculate correlation coefficient
    if (xVariance === 0 || yVariance === 0) return 0;
    return covariance / (Math.sqrt(xVariance) * Math.sqrt(yVariance));
  };
  
  if (!niftyData || !goldData || niftyData.length === 0 || goldData.length === 0) {
    return (
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Correlation Analysis</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-slate-500">No data available for correlation analysis</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-md">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Rolling Correlation</CardTitle>
        <Tabs defaultValue={correlationPeriod} onValueChange={setCorrelationPeriod}>
          <TabsList>
            <TabsTrigger value="5">5D</TabsTrigger>
            <TabsTrigger value="10">10D</TabsTrigger>
            <TabsTrigger value="21">21D</TabsTrigger>
            <TabsTrigger value="63">63D</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={correlationData}
              margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis
                dataKey="formattedDate"
                tick={{ fontSize: 10 }}
                tickFormatter={(value) => value.substring(0, 6)}
                interval={Math.ceil(correlationData.length / 10)}
              />
              <YAxis 
                domain={[-1, 1]} 
                ticks={[-1, -0.5, 0, 0.5, 1]}
                tick={{ fontSize: 10 }}
              />
              <Tooltip
                formatter={(value) => [`${value.toFixed(2)}`, "Correlation"]}
                labelFormatter={(label) => format(new Date(correlationData.find(d => d.formattedDate === label)?.date || new Date()), "MMMM d, yyyy")}
              />
              <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />
              <ReferenceLine y={0.5} stroke="#22c55e" strokeDasharray="3 3" strokeOpacity={0.6} />
              <ReferenceLine y={-0.5} stroke="#ef4444" strokeDasharray="3 3" strokeOpacity={0.6} />
              <Line
                type="monotone"
                dataKey="correlation"
                stroke="#6366f1"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 text-xs text-slate-600 space-y-1">
          <div className="flex items-center">
            <span className="inline-block w-3 h-3 bg-green-500 opacity-60 mr-1 rounded-full"></span>
            <span>Above 0.5: Strong positive correlation</span>
          </div>
          <div className="flex items-center">
            <span className="inline-block w-3 h-3 bg-red-500 opacity-60 mr-1 rounded-full"></span>
            <span>Below -0.5: Strong negative correlation</span>
          </div>
          <div className="flex items-center">
            <span className="inline-block w-3 h-3 bg-gray-400 opacity-60 mr-1 rounded-full"></span>
            <span>Around 0: No significant correlation</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}