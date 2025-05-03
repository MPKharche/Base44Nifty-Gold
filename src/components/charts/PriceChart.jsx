
import React, { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Brush,
  ReferenceLine
} from "recharts";
import { format, parseISO, subDays } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function PriceChart({ niftyData, goldData }) {
  const [timeframe, setTimeframe] = useState("1m");
  
  if (!niftyData || !goldData || niftyData.length === 0 || goldData.length === 0) {
    return (
      <Card className="col-span-2 shadow-md">
        <CardHeader>
          <CardTitle>Price Chart</CardTitle>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center">
          <p className="text-slate-500">No data available to display</p>
        </CardContent>
      </Card>
    );
  }

  // Process data for charting
  const prepareChartData = () => {
    // Combine data from both assets
    let combinedData = [];
    
    // Create lookup maps for quick access
    const niftyMap = new Map();
    const goldMap = new Map();
    
    niftyData.forEach(item => {
      niftyMap.set(item.date, item);
    });
    
    goldData.forEach(item => {
      goldMap.set(item.date, item);
    });
    
    // Get all unique dates
    const allDates = new Set([
      ...niftyData.map(item => item.date),
      ...goldData.map(item => item.date)
    ]);
    
    // Create combined dataset
    const sortedDates = Array.from(allDates).sort((a, b) => new Date(b) - new Date(a));
    
    // Filter based on timeframe
    let cutoffDate;
    const now = new Date();
    
    switch (timeframe) {
      case "1w":
        cutoffDate = subDays(now, 7);
        break;
      case "1m":
        cutoffDate = subDays(now, 30);
        break;
      case "3m":
        cutoffDate = subDays(now, 90);
        break;
      case "6m":
        cutoffDate = subDays(now, 180);
        break;
      case "1y":
        cutoffDate = subDays(now, 365);
        break;
      case "all":
      default:
        cutoffDate = new Date(0); // Beginning of time
    }
    
    for (const date of sortedDates) {
      if (new Date(date) < cutoffDate) continue;
      
      const niftyItem = niftyMap.get(date);
      const goldItem = goldMap.get(date);
      
      combinedData.push({
        date,
        formattedDate: format(new Date(date), "MMM dd"),
        niftyClose: niftyItem ? niftyItem.close : null,
        goldClose: goldItem ? goldItem.close : null,
        niftyVolume: niftyItem ? niftyItem.volume : null,
        goldVolume: goldItem ? goldItem.volume : null
      });
    }
    
    return combinedData.reverse(); // Chronological order
  };
  
  const chartData = prepareChartData();
  
  // Calculate min/max for better axis scaling with some buffer
  const niftyValues = chartData.filter(d => d.niftyClose !== null).map(d => d.niftyClose);
  const goldValues = chartData.filter(d => d.goldClose !== null).map(d => d.goldClose);
  
  const niftyMin = Math.min(...niftyValues) * 0.995;
  const niftyMax = Math.max(...niftyValues) * 1.005;
  const goldMin = Math.min(...goldValues) * 0.995;
  const goldMax = Math.max(...goldValues) * 1.005;

  return (
    <Card className="col-span-2 shadow-md">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Price Chart</CardTitle>
        <Tabs defaultValue={timeframe} onValueChange={setTimeframe}>
          <TabsList>
            <TabsTrigger value="1w">1W</TabsTrigger>
            <TabsTrigger value="1m">1M</TabsTrigger>
            <TabsTrigger value="3m">3M</TabsTrigger>
            <TabsTrigger value="6m">6M</TabsTrigger>
            <TabsTrigger value="1y">1Y</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 0, bottom: 30 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis
                dataKey="formattedDate"
                tick={{ fontSize: 10 }}
                padding={{ left: 10, right: 10 }}
              />
              <YAxis 
                yAxisId="nifty"
                domain={[niftyMin, niftyMax]}
                tick={{ fontSize: 10 }}
                tickFormatter={(value) => value.toLocaleString()}
                orientation="left"
                label={{ value: 'Nifty', angle: -90, position: 'insideLeft', offset: 10, fill: '#2563eb', fontSize: 12 }}
              />
              <YAxis
                yAxisId="gold"
                domain={[goldMin, goldMax]}
                tick={{ fontSize: 10 }}
                tickFormatter={(value) => value.toLocaleString()}
                orientation="right" 
                label={{ value: 'Gold', angle: 90, position: 'insideRight', offset: 10, fill: '#d97706', fontSize: 12 }}
              />
              <Tooltip
                formatter={(value, name) => {
                  if (name === "niftyClose") {
                    return [`${value.toFixed(2)}`, "Nifty"];
                  } else if (name === "goldClose") {
                    return [`${value.toFixed(2)}`, "Gold"];
                  }
                  return [value, name];
                }}
                labelFormatter={(label) => {
                  const dataPoint = chartData.find(d => d.formattedDate === label);
                  return dataPoint ? format(new Date(dataPoint.date), "MMMM d, yyyy") : label;
                }}
              />
              <Legend 
                verticalAlign="top" 
                height={36} 
                formatter={(value) => {
                  if (value === "niftyClose") return "Nifty";
                  if (value === "goldClose") return "Gold";
                  return value;
                }}
              />
              <Line
                name="niftyClose"
                yAxisId="nifty"
                type="monotone"
                dataKey="niftyClose"
                stroke="#2563eb"
                strokeWidth={2}
                dot={false}
                connectNulls={true}
                activeDot={{ r: 4 }}
              />
              <Line
                name="goldClose"
                yAxisId="gold"
                type="monotone"
                dataKey="goldClose"
                stroke="#d97706"
                strokeWidth={2}
                dot={false}
                connectNulls={true}
                activeDot={{ r: 4 }}
              />
              {timeframe !== "all" && timeframe !== "1y" && (
                <Brush 
                  dataKey="formattedDate" 
                  height={25} 
                  stroke="#8884d8"
                  startIndex={Math.max(0, chartData.length - 30)}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
