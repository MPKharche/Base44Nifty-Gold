
import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from "recharts";

export default function PortfolioSimulation({ simulationResult, timeframe }) {
  if (!simulationResult) {
    return (
      <div className="h-[400px] flex items-center justify-center">
        <p className="text-slate-500">Run simulation to see portfolio projections</p>
      </div>
    );
  }

  // Convert Monte Carlo paths to chart data
  const chartData = simulationResult.monteCarlo.metrics.median.map((value, i) => ({
    month: i,
    median: value,
    upper: simulationResult.monteCarlo.metrics.percentile95[i],
    lower: simulationResult.monteCarlo.metrics.percentile5[i]
  }));

  return (
    <div className="h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis
            dataKey="month"
            tickFormatter={(value) => `${Math.floor(value / 12)}Y ${value % 12}M`}
          />
          <YAxis
            tickFormatter={(value) => `₹${value.toFixed(0)}`}
            domain={[
              dataMin => Math.floor(dataMin * 0.9),
              dataMax => Math.ceil(dataMax * 1.1)
            ]}
          />
          <Tooltip
            formatter={(value) => [`₹${value.toFixed(2)}`, "Portfolio Value"]}
            labelFormatter={(value) => `Month ${value}`}
          />
          <Area
            type="monotone"
            dataKey="upper"
            strokeWidth={0}
            stroke="#4f46e5"
            fill="#4f46e5"
            fillOpacity={0.1}
          />
          <Area
            type="monotone"
            dataKey="lower"
            strokeWidth={0}
            stroke="#4f46e5"
            fill="#4f46e5"
            fillOpacity={0.1}
          />
          <Line
            type="monotone"
            dataKey="median"
            stroke="#4f46e5"
            strokeWidth={2}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
      <div className="mt-4 grid grid-cols-3 gap-4 text-center text-sm">
        <div>
          <div className="text-slate-500">95th Percentile</div>
          <div className="font-medium text-green-600">
            ₹{simulationResult.monteCarlo.metrics.percentile95[simulationResult.monteCarlo.metrics.percentile95.length - 1].toFixed(2)}
          </div>
        </div>
        <div>
          <div className="text-slate-500">Median</div>
          <div className="font-medium text-slate-700">
            ₹{simulationResult.monteCarlo.metrics.median[simulationResult.monteCarlo.metrics.median.length - 1].toFixed(2)}
          </div>
        </div>
        <div>
          <div className="text-slate-500">5th Percentile</div>
          <div className="font-medium text-red-600">
            ₹{simulationResult.monteCarlo.metrics.percentile5[simulationResult.monteCarlo.metrics.percentile5.length - 1].toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
}
