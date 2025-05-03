
import React, { useState, useEffect } from "react";
import { MarketData } from "@/api/entities";
import { Signal } from "@/api/entities";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RefreshCw, AlertCircle, Upload, Database } from "lucide-react";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";

// Utility function to delay and retry API requests
const fetchWithRetry = async (fetchFn, maxRetries = 3, initialDelay = 1000) => {
  let retries = 0;
  let lastError;
  
  while (retries < maxRetries) {
    try {
      return await fetchFn();
    } catch (error) {
      lastError = error;
      
      // Check if it's a rate-limit error (status 429)
      const isRateLimit = error.message?.includes('429') || 
                          error.toString().includes('429') ||
                          error.toString().includes('Rate limit');
      
      // Longer delay for rate limit errors
      const delay = isRateLimit ? 
        initialDelay * Math.pow(3, retries) : // Exponential backoff for rate limits
        initialDelay * Math.pow(2, retries);  // Regular exponential backoff
      
      console.log(`Retry ${retries + 1}/${maxRetries} after ${delay}ms delay`);
      await new Promise(resolve => setTimeout(resolve, delay));
      retries++;
    }
  }
  
  throw lastError;
};

export default function Dashboard() {
  const [niftyData, setNiftyData] = useState([]);
  const [goldData, setGoldData] = useState([]);
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [retryInProgress, setRetryInProgress] = useState(false);
  const [autoRetryDisabled, setAutoRetryDisabled] = useState(false);

  useEffect(() => {
    loadData(false); // Don't auto-retry on initial load
    
    // Add event listener with stronger handling
    window.addEventListener('marketDataRefresh', handleDataRefresh);
    
    // Cleanup listener on unmount
    return () => {
      window.removeEventListener('marketDataRefresh', handleDataRefresh);
    };
  }, []);

  const handleDataRefresh = (event) => {
    console.log("Dashboard: Received refresh event", event.detail);
    setRetryCount(0); // Reset retry count on manual refresh
    setAutoRetryDisabled(false); // Re-enable auto-retry for manual refresh
    
    // Force cache busting with the timestamp
    const timestamp = event.detail?.timestamp || Date.now();
    loadData(true, timestamp);
  };

  const loadData = async (enableAutoRetry = false, timestamp = Date.now()) => {
    try {
      setLoading(true);
      setError(null);
      setRetryInProgress(false);

      console.log("Dashboard: Loading data from API with timestamp:", timestamp);
      
      // Add cache busting parameter and force reload
      const fetchOptions = { 
        timestamp: timestamp,
        forceReload: true,
        cacheKey: `dashboard_${timestamp}`
      };
      
      // Load Nifty data with retry
      const niftyPromise = () => MarketData.filter(
        { asset_type: "nifty" },
        "-date",
        6500,
        fetchOptions
      );
      
      const niftyResult = await fetchWithRetry(niftyPromise, 3, 1500);
      
      // Add small delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Load Gold data with retry
      const goldPromise = () => MarketData.filter(
        { asset_type: "gold" },
        "-date",
        6500,
        fetchOptions
      );
      
      const goldResult = await fetchWithRetry(goldPromise, 3, 1500);
      
      // Add small delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Load signals with retry
      const signalsPromise = () => Signal.list(
        "-date", 
        10, 
        fetchOptions
      );
      
      const signalsResult = await fetchWithRetry(signalsPromise, 3, 1000);

      // Validate the data
      if (!niftyResult?.length) {
        throw new Error("No Nifty data available. Please upload data first.");
      }
      
      if (!goldResult?.length) {
        throw new Error("No Gold data available. Please upload data first.");
      }

      // Sort data chronologically
      const sortedNifty = [...niftyResult].sort((a, b) => new Date(a.date) - new Date(b.date));
      const sortedGold = [...goldResult].sort((a, b) => new Date(a.date) - new Date(b.date));

      // Log successful data load
      console.log(`Dashboard: Successfully loaded ${sortedNifty.length} Nifty records and ${sortedGold.length} Gold records`);

      setNiftyData(sortedNifty);
      setGoldData(sortedGold);
      setSignals(signalsResult || []);
      setError(null);
    } catch (err) {
      console.error("Error loading data:", err);
      setError(err.message || "Failed to load market data");
      
      // Auto-retry with increasing backoff delay if explicitly enabled
      // and if we haven't retried too many times already
      if (enableAutoRetry && retryCount < 2 && !retryInProgress && !autoRetryDisabled) {
        setRetryInProgress(true);
        const retryDelay = Math.pow(2, retryCount) * 2000; // 2s, 4s, 8s, etc.
        console.log(`Will retry automatically in ${retryDelay/1000} seconds...`);
        
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          loadData(true, Date.now());
        }, retryDelay);
      }
    } finally {
      setLoading(false);
    }
  };

  const disableAutoRetry = () => {
    setAutoRetryDisabled(true);
    setRetryInProgress(false);
  };

  if (error) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Market Dashboard</h1>
            <p className="text-slate-500 mt-1">Comprehensive analysis of Nifty and Gold markets</p>
          </div>
          
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>

          <div className="grid gap-6 md:grid-cols-2 mb-8">
            <Card className="p-6 flex flex-col items-center text-center">
              <Upload className="h-10 w-10 text-blue-600 mb-4" />
              <h2 className="text-xl font-bold mb-2">Upload Your Data</h2>
              <p className="text-slate-600 mb-4">
                Upload your own CSV files with OHLC data for Nifty and Gold
              </p>
              <Link to={createPageUrl("UploadData")} className="w-full">
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  Upload Market Data
                </Button>
              </Link>
            </Card>
            
            <Card className="p-6 flex flex-col items-center text-center">
              <Database className="h-10 w-10 text-green-600 mb-4" />
              <h2 className="text-xl font-bold mb-2">Generate Sample Data</h2>
              <p className="text-slate-600 mb-4">
                Generate realistic sample data to explore the application
              </p>
              <Link to={createPageUrl("UploadData")} className="w-full">
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  Generate Sample Data
                </Button>
              </Link>
            </Card>
          </div>

          <div className="flex flex-col items-center gap-4">
            <div className="flex gap-4">
              <Button 
                onClick={handleDataRefresh}
                className="bg-blue-600 hover:bg-blue-700"
                disabled={loading || retryInProgress}
              >
                {loading || retryInProgress ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    {retryInProgress ? "Retrying automatically..." : "Loading..."}
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh Data
                  </>
                )}
              </Button>
              
              {retryInProgress && (
                <Button 
                  onClick={disableAutoRetry} 
                  variant="outline"
                >
                  Stop Auto-retry
                </Button>
              )}
            </div>

            {retryInProgress && (
              <p className="text-center text-sm text-slate-500">
                Automatic retry in progress ({retryCount + 1}/3)
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Market Dashboard</h1>
          <p className="text-slate-500 mt-1">Comprehensive analysis of Nifty and Gold markets</p>
        </div>

        {/* Data Display Section */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Nifty Data</h2>
            {loading ? (
              <p>Loading Nifty data...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="text-left">
                      <th className="pb-2">Date</th>
                      <th className="pb-2">Open</th>
                      <th className="pb-2">High</th>
                      <th className="pb-2">Low</th>
                      <th className="pb-2">Close</th>
                    </tr>
                  </thead>
                  <tbody>
                    {niftyData.slice(0, 5).map((item) => (
                      <tr key={item.id}>
                        <td className="py-2">{new Date(item.date).toLocaleDateString()}</td>
                        <td className="py-2">{item.open}</td>
                        <td className="py-2">{item.high}</td>
                        <td className="py-2">{item.low}</td>
                        <td className="py-2">{item.close}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {niftyData.length > 0 && (
              <Link to={createPageUrl("MarketData")} className="w-full">
                <Button className="w-full mt-4 bg-blue-600 hover:bg-blue-700">
                  View All Nifty Data
                </Button>
              </Link>
            )}
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Gold Data</h2>
            {loading ? (
              <p>Loading Gold data...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="text-left">
                      <th className="pb-2">Date</th>
                      <th className="pb-2">Open</th>
                      <th className="pb-2">High</th>
                      <th className="pb-2">Low</th>
                      <th className="pb-2">Close</th>
                    </tr>
                  </thead>
                  <tbody>
                    {goldData.slice(0, 5).map((item) => (
                      <tr key={item.id}>
                        <td className="py-2">{new Date(item.date).toLocaleDateString()}</td>
                        <td className="py-2">{item.open}</td>
                        <td className="py-2">{item.high}</td>
                        <td className="py-2">{item.low}</td>
                        <td className="py-2">{item.close}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {goldData.length > 0 && (
              <Link to={createPageUrl("MarketData")} className="w-full">
                <Button className="w-full mt-4 bg-blue-600 hover:bg-blue-700">
                  View All Gold Data
                </Button>
              </Link>
            )}
          </Card>
        </div>

        {/* Signals Display Section */}
        <Card className="p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Recent Signals</h2>
          {loading ? (
            <p>Loading signals...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="text-left">
                    <th className="pb-2">Date</th>
                    <th className="pb-2">Asset Type</th>
                    <th className="pb-2">Signal Type</th>
                    <th className="pb-2">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {signals.map((signal) => (
                    <tr key={signal.id}>
                      <td className="py-2">{new Date(signal.date).toLocaleDateString()}</td>
                      <td className="py-2">{signal.asset_type}</td>
                      <td className="py-2">{signal.signal_type}</td>
                      <td className="py-2">{signal.price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {signals.length > 0 && (
            <Link to={createPageUrl("Signals")} className="w-full">
              <Button className="w-full mt-4 bg-blue-600 hover:bg-blue-700">
                View All Signals
              </Button>
            </Link>
          )}
        </Card>

        {/* Refresh and Upload Data Buttons */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex gap-4">
            <Button 
              onClick={handleDataRefresh}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={loading || retryInProgress}
            >
              {loading || retryInProgress ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  {retryInProgress ? "Retrying automatically..." : "Loading..."}
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh Data
                </>
              )}
            </Button>
            
            {retryInProgress && (
              <Button 
                onClick={disableAutoRetry} 
                variant="outline"
              >
                Stop Auto-retry
              </Button>
            )}
          </div>

          {retryInProgress && (
            <p className="text-center text-sm text-slate-500">
              Automatic retry in progress ({retryCount + 1}/3)
            </p>
          )}

          <Link to={createPageUrl("UploadData")}>
            <Button className="bg-green-600 hover:bg-green-700">Upload New Data</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
