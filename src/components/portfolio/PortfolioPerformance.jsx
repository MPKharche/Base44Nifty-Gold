import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { format } from "date-fns";

export default function PortfolioPerformance({ 
  niftyData,
  goldData,
  weights,
  timeframe,
  onTimeframeChange
}) {
  // Calculate portfolio performance
  const calculatePerformanceData = () => {
    const niftyWeight = weights.nifty / 100;
    const goldWeight = weights.gold / 100;
    let portfolioValue = 100;
    let niftyValue = 100;
    let goldValue = 100;

    return niftyData.map((item, i) => {
      const goldItem = goldData[i];
      if (!goldItem) return null;

      // Update values
      niftyValue *= (1 + (item.returns || 0) / 100);
      goldValue *= (1 + (goldItem.returns || 0) / 100);
      portfolioValue = (niftyValue * niftyWeight) + (goldValue * goldWeight);

      return {
        date: format(new Date(item.date), "MMM dd, yyyy"),
        portfolio: parseFloat(portfolioValue.toFixed(2)),
        nifty: parseFloat(niftyValue.toFixed(2)),
        gold: parseFloat(goldValue.toFixed(2))
      };
    }).filter(Boolean);
  };

  const performanceData = calculatePerformanceData();

  return (
    <Card className="shadow-md">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Portfolio Performance</CardTitle>
        <Tabs defaultValue={timeframe} onValueChange={onTimeframeChange}>
          <TabsList>
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
              data={performanceData}
              margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10 }}
                tickFormatter={(value) => value.substring(0, 6)}
                interval={Math.ceil(performanceData.length / 10)}
              />
              <YAxis
                tickFormatter={(value) => `${value}%`}
                domain={[
                  dataMin => Math.floor(dataMin * 0.95),
                  dataMax => Math.ceil(dataMax * 1.05)
                ]}
              />
              <Tooltip
                formatter={(value) => [`${value}%`, undefined]}
                labelFormatter={(label) => format(new Date(label), "MMMM d, yyyy")}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="portfolio"
                name="Portfolio"
                stroke="#4f46e5"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="nifty"
                name="Nifty"
                stroke="#2563eb"
                strokeWidth={1}
                dot={false}
                strokeDasharray="3 3"
              />
              <Line
                type="monotone"
                dataKey="gold"
                name="Gold"
                stroke="#d97706"
                strokeWidth={1}
                dot={false}
                strokeDasharray="3 3"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}