import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function AIInsights() {
  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="bg-indigo-100 p-1 rounded">
            <AlertCircle className="w-5 h-5 text-indigo-700" />
          </div>
          AI Integration Overview
        </CardTitle>
        <CardDescription>
          Understanding the AI technologies in QuantEdge Alpha
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 text-sm">
          <div>
            <h3 className="font-medium text-lg text-slate-900 mb-2">Local Analysis Engine</h3>
            <p className="text-slate-600">
              This application uses advanced local algorithms for market analysis, portfolio optimization, and trading strategy generation.
              All analysis runs entirely in your browser - no external API calls required. This ensures privacy, speed, and offline capability.
            </p>
          </div>
          
          <div>
            <h3 className="font-medium text-slate-900 mb-1">Analysis Capabilities</h3>
            <ul className="list-disc pl-5 space-y-2 text-slate-600">
              <li>
                <span className="font-medium">Market Insights</span>: Advanced statistical analysis for market insights, portfolio recommendations,
                and market regime identification. Generates structured analysis based on market data and historical correlations.
              </li>
              <li>
                <span className="font-medium">CSV Processing</span>: Local file processing capabilities for data upload and parsing
                with automatic processing of financial time series data. Supports multiple CSV formats.
              </li>
              <li>
                <span className="font-medium">Local Storage</span>: All data is stored locally in your browser using IndexedDB,
                ensuring privacy and fast access without server dependencies.
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium text-slate-900 mb-1">AI Applications</h3>
            <ol className="list-decimal pl-5 space-y-2 text-slate-600">
              <li>
                <span className="font-medium">Portfolio Optimization</span>: AI algorithms suggest optimal asset allocations
                based on historical returns, volatility patterns, and correlation dynamics.
              </li>
              <li>
                <span className="font-medium">Market Regime Detection</span>: Machine learning models identify the current
                market environment (trending, mean-reverting, volatile) to adapt strategies accordingly.
              </li>
              <li>
                <span className="font-medium">Trading Signal Generation</span>: Statistical models generate buy/sell signals
                based on Z-scores, volatility breakouts, and correlation patterns.
              </li>
              <li>
                <span className="font-medium">Risk Analysis</span>: AI evaluates portfolio risk through Monte Carlo
                simulations and stress testing against historical scenarios.
              </li>
            </ol>
          </div>
          
          <div className="bg-blue-50 p-3 rounded border border-blue-200">
            <p className="text-blue-800">
              <span className="font-medium">Privacy & Performance</span>: All analysis runs locally in your browser using
              advanced statistical algorithms. No data is sent to external servers, ensuring complete privacy and instant
              results. The analysis engine uses correlation analysis, volatility metrics, Sharpe ratios, and other
              quantitative methods to generate insights.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}