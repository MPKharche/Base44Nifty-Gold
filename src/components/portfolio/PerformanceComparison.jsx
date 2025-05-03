import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
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
  ReferenceLine,
} from "recharts";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default function PerformanceComparison({ dynamicPerformance, staticPerformance }) {
  if (!dynamicPerformance || !staticPerformance || dynamicPerformance.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance Comparison</CardTitle>
          <CardDescription>No data available</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-slate-500">Insufficient performance data</p>
        </CardContent>
      </Card>
    );
  }
  
  // Calculate relative outperformance percentage
  const relativePerformance = dynamicPerformance.map((item, index) => {
    const staticItem = staticPerformance.find(s => s.date === item.date) || staticPerformance[index] || { value: 100 };
    const outperformancePercentage = ((item.value / staticItem.value) - 1) * 100;
    
    return {
      date: item.date,
      outperformance: parseFloat(outperformancePercentage.toFixed(2))
    };
  });
  
  // Calculate drawdowns
  const calculateDrawdowns = (performanceData) => {
    let peak = performanceData[0].value;
    const drawdowns = [];
    
    performanceData.forEach(item => {
      peak = Math.max(peak, item.value);
      const drawdown = ((peak - item.value) / peak) * -100; // Negative percentage
      
      drawdowns.push({
        date: item.date,
        drawdown: parseFloat(drawdown.toFixed(2))
      });
    });
    
    return drawdowns;
  };
  
  const dynamicDrawdowns = calculateDrawdowns(dynamicPerformance);
  const staticDrawdowns = calculateDrawdowns(staticPerformance);
  
  // Combine drawdown data
  const drawdownComparison = dynamicDrawdowns.map((item, index) => {
    const staticItem = staticDrawdowns[index] || { drawdown: 0 };
    
    return {
      date: item.date,
      dynamicDrawdown: item.drawdown,
      staticDrawdown: staticItem.drawdown
    };
  });
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Analysis</CardTitle>
        <CardDescription>
          Outperformance and drawdown comparison vs static allocation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={relativePerformance}
              margin={{
                top: 10,
                right: 30,
                left: 0,
                bottom: 0,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis 
                dataKey="date" 
                tickFormatter={(date) => format(new Date(date), "MMM yyyy")}
                interval={Math.ceil(relativePerformance.length / 8)}
              />
              <YAxis
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip
                formatter={(value) => [`${value > 0 ? "+" : ""}${value}%`, "Relative Outperformance"]}
                labelFormatter={(date) => format(new Date(date), "MMMM d, yyyy")}
              />
              <ReferenceLine y={0} stroke="#666" />
              <Area
                type="monotone"
                dataKey="outperformance"
                name="Outperformance"
                stroke="#4f46e5"
                fill="#818cf8"
                fillOpacity={0.5}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={drawdownComparison}
              margin={{
                top: 10,
                right: 30,
                left: 0,
                bottom: 0,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis 
                dataKey="date" 
                tickFormatter={(date) => format(new Date(date), "MMM yyyy")}
                interval={Math.ceil(drawdownComparison.length / 8)}
              />
              <YAxis
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip
                formatter={(value) => [`${value}%`, value === drawdownComparison[0]?.dynamicDrawdown ? "Dynamic Strategy" : "Static 50/50"]}
                labelFormatter={(date) => format(new Date(date), "MMMM d, yyyy")}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="dynamicDrawdown"
                name="Dynamic Strategy Drawdown"
                stroke="#4f46e5"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="staticDrawdown"
                name="Static 50/50 Drawdown"
                stroke="#94a3b8"
                strokeWidth={2}
                dot={false}
                strokeDasharray="4 4"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-start text-sm text-slate-500">
        <p>* Drawdowns show temporary declines from peak values</p>
        <p>* Lower drawdowns indicate better risk management</p>
      </CardFooter>
    </Card>
  );
}