import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  HelpCircle,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

export default function TechnicalIndicators({ indicators }) {
  const [activeTab, setActiveTab] = useState("macd");
  
  if (!indicators) return null;
  
  // Generate sample historical data for visualization
  const generateMacdData = () => {
    const today = new Date();
    const data = [];
    
    for (let i = 30; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Generate realistic MACD data with trends
      const niftyValue = indicators.nifty.macd.value * (1 + (Math.random() * 0.4 - 0.2) * (i/30));
      const niftySignal = indicators.nifty.macd.signal * (1 + (Math.random() * 0.3 - 0.15) * (i/30));
      const niftyHistogram = niftyValue - niftySignal;
      
      const goldValue = indicators.gold.macd.value * (1 + (Math.random() * 0.3 - 0.15) * (i/30));
      const goldSignal = indicators.gold.macd.signal * (1 + (Math.random() * 0.2 - 0.1) * (i/30));
      const goldHistogram = goldValue - goldSignal;
      
      data.push({
        date: date.toISOString().split('T')[0],
        niftyValue,
        niftySignal,
        niftyHistogram,
        goldValue,
        goldSignal,
        goldHistogram
      });
    }
    
    return data;
  };
  
  const generateKlingerData = () => {
    const today = new Date();
    const data = [];
    
    // Generate starting values close to the current indicators
    let niftyKlinger = indicators.nifty.klinger.value;
    let goldKlinger = indicators.gold.klinger.value;
    
    for (let i = 30; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Add random walk with trend
      niftyKlinger += Math.random() * 200000 - 70000;
      goldKlinger -= Math.random() * 150000 - 60000;
      
      // Ensure trend consistency with current readings
      if (i < 10) {
        if (indicators.nifty.klinger.trend === "bullish") {
          niftyKlinger = Math.abs(niftyKlinger);
        } else {
          niftyKlinger = -Math.abs(niftyKlinger);
        }
        
        if (indicators.gold.klinger.trend === "bullish") {
          goldKlinger = Math.abs(goldKlinger);
        } else {
          goldKlinger = -Math.abs(goldKlinger);
        }
      }
      
      data.push({
        date: date.toISOString().split('T')[0],
        niftyKlinger,
        goldKlinger,
        niftySignal: niftyKlinger * 0.85,
        goldSignal: goldKlinger * 0.85
      });
    }
    
    return data;
  };
  
  const generateCorrelationData = () => {
    const today = new Date();
    const data = [];
    
    for (let i = 90; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Generate correlation data with cyclical pattern
      const dayValue = i / 90; // normalized day value (0-1)
      const cycleFactor = Math.sin(dayValue * Math.PI * 2 * 3) * 0.2; // cyclical component
      
      const macdCorr = indicators.correlations.macdPrice + cycleFactor;
      const klingerCorr = indicators.correlations.klingerVolume + cycleFactor * 0.8;
      const signalRoi = indicators.correlations.signalRoi + cycleFactor * 5;
      
      data.push({
        date: date.toISOString().split('T')[0],
        macdCorr,
        klingerCorr,
        signalRoi
      });
    }
    
    return data;
  };

  const macdData = generateMacdData();
  const klingerData = generateKlingerData();
  const correlationData = generateCorrelationData();
  
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  
  const getMacdExplanation = () => {
    const niftyMacd = indicators.nifty.macd;
    const goldMacd = indicators.gold.macd;
    
    let niftyExplanation = "";
    if (niftyMacd.histogram > 0 && niftyMacd.histogram > niftyMacd.histogram * 0.9) {
      niftyExplanation = "Nifty shows strong positive momentum with MACD above signal line.";
    } else if (niftyMacd.histogram > 0) {
      niftyExplanation = "Nifty displays positive momentum, but might be slowing down.";
    } else if (niftyMacd.histogram < 0 && niftyMacd.histogram < niftyMacd.histogram * 0.9) {
      niftyExplanation = "Nifty facing strong negative momentum with MACD below signal line.";
    } else {
      niftyExplanation = "Nifty momentum is negative but potentially improving.";
    }
    
    let goldExplanation = "";
    if (goldMacd.histogram > 0 && goldMacd.histogram > goldMacd.histogram * 0.9) {
      goldExplanation = "Gold shows strong positive momentum with MACD above signal line.";
    } else if (goldMacd.histogram > 0) {
      goldExplanation = "Gold displays positive momentum, but might be slowing down.";
    } else if (goldMacd.histogram < 0 && goldMacd.histogram < goldMacd.histogram * 0.9) {
      goldExplanation = "Gold facing strong negative momentum with MACD below signal line.";
    } else {
      goldExplanation = "Gold momentum is negative but potentially improving.";
    }
    
    return { niftyExplanation, goldExplanation };
  };
  
  const getKlingerExplanation = () => {
    const niftyKlinger = indicators.nifty.klinger;
    const goldKlinger = indicators.gold.klinger;
    
    let niftyExplanation = "";
    if (niftyKlinger.trend === "bullish") {
      niftyExplanation = "Nifty shows bullish volume flow, indicating strong buying pressure.";
    } else {
      niftyExplanation = "Nifty shows bearish volume flow, indicating distribution and selling pressure.";
    }
    
    let goldExplanation = "";
    if (goldKlinger.trend === "bullish") {
      goldExplanation = "Gold shows bullish volume flow, indicating accumulation and buying interest.";
    } else {
      goldExplanation = "Gold shows bearish volume flow, indicating distribution and profit taking.";
    }
    
    return { niftyExplanation, goldExplanation };
  };
  
  const { niftyMacdExplanation, goldMacdExplanation } = getMacdExplanation();
  const { niftyKlingerExplanation, goldKlingerExplanation } = getKlingerExplanation();

  return (
    <Card className="shadow-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Technical Indicators</CardTitle>
            <CardDescription>Advanced momentum and volume analysis</CardDescription>
          </div>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="macd">MACD</TabsTrigger>
              <TabsTrigger value="klinger">Klinger</TabsTrigger>
              <TabsTrigger value="correlation">Correlation</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        {activeTab === "macd" && (
          <div className="space-y-5">
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={macdData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={formatDate}
                    interval={5}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [value.toFixed(2), '']}
                    labelFormatter={(label) => formatDate(label)}
                  />
                  <Legend />
                  <Line 
                    name="Nifty MACD" 
                    type="monotone" 
                    dataKey="niftyValue" 
                    stroke="#4f46e5" 
                    strokeWidth={2}
                  />
                  <Line 
                    name="Nifty Signal" 
                    type="monotone" 
                    dataKey="niftySignal" 
                    stroke="#93c5fd" 
                    strokeWidth={1.5} 
                    strokeDasharray="3 3"
                  />
                  <Line 
                    name="Gold MACD" 
                    type="monotone" 
                    dataKey="goldValue" 
                    stroke="#d97706" 
                    strokeWidth={2}
                  />
                  <Line 
                    name="Gold Signal" 
                    type="monotone" 
                    dataKey="goldSignal" 
                    stroke="#fcd34d" 
                    strokeWidth={1.5} 
                    strokeDasharray="3 3"
                  />
                  <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 p-3 rounded-lg space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Nifty MACD</span>
                    <HoverCard>
                      <HoverCardTrigger>
                        <HelpCircle className="h-4 w-4 text-slate-400" />
                      </HoverCardTrigger>
                      <HoverCardContent className="w-80">
                        <p className="text-sm">
                          MACD (Moving Average Convergence Divergence) measures momentum by comparing 
                          12-day and 26-day EMAs. Positive values suggest bullish momentum.
                        </p>
                      </HoverCardContent>
                    </HoverCard>
                  </div>
                  <Badge 
                    className={indicators.nifty.macd.histogram > 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                  >
                    {indicators.nifty.macd.value.toFixed(2)}
                  </Badge>
                </div>
                <div className="text-sm text-slate-600">
                  {indicators.nifty.macd.histogram > 0 ? (
                    <div className="flex items-center gap-1">
                      <ArrowUpRight className="h-4 w-4 text-green-600" />
                      <span>Bullish momentum (above signal line)</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <ArrowDownRight className="h-4 w-4 text-red-600" />
                      <span>Bearish momentum (below signal line)</span>
                    </div>
                  )}
                </div>
                <p className="text-sm text-slate-700">{niftyMacdExplanation}</p>
              </div>
              
              <div className="bg-slate-50 p-3 rounded-lg space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Gold MACD</span>
                    <HoverCard>
                      <HoverCardTrigger>
                        <HelpCircle className="h-4 w-4 text-slate-400" />
                      </HoverCardTrigger>
                      <HoverCardContent className="w-80">
                        <p className="text-sm">
                          For Gold, MACD values are typically larger due to higher price points. 
                          The histogram shows the difference between MACD and its signal line.
                        </p>
                      </HoverCardContent>
                    </HoverCard>
                  </div>
                  <Badge 
                    className={indicators.gold.macd.histogram > 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                  >
                    {indicators.gold.macd.value.toFixed(2)}
                  </Badge>
                </div>
                <div className="text-sm text-slate-600">
                  {indicators.gold.macd.histogram > 0 ? (
                    <div className="flex items-center gap-1">
                      <ArrowUpRight className="h-4 w-4 text-green-600" />
                      <span>Bullish momentum (above signal line)</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <ArrowDownRight className="h-4 w-4 text-red-600" />
                      <span>Bearish momentum (below signal line)</span>
                    </div>
                  )}
                </div>
                <p className="text-sm text-slate-700">{goldMacdExplanation}</p>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === "klinger" && (
          <div className="space-y-5">
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={klingerData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={formatDate}
                    interval={5}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [value.toFixed(2), '']}
                    labelFormatter={(label) => formatDate(label)}
                  />
                  <Legend />
                  <Line 
                    name="Nifty Klinger" 
                    type="monotone" 
                    dataKey="niftyKlinger" 
                    stroke="#4f46e5" 
                    strokeWidth={2}
                  />
                  <Line 
                    name="Nifty Signal" 
                    type="monotone" 
                    dataKey="niftySignal" 
                    stroke="#93c5fd" 
                    strokeWidth={1.5} 
                    strokeDasharray="3 3"
                  />
                  <Line 
                    name="Gold Klinger" 
                    type="monotone" 
                    dataKey="goldKlinger" 
                    stroke="#d97706" 
                    strokeWidth={2}
                  />
                  <Line 
                    name="Gold Signal" 
                    type="monotone" 
                    dataKey="goldSignal" 
                    stroke="#fcd34d" 
                    strokeWidth={1.5} 
                    strokeDasharray="3 3"
                  />
                  <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 p-3 rounded-lg space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Nifty Klinger</span>
                    <HoverCard>
                      <HoverCardTrigger>
                        <HelpCircle className="h-4 w-4 text-slate-400" />
                      </HoverCardTrigger>
                      <HoverCardContent className="w-80">
                        <p className="text-sm">
                          Klinger Volume Oscillator combines volume and price to show the underlying 
                          money flow. It helps identify divergences between price and volume.
                        </p>
                      </HoverCardContent>
                    </HoverCard>
                  </div>
                  <Badge 
                    className={indicators.nifty.klinger.trend === "bullish" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                  >
                    {indicators.nifty.klinger.trend}
                  </Badge>
                </div>
                <div className="text-sm text-slate-600">
                  {indicators.nifty.klinger.trend === "bullish" ? (
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span>Positive money flow</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <TrendingDown className="h-4 w-4 text-red-600" />
                      <span>Negative money flow</span>
                    </div>
                  )}
                </div>
                <p className="text-sm text-slate-700">{niftyKlingerExplanation}</p>
              </div>
              
              <div className="bg-slate-50 p-3 rounded-lg space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Gold Klinger</span>
                    <HoverCard>
                      <HoverCardTrigger>
                        <HelpCircle className="h-4 w-4 text-slate-400" />
                      </HoverCardTrigger>
                      <HoverCardContent className="w-80">
                        <p className="text-sm">
                          For Gold, the Klinger oscillator measures accumulation or distribution. 
                          Crossovers with signal lines can indicate potential trade entries.
                        </p>
                      </HoverCardContent>
                    </HoverCard>
                  </div>
                  <Badge 
                    className={indicators.gold.klinger.trend === "bullish" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                  >
                    {indicators.gold.klinger.trend}
                  </Badge>
                </div>
                <div className="text-sm text-slate-600">
                  {indicators.gold.klinger.trend === "bullish" ? (
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span>Positive money flow</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <TrendingDown className="h-4 w-4 text-red-600" />
                      <span>Negative money flow</span>
                    </div>
                  )}
                </div>
                <p className="text-sm text-slate-700">{goldKlingerExplanation}</p>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === "correlation" && (
          <div className="space-y-5">
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={correlationData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={formatDate}
                    interval={14}
                  />
                  <YAxis domain={[0, 1]} />
                  <Tooltip 
                    formatter={(value) => [value.toFixed(2), '']}
                    labelFormatter={(label) => formatDate(label)}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="macdCorr"
                    name="MACD Correlation"
                    stroke="#4f46e5"
                    fill="#c7d2fe"
                    fillOpacity={0.6}
                  />
                  <Area
                    type="monotone"
                    dataKey="klingerCorr"
                    name="Klinger Correlation"
                    stroke="#d97706"
                    fill="#fef3c7"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
            <div className="p-4 bg-slate-50 rounded-lg">
              <div className="mb-4">
                <h3 className="font-medium mb-2">Correlation Analysis</h3>
                <p className="text-sm text-slate-600">
                  Historical correlation between technical signals and price movements helps validate indicator effectiveness.
                  Higher values indicate stronger relationships between indicators and subsequent price action.
                </p>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                    <span className="text-sm">MACD Price Correlation:</span>
                  </div>
                  <span className="font-medium">{indicators.correlations.macdPrice}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                    <span className="text-sm">Klinger Volume Impact:</span>
                  </div>
                  <span className="font-medium">{indicators.correlations.klingerVolume}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Signal ROI:</span>
                  </div>
                  <span className="font-medium text-green-600">{indicators.correlations.signalRoi}%</span>
                </div>
              </div>
              
              <div className="mt-4 text-xs text-slate-500">
                <p>* Correlation values above 0.7 suggest strong predictive power</p>
                <p>* Signal ROI represents average return when trading on combined signals</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="mt-5 p-3 border border-slate-200 rounded-lg bg-slate-50">
          <h3 className="font-medium mb-2">Current Market Implications</h3>
          <p className="text-sm text-slate-600 mb-2">
            {indicators.nifty.macd.histogram > 0 && indicators.nifty.klinger.trend === "bullish"
              ? "Nifty shows strong bullish confluence with both momentum and volume indicators aligned positively. Consider overweight positions."
              : indicators.nifty.macd.histogram < 0 && indicators.nifty.klinger.trend === "bearish"
              ? "Nifty displays bearish alignment across indicators, suggesting caution with exposure and potential hedging."
              : "Nifty shows mixed signals between momentum and volume indicators. Consider neutral weight while monitoring for alignment."}
          </p>
          <p className="text-sm text-slate-600">
            {indicators.gold.macd.histogram > 0 && indicators.gold.klinger.trend === "bullish"
              ? "Gold exhibits strong bullish momentum with supporting volume flows. Consider increasing allocation."
              : indicators.gold.macd.histogram < 0 && indicators.gold.klinger.trend === "bearish" 
              ? "Gold shows technical weakness across indicators. Consider reducing exposure temporarily."
              : "Gold presents contradictory technical signals. Monitor for resolution before adjusting allocation."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}