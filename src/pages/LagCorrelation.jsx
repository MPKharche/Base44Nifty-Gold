import React, { useState, useEffect } from "react";
import { MarketData } from "@/api/entities";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Info } from "lucide-react";
import { format, parseISO } from "date-fns";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import CorrelationChart from "../components/charts/CorrelationChart";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  LineChart,
  Line,
  Scatter,
  ScatterChart,
  ZAxis,
} from "recharts";

export default function LagCorrelation() {
  const [niftyData, setNiftyData] = useState([]);
  const [goldData, setGoldData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analysisType, setAnalysisType] = useState("rolling");
  const [lagDays, setLagDays] = useState(0);
  const [lagCorrelations, setLagCorrelations] = useState([]);
  const [scatterData, setScatterData] = useState([]);
  const [laggedTimeSeries, setLaggedTimeSeries] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (niftyData.length > 0 && goldData.length > 0) {
      calculateLagCorrelations();
      updateScatterPlot();
      updateLaggedTimeSeries();
    }
  }, [niftyData, goldData, lagDays]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load Nifty data
      const niftyResult = await MarketData.filter(
        { asset_type: "nifty" },
        "-date",
        1000
      );

      // Load Gold data
      const goldResult = await MarketData.filter(
        { asset_type: "gold" },
        "-date",
        1000
      );

      setNiftyData(niftyResult.reverse()); // Chronological order
      setGoldData(goldResult.reverse()); // Chronological order
    } catch (err) {
      console.error("Error loading data:", err);
      setError("Failed to load market data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const calculateLagCorrelations = () => {
    const maxLag = 10;
    const results = [];

    // Calculate correlation for each lag
    for (let lag = -maxLag; lag <= maxLag; lag++) {
      const pairs = [];

      // Create pairs of data points with the appropriate lag
      for (let i = Math.max(0, lag); i < Math.min(niftyData.length, goldData.length + lag); i++) {
        const niftyIndex = i;
        const goldIndex = i - lag;

        if (
          goldIndex >= 0 &&
          goldIndex < goldData.length &&
          niftyData[niftyIndex].returns !== undefined &&
          goldData[goldIndex].returns !== undefined
        ) {
          pairs.push({
            niftyReturn: niftyData[niftyIndex].returns,
            goldReturn: goldData[goldIndex].returns,
          });
        }
      }

      // Calculate correlation coefficient if we have enough data points
      let correlation = 0;
      if (pairs.length >= 30) {
        // Calculate means
        const niftyMean = pairs.reduce((sum, pair) => sum + pair.niftyReturn, 0) / pairs.length;
        const goldMean = pairs.reduce((sum, pair) => sum + pair.goldReturn, 0) / pairs.length;

        // Calculate covariance and variances
        let covariance = 0;
        let niftyVariance = 0;
        let goldVariance = 0;

        for (const pair of pairs) {
          const niftyDiff = pair.niftyReturn - niftyMean;
          const goldDiff = pair.goldReturn - goldMean;
          covariance += niftyDiff * goldDiff;
          niftyVariance += niftyDiff * niftyDiff;
          goldVariance += goldDiff * goldDiff;
        }

        // Calculate correlation coefficient
        if (niftyVariance > 0 && goldVariance > 0) {
          correlation = covariance / (Math.sqrt(niftyVariance) * Math.sqrt(goldVariance));
        }
      }

      results.push({
        lag,
        correlation: parseFloat(correlation.toFixed(4)),
        absCorrelation: parseFloat(Math.abs(correlation).toFixed(4)),
        description: lag === 0 
          ? "No lag (same-day correlation)" 
          : lag > 0 
            ? `Gold leads Nifty by ${lag} day${lag > 1 ? "s" : ""}`
            : `Nifty leads Gold by ${Math.abs(lag)} day${Math.abs(lag) > 1 ? "s" : ""}`,
      });
    }

    setLagCorrelations(results);
  };

  const updateScatterPlot = () => {
    if (lagDays < -10 || lagDays > 10) return;

    const data = [];
    const lag = lagDays;

    for (let i = Math.max(0, lag); i < Math.min(niftyData.length, goldData.length + lag); i++) {
      const niftyIndex = i;
      const goldIndex = i - lag;

      if (
        goldIndex >= 0 &&
        goldIndex < goldData.length &&
        niftyData[niftyIndex].returns !== undefined &&
        goldData[goldIndex].returns !== undefined
      ) {
        data.push({
          niftyReturn: parseFloat(niftyData[niftyIndex].returns.toFixed(2)),
          goldReturn: parseFloat(goldData[goldIndex].returns.toFixed(2)),
          date: niftyData[niftyIndex].date,
        });
      }
    }

    setScatterData(data);
  };

  const updateLaggedTimeSeries = () => {
    if (lagDays < -10 || lagDays > 10) return;

    const data = [];
    const lag = lagDays;

    for (let i = Math.max(0, lag); i < Math.min(niftyData.length, goldData.length + lag); i++) {
      const niftyIndex = i;
      const goldIndex = i - lag;

      if (
        goldIndex >= 0 &&
        goldIndex < goldData.length
      ) {
        data.push({
          date: niftyData[niftyIndex].date,
          formattedDate: format(new Date(niftyData[niftyIndex].date), "MMM dd"),
          niftyReturn: niftyData[niftyIndex].returns,
          goldReturn: goldData[goldIndex].returns,
        });
      }
    }

    setLaggedTimeSeries(data.slice(-90)); // Last 90 days
  };

  const incrementLag = () => {
    if (lagDays < 10) {
      setLagDays(lagDays + 1);
    }
  };

  const decrementLag = () => {
    if (lagDays > -10) {
      setLagDays(lagDays - 1);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6">Lag Correlation Analysis</h1>
          <div className="h-96 bg-slate-100 animate-pulse rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6">Lag Correlation Analysis</h1>
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Lag Correlation Analysis</h1>
          <p className="text-slate-500 mt-1">
            Explore lead-lag relationships between Nifty and Gold
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <CorrelationChart niftyData={niftyData} goldData={goldData} />
          
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Correlation Across Lags</CardTitle>
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Info className="h-4 w-4" />
                    </Button>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-80">
                    <div className="space-y-2">
                      <p className="text-sm">
                        This chart shows how the correlation between Nifty and Gold changes at different lag periods.
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Negative lags:</span> Nifty leads Gold
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Positive lags:</span> Gold leads Nifty
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Stronger bars:</span> Indicate potentially predictive relationships
                      </p>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              </div>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={lagCorrelations}
                  margin={{ top: 10, right: 30, left: 0, bottom: 30 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis 
                    dataKey="lag" 
                    label={{ value: 'Lag (days)', position: 'insideBottom', offset: -10 }}
                  />
                  <YAxis 
                    domain={[-1, 1]} 
                    ticks={[-1, -0.5, 0, 0.5, 1]} 
                    label={{ value: 'Correlation', angle: -90, position: 'insideLeft', offset: 10 }}
                  />
                  <Tooltip
                    formatter={(value) => [value.toFixed(4), "Correlation"]}
                    labelFormatter={(value) => {
                      const item = lagCorrelations.find(item => item.lag === value);
                      return item ? item.description : `Lag: ${value}`;
                    }}
                  />
                  <ReferenceLine y={0} stroke="#666" />
                  <Bar 
                    dataKey="correlation" 
                    fill={(data) => data.lag === lagDays ? "#4f46e5" : "#93c5fd"}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="scatter" className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="scatter">Scatter Plot</TabsTrigger>
              <TabsTrigger value="timeseries">Time Series</TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={decrementLag}
                disabled={lagDays <= -10}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Decrease Lag
              </Button>
              <div className="text-sm font-medium px-3 py-1 bg-slate-100 rounded-md min-w-20 text-center">
                Lag: {lagDays}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={incrementLag}
                disabled={lagDays >= 10}
              >
                Increase Lag
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>
                {lagDays === 0 
                  ? "Same-Day Correlation" 
                  : lagDays > 0 
                    ? `Gold leads Nifty by ${lagDays} day${lagDays > 1 ? "s" : ""}`
                    : `Nifty leads Gold by ${Math.abs(lagDays)} day${Math.abs(lagDays) > 1 ? "s" : ""}`}
              </CardTitle>
              <CardDescription>
                {lagDays === 0 
                  ? "Showing the relationship between same-day returns"
                  : lagDays > 0 
                    ? `Each point compares Gold's return with Nifty's return ${lagDays} day${lagDays > 1 ? "s" : ""} later`
                    : `Each point compares Nifty's return with Gold's return ${Math.abs(lagDays)} day${Math.abs(lagDays) > 1 ? "s" : ""} later`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TabsContent value="scatter" className="mt-0">
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart
                      margin={{ top: 10, right: 30, left: 0, bottom: 30 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis 
                        type="number" 
                        dataKey="niftyReturn" 
                        name="Nifty Return" 
                        unit="%" 
                        domain={[-3, 3]}
                        label={{ value: 'Nifty Return (%)', position: 'insideBottom', offset: -10 }}
                      />
                      <YAxis 
                        type="number" 
                        dataKey="goldReturn" 
                        name="Gold Return" 
                        unit="%" 
                        domain={[-3, 3]}
                        label={{ value: 'Gold Return (%)', angle: -90, position: 'insideLeft', offset: 10 }}
                      />
                      <ZAxis range={[60]} />
                      <Tooltip 
                        cursor={{ strokeDasharray: '3 3' }}
                        formatter={(value) => [`${value}%`, value === scatterData[0]?.niftyReturn ? "Nifty Return" : "Gold Return"]}
                        labelFormatter={(index) => format(new Date(scatterData[index]?.date || new Date()), "MMMM d, yyyy")}
                      />
                      <ReferenceLine x={0} stroke="#666" />
                      <ReferenceLine y={0} stroke="#666" />
                      <Scatter 
                        name="Returns" 
                        data={scatterData} 
                        fill="#4f46e5" 
                        opacity={0.6}
                      />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 text-sm text-slate-600">
                  <div className="flex gap-6">
                    <div>
                      <div className="font-medium">Data points: {scatterData.length}</div>
                      <div>
                        Correlation: {lagCorrelations.find(lc => lc.lag === lagDays)?.correlation.toFixed(4) || "N/A"}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div>
                        {lagDays === 0 
                          ? "Each point represents daily returns for Nifty (x-axis) and Gold (y-axis) on the same day."
                          : lagDays > 0 
                            ? `Each point shows how Gold's returns today correlate with Nifty's returns ${lagDays} day${lagDays > 1 ? "s" : ""} in the future.`
                            : `Each point shows how Nifty's returns today correlate with Gold's returns ${Math.abs(lagDays)} day${Math.abs(lagDays) > 1 ? "s" : ""} in the future.`}
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="timeseries" className="mt-0">
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={laggedTimeSeries}
                      margin={{ top: 10, right: 30, left: 0, bottom: 30 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis 
                        dataKey="formattedDate"
                        tick={{ fontSize: 10 }}
                        interval={Math.ceil(laggedTimeSeries.length / 15)}
                        label={{ value: 'Date', position: 'insideBottom', offset: -10 }}
                      />
                      <YAxis 
                        domain={[-3, 3]}
                        label={{ value: 'Return (%)', angle: -90, position: 'insideLeft', offset: 10 }}
                      />
                      <Tooltip
                        formatter={(value) => [`${value.toFixed(2)}%`, value === laggedTimeSeries[0]?.niftyReturn ? "Nifty Return" : "Gold Return"]}
                        labelFormatter={(label) => format(new Date(laggedTimeSeries.find(d => d.formattedDate === label)?.date || new Date()), "MMMM d, yyyy")}
                      />
                      <Legend />
                      <ReferenceLine y={0} stroke="#666" />
                      <Line
                        type="monotone"
                        dataKey="niftyReturn"
                        stroke="#2563eb"
                        name="Nifty"
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="goldReturn"
                        stroke="#d97706"
                        name="Gold"
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 text-sm text-slate-600">
                  <p>
                    {lagDays === 0 
                      ? "Comparing same-day returns between Nifty and Gold."
                      : lagDays > 0 
                        ? `Comparing Gold's returns with Nifty's returns ${lagDays} day${lagDays > 1 ? "s" : ""} later.`
                        : `Comparing Nifty's returns with Gold's returns ${Math.abs(lagDays)} day${Math.abs(lagDays) > 1 ? "s" : ""} later.`}
                  </p>
                </div>
              </TabsContent>
            </CardContent>
          </Card>
        </Tabs>
      </div>
    </div>
  );
}