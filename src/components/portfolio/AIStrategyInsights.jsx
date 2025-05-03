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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import {
  GanttChart,
  PieChart,
  LineChart,
  Timer,
  ArrowUpRight,
  BadgePercent,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";

export default function AIStrategyInsights({ insights }) {
  if (!insights) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI Strategy Insights</CardTitle>
          <CardDescription>No analysis data available</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-slate-500">Run AI analysis to generate insights</p>
        </CardContent>
      </Card>
    );
  }
  
  const renderRegimePatterns = () => {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Market Regimes Identified</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.regimePatterns.map((pattern, index) => (
            <div key={index} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div className="flex items-start gap-3">
                <div className="bg-indigo-100 p-2 rounded-full">
                  {index % 3 === 0 ? (
                    <GanttChart className="w-5 h-5 text-indigo-600" />
                  ) : index % 3 === 1 ? (
                    <PieChart className="w-5 h-5 text-indigo-600" />
                  ) : (
                    <LineChart className="w-5 h-5 text-indigo-600" />
                  )}
                </div>
                <div>
                  <p className="text-sm text-slate-700">{pattern}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  const renderPivotPoints = () => {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Key Pivot Points</h3>
        <div className="space-y-3">
          {insights.pivotPoints.map((pivot, index) => (
            <div key={index} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-3">
                  <div className="bg-green-100 p-2 rounded-full">
                    <Timer className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{pivot.date}</p>
                    <p className="text-sm text-slate-700 mt-1">{pivot.description}</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-green-600">
                  {pivot.impact}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  const renderProfitableThemes = () => {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Profitable Rebalancing Themes</h3>
        <div className="space-y-3">
          {insights.profitableThemes.map((theme, index) => (
            <div key={index} className="flex items-start gap-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div className="bg-amber-100 p-2 rounded-full">
                <BadgePercent className="w-5 h-5 text-amber-600" />
              </div>
              <p className="text-sm text-slate-700">{theme}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  const renderMarketConditionEffectiveness = () => {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Strategy Effectiveness by Market Condition</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2 mb-2">
              <ArrowUpRight className="w-5 h-5 text-green-600" />
              <h4 className="font-medium">Bull Markets</h4>
            </div>
            <p className="text-sm text-slate-700">{insights.marketConditionEffectiveness.bull}</p>
          </div>
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2 mb-2">
              <ArrowUpRight className="w-5 h-5 text-red-600 transform rotate-90" />
              <h4 className="font-medium">Bear Markets</h4>
            </div>
            <p className="text-sm text-slate-700">{insights.marketConditionEffectiveness.bear}</p>
          </div>
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2 mb-2">
              <LineChart className="w-5 h-5 text-blue-600" />
              <h4 className="font-medium">Sideways Markets</h4>
            </div>
            <p className="text-sm text-slate-700">{insights.marketConditionEffectiveness.sideways}</p>
          </div>
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-purple-600" />
              <h4 className="font-medium">High Volatility Periods</h4>
            </div>
            <p className="text-sm text-slate-700">{insights.marketConditionEffectiveness.volatility}</p>
          </div>
        </div>
      </div>
    );
  };
  
  const renderFutureAllocation = () => {
    return (
      <Card className="bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-100">
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-indigo-600" />
            <CardTitle className="text-lg">Future Allocation Recommendation</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 space-y-6">
              <div className="space-y-1">
                <p className="text-sm text-slate-500">Recommended Allocation</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-lg border border-slate-200">
                    <div className="text-sm text-slate-500">Nifty</div>
                    <div className="text-2xl font-bold text-indigo-600">{insights.futureAllocation.niftyTarget}%</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-slate-200">
                    <div className="text-sm text-slate-500">Gold</div>
                    <div className="text-2xl font-bold text-amber-600">{insights.futureAllocation.goldTarget}%</div>
                  </div>
                </div>
              </div>
              
              <div>
                <p className="font-medium mb-2">Rationale</p>
                <p className="text-sm text-slate-700">{insights.futureAllocation.rationale}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Portfolio Strategy Analysis</CardTitle>
        <CardDescription>
          Comprehensive review of dynamic allocation performance and insights
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <p className="text-slate-700">{insights.strategyEffectiveness}</p>
        </div>
        
        <Accordion type="multiple" defaultValue={["item-1"]}>
          <AccordionItem value="item-1">
            <AccordionTrigger>Market Regime Patterns</AccordionTrigger>
            <AccordionContent>
              {renderRegimePatterns()}
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-2">
            <AccordionTrigger>Key Pivot Points</AccordionTrigger>
            <AccordionContent>
              {renderPivotPoints()}
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-3">
            <AccordionTrigger>Profitable Rebalancing Themes</AccordionTrigger>
            <AccordionContent>
              {renderProfitableThemes()}
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-4">
            <AccordionTrigger>Strategy Effectiveness by Market Condition</AccordionTrigger>
            <AccordionContent>
              {renderMarketConditionEffectiveness()}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        
        <div className="mt-8">
          {renderFutureAllocation()}
        </div>
      </CardContent>
    </Card>
  );
}