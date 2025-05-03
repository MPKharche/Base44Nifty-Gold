import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from "recharts";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function VolatilityChart({ niftyData, goldData }) {
  const [volatilityPeriod, setVolatilityPeriod] = useState("21");
  const [volatilityData, setVolatilityData] = useState([]);
  
  useEffect(() => {
    if (!niftyData || !goldData || niftyData.length === 0 || goldData.length === 0) {
      return;
    }
    
    calculateVolatilityData();
  }, [niftyData, goldData, volatilityPeriod]);
  
  const calculateVolatilityData = () => {
    const days = parseInt(volatilityPeriod);
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
    
    // For each date, calculate rolling volatility
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
        
        if (niftyItem && typeof niftyItem.returns === 'number') {
          niftyReturns.push(niftyItem.returns);
        }
        
        if (goldItem && typeof goldItem.returns === 'number') {
          goldReturns.push(goldItem.returns);
        }
      }
      
      // Only calculate if we have enough data points
      if (niftyReturns.length >= Math.min(5, days) && goldReturns.length >= Math.min(5, days)) {
        const niftyVol = calculateVolatility(niftyReturns) * Math.sqrt(252); // Annualized
        const goldVol = calculateVolatility(goldReturns) * Math.sqrt(252); // Annualized
        
        result.push({
          date: endDate,
          formattedDate: format(new Date(endDate), "MMM dd, yyyy"),
          niftyVolatility: parseFloat(niftyVol.toFixed(2)),
          goldVolatility: parseFloat(goldVol.toFixed(2)),
          volRatio: parseFloat((goldVol / niftyVol).toFixed(2))
        });
      }
    }
    
    setVolatilityData(result);
  };
  
  const calculateVolatility = (returns) => {
    // Standard deviation calculation
    const n = returns.length;
    if (n <= 1) return 0;
    
    const mean = returns.reduce((sum, val) => sum + val, 0) / n;
    const squareDiffs = returns.map(val => Math.pow(val - mean, 2));
    const variance = squareDiffs.reduce((sum, val) => sum + val, 0) / (n - 1);
    
    return Math.sqrt(variance);
  };
  
  if (!niftyData || !goldData || niftyData.length === 0 || goldData.length === 0) {
    return (
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Volatility Analysis</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-slate-500">No data available for volatility analysis</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-md">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Rolling Volatility (Annualized)</CardTitle>
        <Tabs defaultValue={volatilityPeriod} onValueChange={setVolatilityPeriod}>
          <TabsList>
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
              data={volatilityData}
              margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis
                dataKey="formattedDate"
                tick={{ fontSize: 10 }}
                tickFormatter={(value) => value.substring(0, 6)}
                interval={Math.ceil(volatilityData.length / 10)}
              />
              <YAxis 
                yAxisId="left"
                domain={[0, 'auto']}
                tick={{ fontSize: 10 }}
                tickFormatter={(value) => `${value}%`}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                domain={[0, 'auto']}
                tick={{ fontSize: 10 }}
                tickFormatter={(value) => `${value}x`}
              />
              <Tooltip
                formatter={(value, name) => {
                  if (name === "niftyVolatility" || name === "goldVolatility") {
                    return [`${value}%`, name === "niftyVolatility" ? "Nifty Vol" : "Gold Vol"];
                  } else if (name === "volRatio") {
                    return [`${value}x`, "Gold/Nifty Ratio"];
                  }
                  return [value, name];
                }}
                labelFormatter={(label) => format(new Date(volatilityData.find(d => d.formattedDate === label)?.date || new Date()), "MMMM d, yyyy")}
              />
              <Legend 
                formatter={(value) => {
                  if (value === "niftyVolatility") return "Nifty";
                  if (value === "goldVolatility") return "Gold";
                  if (value === "volRatio") return "Ratio (Gold/Nifty)";
                  return value;
                }}
              />
              <Line
                type="monotone"
                dataKey="niftyVolatility"
                yAxisId="left"
                stroke="#2563eb"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="goldVolatility"
                yAxisId="left"
                stroke="#d97706"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="volRatio"
                yAxisId="right"
                stroke="#6366f1"
                strokeWidth={1.5}
                strokeDasharray="3 3"
                dot={false}
                activeDot={{ r: 4 }}
              />
              <ReferenceLine y={1} yAxisId="right" stroke="#6366f1" strokeDasharray="3 3" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 text-xs text-slate-600 space-y-1">
          <div className="flex items-center">
            <span className="inline-block w-3 h-3 bg-blue-600 mr-1 rounded-full"></span>
            <span>Nifty Volatility</span>
          </div>
          <div className="flex items-center">
            <span className="inline-block w-3 h-3 bg-amber-600 mr-1 rounded-full"></span>
            <span>Gold Volatility</span>
          </div>
          <div className="flex items-center">
            <span className="inline-block w-3 h-3 border border-indigo-600 mr-1 rounded-full"></span>
            <span>Gold/Nifty Volatility Ratio (right axis) - Higher values mean Gold is more volatile</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}