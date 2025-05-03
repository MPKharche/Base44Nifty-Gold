
import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function SharpeBellCurve({ timeframe, weights, sharpeData }) {
  // Generate normal distribution data around the current Sharpe ratio
  const generateBellCurve = (mean, stdDev, points = 100) => {
    const data = [];
    const range = stdDev * 4;
    const step = range / points;

    for (let x = mean - range / 2; x <= mean + range / 2; x += step) {
      const y = (1 / (stdDev * Math.sqrt(2 * Math.PI))) * 
                Math.exp(-Math.pow(x - mean, 2) / (2 * stdDev * stdDev));
      data.push({
        x: parseFloat(x.toFixed(2)),
        y: parseFloat(y.toFixed(4)),
        optimal: Math.abs(x - sharpeData.optimalSharpe) < 0.05
      });
    }

    return data;
  };

  const bellCurveData = generateBellCurve(
    sharpeData.currentSharpe,
    sharpeData.sharpeStdDev
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>({timeframe})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={bellCurveData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis 
                dataKey="x"
                label={{ value: 'Sharpe Ratio', position: 'bottom' }}
                domain={['dataMin', 'dataMax']}
              />
              <YAxis hide />
              <Tooltip
                formatter={(value, name, props) => {
                  if (props.payload.optimal) {
                    return [`${value} (Optimal)`, 'Probability Density'];
                  }
                  return [value, 'Probability Density'];
                }}
                labelFormatter={(value) => `Sharpe Ratio: ${value}`}
              />
              <ReferenceLine
                x={sharpeData.currentSharpe}
                stroke="#4f46e5"
                strokeDasharray="3 3"
                label={{
                  value: 'Current',
                  position: 'top',
                  fill: '#4f46e5'
                }}
              />
              <ReferenceLine
                x={sharpeData.optimalSharpe}
                stroke="#22c55e"
                strokeDasharray="3 3"
                label={{
                  value: 'Optimal',
                  position: 'top',
                  fill: '#22c55e'
                }}
              />
              <Area
                type="monotone"
                dataKey="y"
                stroke="#4f46e5"
                fill="#4f46e5"
                fillOpacity={0.2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-600">Current Sharpe:</span>
              <span className="font-medium">{sharpeData.currentSharpe.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Optimal Sharpe:</span>
              <span className="font-medium text-green-600">
                {sharpeData.optimalSharpe.toFixed(2)}
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-600">Optimal Nifty:</span>
              <span className="font-medium">{sharpeData.optimalWeights.nifty}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Optimal Gold:</span>
              <span className="font-medium">{sharpeData.optimalWeights.gold}%</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
