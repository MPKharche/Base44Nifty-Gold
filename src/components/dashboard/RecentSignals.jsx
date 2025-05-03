import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import {
  ArrowUpCircle,
  ArrowDownCircle,
  Minus,
  LineChart,
  Activity,
  ChartPieIcon,
  ArrowUpDown,
  AlertCircle
} from "lucide-react";

export default function RecentSignals({ signals = [] }) {
  if (!signals || signals.length === 0) {
    return (
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Recent Signals</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex flex-col items-center justify-center">
          <AlertCircle className="w-12 h-12 text-slate-300 mb-4" />
          <p className="text-slate-500">No signals have been generated yet</p>
          <p className="text-xs text-slate-400 mt-2">Signals will appear here as market patterns develop</p>
        </CardContent>
      </Card>
    );
  }

  const typeIcons = {
    lag_correlation: <LineChart className="w-4 h-4" />,
    volatility: <Activity className="w-4 h-4" />,
    zscore: <ArrowUpDown className="w-4 h-4" />,
    ratio: <ArrowUpDown className="w-4 h-4" />,
    statistical: <ChartPieIcon className="w-4 h-4" />,
    combined: <AlertCircle className="w-4 h-4" />
  };
  
  const typeColors = {
    lag_correlation: "text-indigo-600 bg-indigo-50",
    volatility: "text-violet-600 bg-violet-50",
    zscore: "text-cyan-600 bg-cyan-50",
    ratio: "text-teal-600 bg-teal-50",
    statistical: "text-amber-600 bg-amber-50",
    combined: "text-rose-600 bg-rose-50"
  };
  
  const directionIcons = {
    buy: <ArrowUpCircle className="w-4 h-4 text-green-600" />,
    sell: <ArrowDownCircle className="w-4 h-4 text-red-600" />,
    neutral: <Minus className="w-4 h-4 text-slate-600" />
  };
  
  const directionColors = {
    buy: "text-green-700 bg-green-50 border-green-200",
    sell: "text-red-700 bg-red-50 border-red-200",
    neutral: "text-slate-700 bg-slate-50 border-slate-200"
  };
  
  const assetColors = {
    nifty: "text-blue-600",
    gold: "text-amber-600",
    both: "text-purple-600"
  };

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>Recent Trading Signals</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
          {signals.map((signal, index) => (
            <div 
              key={index}
              className="p-3 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center">
                  <Badge 
                    className={`mr-2 ${directionColors[signal.direction]}`}
                    variant="outline"
                  >
                    {directionIcons[signal.direction]}
                    <span className="ml-1 capitalize">{signal.direction}</span>
                  </Badge>
                  <div className={`px-2 py-1 rounded flex items-center text-xs ${typeColors[signal.signal_type]}`}>
                    {typeIcons[signal.signal_type]}
                    <span className="ml-1">
                      {signal.signal_type.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                <span className="text-xs text-slate-500">
                  {format(new Date(signal.date), "MMM d, yyyy")}
                </span>
              </div>
              
              <p className="text-sm text-slate-700 mb-1">
                {signal.description || `${signal.direction.toUpperCase()} signal for ${signal.target_asset} based on ${signal.signal_type.replace('_', ' ')} analysis`}
              </p>
              
              <div className="flex justify-between items-center mt-2">
                <div className="flex items-center text-xs">
                  <span className={`font-medium ${assetColors[signal.target_asset]}`}>
                    {signal.target_asset === "both" ? "Nifty & Gold" : signal.target_asset.charAt(0).toUpperCase() + signal.target_asset.slice(1)}
                  </span>
                </div>
                {signal.strength !== undefined && (
                  <div className="flex items-center">
                    <div className="w-20 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-600 rounded-full"
                        style={{ width: `${signal.strength * 100}%` }}
                      ></div>
                    </div>
                    <span className="ml-2 text-xs text-slate-500">
                      {Math.round(signal.strength * 100)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}