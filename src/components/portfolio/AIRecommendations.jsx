import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, TrendingUp, TrendingDown } from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

export default function AIRecommendations({ 
  currentWeights,
  recommendedWeights,
  historicalData,
  returnScenarios,
  recommendations
}) {
  const weightChanges = {
    nifty: {
      current: currentWeights.nifty,
      recommended: recommendedWeights.nifty,
      change: recommendedWeights.nifty - currentWeights.nifty
    },
    gold: {
      current: currentWeights.gold,
      recommended: recommendedWeights.gold,
      change: recommendedWeights.gold - currentWeights.gold
    }
  };

  return (
    <Card className="shadow-md">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="w-2 h-8 bg-indigo-600 rounded-full"></div>
          <div>
            <CardTitle>AI Portfolio Recommendations</CardTitle>
            <CardDescription>Data-driven allocation strategy based on market analysis</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Weight Changes */}
          <div>
            <h3 className="text-lg font-medium mb-4">Recommended Weight Adjustments</h3>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { name: 'Nifty', current: weightChanges.nifty.current, recommended: weightChanges.nifty.recommended },
                  { name: 'Gold', current: weightChanges.gold.current, recommended: weightChanges.gold.recommended }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => `${value}%`} />
                  <Tooltip formatter={(value) => `${value}%`} />
                  <Legend />
                  <Bar dataKey="current" fill="#94a3b8" name="Current Weight" />
                  <Bar dataKey="recommended" fill="#4f46e5" name="Recommended Weight" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Expected Returns */}
          <div>
            <h3 className="text-lg font-medium mb-4">Expected Returns Analysis</h3>
            <div className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span>Conservative</span>
                  <Badge variant="outline" className="text-blue-600">
                    {returnScenarios.conservative}%
                  </Badge>
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span>Moderate</span>
                  <Badge variant="outline" className="text-indigo-600">
                    {returnScenarios.moderate}%
                  </Badge>
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span>Aggressive</span>
                  <Badge variant="outline" className="text-purple-600">
                    {returnScenarios.aggressive}%
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Risk Analysis */}
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-3">Risk Analysis & Insights</h3>
          <div className="space-y-3">
            {recommendations?.riskAnalysis?.map((risk, i) => (
              <div key={i} className="flex items-start gap-2 bg-slate-50 p-3 rounded-lg">
                <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                <p className="text-slate-600">{risk}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Market Regime */}
        {recommendations?.marketRegime && (
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-3">Market Regime & Strategy</h3>
            <div className="bg-indigo-50 p-4 rounded-lg">
              <p className="text-indigo-900">
                <span className="font-medium">Current Market Regime: </span>
                {recommendations.marketRegime}
              </p>
              {recommendations.rebalancingAdvice && (
                <p className="text-indigo-900 mt-2">
                  <span className="font-medium">Recommended Action: </span>
                  {recommendations.rebalancingAdvice}
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}