import React from "react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Bar,
  ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default function DynamicAllocationChart({ portfolioData, staticData, period }) {
  if (!portfolioData || !staticData || portfolioData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Performance & Allocation</CardTitle>
          <CardDescription>No data available</CardDescription>
        </CardHeader>
        <CardContent className="h-[500px] flex items-center justify-center">
          <p className="text-slate-500">Insufficient data to display chart</p>
        </CardContent>
      </Card>
    );
  }

  // Filter data based on selected period
  const filterData = (data) => {
    if (period === "full") return data;
    
    const periodRanges = {
      "2018-2019": { start: "2018-01-01", end: "2019-12-31" },
      "2020-2021": { start: "2020-01-01", end: "2021-12-31" },
      "2022-2023": { start: "2022-01-01", end: "2023-12-31" },
      "2024-2025": { start: "2024-01-01", end: "2025-12-31" }
    };
    
    const range = periodRanges[period];
    if (!range) return data;
    
    return data.filter(item => {
      const date = new Date(item.date);
      return date >= new Date(range.start) && date <= new Date(range.end);
    });
  };
  
  const filteredPortfolioData = filterData(portfolioData);
  const filteredStaticData = filterData(staticData);
  
  // Combine data for the chart
  const chartData = filteredPortfolioData.map((item, index) => {
    const staticItem = filteredStaticData.find(s => s.date === item.date) || { value: 100 };
    
    return {
      date: item.date,
      dynamicValue: parseFloat(item.value.toFixed(2)),
      staticValue: parseFloat(staticItem.value.toFixed(2)),
      niftyAllocation: item.niftyAllocation,
      goldAllocation: item.goldAllocation
    };
  });
  
  // Calculate performance metrics
  const calculatePerformance = (data) => {
    if (!data || data.length < 2) return { return: 0 };
    
    const startValue = data[0].value || data[0].dynamicValue;
    const endValue = data[data.length - 1].value || data[data.length - 1].dynamicValue;
    const years = data.length / 12; // Assuming monthly data
    
    const cagr = (Math.pow(endValue / startValue, 1 / years) - 1) * 100;
    
    return {
      return: cagr.toFixed(2)
    };
  };
  
  const dynamicPerformance = calculatePerformance(filteredPortfolioData);
  const staticPerformance = calculatePerformance(filteredStaticData);
  
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Portfolio Performance & Allocation</CardTitle>
            <CardDescription>
              Dynamic vs static allocation with weight history
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Badge variant="secondary">
              Dynamic: {dynamicPerformance.return}%
            </Badge>
            <Badge variant="outline">
              Static 50/50: {staticPerformance.return}%
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[500px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 60,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis 
                dataKey="date" 
                tickFormatter={(date) => format(new Date(date), "MMM yyyy")}
              />
              <YAxis 
                yAxisId="left" 
                orientation="left" 
                domain={[
                  dataMin => Math.floor(dataMin * 0.9),
                  dataMax => Math.ceil(dataMax * 1.1)
                ]}
                label={{ value: 'Portfolio Value (₹)', angle: -90, position: 'insideLeft', offset: -5 }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[0, 100]}
                label={{ value: 'Asset Allocation (%)', angle: 90, position: 'insideRight', offset: 5 }}
              />
              <Tooltip
                formatter={(value, name) => {
                  if (name === "dynamicValue") return [`₹${value}`, "Dynamic Portfolio"];
                  if (name === "staticValue") return [`₹${value}`, "Static 50/50"];
                  if (name === "niftyAllocation") return [`${value}%`, "Nifty Allocation"];
                  if (name === "goldAllocation") return [`${value}%`, "Gold Allocation"];
                  return [value, name];
                }}
                labelFormatter={(date) => format(new Date(date), "MMMM d, yyyy")}
              />
              <Legend
                verticalAlign="bottom"
                height={60}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="dynamicValue"
                name="Dynamic Portfolio"
                stroke="#4f46e5"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="staticValue"
                name="Static 50/50"
                stroke="#94a3b8"
                strokeWidth={2}
                dot={false}
                strokeDasharray="4 4"
              />
              <Area
                yAxisId="right"
                type="monotone"
                dataKey="niftyAllocation"
                name="Nifty Allocation"
                fill="#2563eb"
                fillOpacity={0.4}
                stroke="none"
                stackId="allocation"
              />
              <Area
                yAxisId="right"
                type="monotone"
                dataKey="goldAllocation"
                name="Gold Allocation"
                fill="#d97706"
                fillOpacity={0.4}
                stroke="none"
                stackId="allocation"
              />
              <ReferenceLine yAxisId="right" y={50} stroke="#333" strokeDasharray="3 3" />
              <ReferenceLine yAxisId="right" y={75} stroke="#666" strokeDasharray="2 5" />
              <ReferenceLine yAxisId="right" y={30} stroke="#666" strokeDasharray="2 5" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}