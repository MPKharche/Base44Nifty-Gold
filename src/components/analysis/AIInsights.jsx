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
            <h3 className="font-medium text-lg text-slate-900 mb-2">Core AI Technologies</h3>
            <p className="text-slate-600">
              QuantEdge Alpha uses several AI components powered by the InvokeLLM integration. This leverages the Core API to 
              access large language models for market analysis, portfolio optimization, and trading strategy generation.
            </p>
          </div>
          
          <div>
            <h3 className="font-medium text-slate-900 mb-1">API Integrations</h3>
            <ul className="list-disc pl-5 space-y-2 text-slate-600">
              <li>
                <span className="font-medium">InvokeLLM API</span>: Used for advanced market insights, portfolio recommendations,
                and market regime identification. This API generates structured JSON responses based on market data and historical correlations.
              </li>
              <li>
                <span className="font-medium">Core Integrations</span>: Provides file processing capabilities for data upload and extraction
                with automatic processing of financial time series data.
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
          
          <div className="bg-slate-50 p-3 rounded border border-slate-200">
            <p className="text-slate-700">
              <span className="font-medium">Technical Note</span>: The AI functionality primarily uses the InvokeLLM
              integration from the Core package, which processes market data using a structured JSON schema to ensure
              reliable and consistent analysis results.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}