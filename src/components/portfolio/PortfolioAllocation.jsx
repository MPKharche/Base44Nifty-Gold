
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

export default function PortfolioAllocation({ weights, onWeightChange, metrics }) {
  const handleNiftyChange = (value) => {
    onWeightChange({
      nifty: value,
      gold: 100 - value
    });
  };

  const data = [
    { name: "Nifty", value: weights.nifty, color: "#2563eb" },
    { name: "Gold", value: weights.gold, color: "#d97706" }
  ];

  const formatReturn = (value) => {
    if (!value || isNaN(value)) return "0.00";
    return value;
  };

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>Portfolio Allocation</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [`${value}%`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-4 space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">
                  Nifty Weight: {weights.nifty}%
                </label>
                <Slider
                  defaultValue={[weights.nifty]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={(value) => handleNiftyChange(value[0])}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">
                  Gold Weight: {weights.gold}%
                </label>
                <Slider
                  defaultValue={[weights.gold]}
                  min={0}
                  max={100}
                  step={1}
                  disabled
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-slate-700 mb-2">Portfolio Metrics</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-50 p-2 rounded">
                  <div className="text-xs text-slate-500">YTD Return</div>
                  <div className="text-lg font-medium text-slate-700">
                    {metrics?.returns.ytd}%
                  </div>
                </div>
                <div className="bg-slate-50 p-2 rounded">
                  <div className="text-xs text-slate-500">Volatility</div>
                  <div className="text-lg font-medium text-slate-700">
                    {metrics?.risk.volatility}%
                  </div>
                </div>
                <div className="bg-slate-50 p-2 rounded">
                  <div className="text-xs text-slate-500">Max Drawdown</div>
                  <div className="text-lg font-medium text-slate-700">
                    {metrics?.risk.maxDrawdown}%
                  </div>
                </div>
                <div className="bg-slate-50 p-2 rounded">
                  <div className="text-xs text-slate-500">Sharpe Ratio</div>
                  <div className="text-lg font-medium text-slate-700">
                    {metrics?.risk.sharpeRatio}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-slate-700 mb-2">Historical Returns</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">1 Year</span>
                  <Badge variant={metrics?.returns['1y'] >= 0 ? "success" : "destructive"}>
                    {formatReturn(metrics?.returns['1y'])}%
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">3 Years</span>
                  <Badge variant={metrics?.returns['3y'] >= 0 ? "success" : "destructive"}>
                    {formatReturn(metrics?.returns['3y'])}%
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">5 Years</span>
                  <Badge variant={metrics?.returns['5y'] >= 0 ? "success" : "destructive"}>
                    {formatReturn(metrics?.returns['5y'])}%
                  </Badge>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-slate-700 mb-2">Correlation</h3>
              <div className="bg-slate-50 p-3 rounded">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Nifty-Gold</span>
                  <span className="font-medium text-slate-700">{metrics?.correlation}</span>
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {Math.abs(metrics?.correlation) < 0.3 ? "Low correlation - Good diversification" :
                   Math.abs(metrics?.correlation) < 0.7 ? "Moderate correlation" :
                   "High correlation - Limited diversification"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
