
import React, { useState, useEffect } from "react";
import { MarketData } from "@/api/entities";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Search, RefreshCw, Calendar, AlertTriangle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function DataViewer() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeAsset, setActiveAsset] = useState("nifty");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [processingStatus, setProcessingStatus] = useState(null);
  const recordsPerPage = 50;

  useEffect(() => {
    loadData();
    
    // Listen for data refresh events
    window.addEventListener('marketDataRefresh', handleDataRefresh);
    
    return () => {
      window.removeEventListener('marketDataRefresh', handleDataRefresh);
    };
  }, [activeAsset, page]);

  const handleDataRefresh = () => {
    console.log("DataViewer: Refreshing data from global event");
    loadData();
  };

  const handleProcessingUpdate = (event) => {
    console.log("Processing update received:", event.detail);
    setProcessingStatus(event.detail);
    localStorage.setItem('dataProcessingStatus', JSON.stringify(event.detail));
  };

  const cancelProcessing = () => {
    // Dispatch cancel event
    const cancelEvent = new CustomEvent('cancelDataProcessing', {
      detail: { timestamp: Date.now() }
    });
    window.dispatchEvent(cancelEvent);
    
    // Clear status
    setProcessingStatus(null);
    localStorage.removeItem('dataProcessingStatus');
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log(`DataViewer: Loading ${activeAsset} data (page ${page})`);

      // Using a robust fetch approach
      let result;
      
      try {
        result = await MarketData.filter(
          { asset_type: activeAsset },
          "-date",
          recordsPerPage,
          {
            offset: (page - 1) * recordsPerPage,
            timestamp: Date.now(), // Cache busting
            forceReload: true
          }
        );
      } catch (err) {
        console.error("Initial fetch failed:", err);
        // Add delay and retry once
        await new Promise(resolve => setTimeout(resolve, 2000));
        result = await MarketData.filter(
          { asset_type: activeAsset },
          "-date",
          recordsPerPage,
          {
            offset: (page - 1) * recordsPerPage,
            timestamp: Date.now() + 1000, // Different timestamp for second attempt
            forceReload: true
          }
        );
      }
      
      // Verify data
      if (!Array.isArray(result)) {
        throw new Error("Invalid response format");
      }

      console.log(`DataViewer: Received ${result.length} records`);
      setData(result);
      
      // Get total count
      const allRecords = await MarketData.filter(
        { asset_type: activeAsset },
        "-date",
        99999,
        { timestamp: Date.now(), forceReload: true }
      );
      
      console.log(`DataViewer: Total records count: ${allRecords?.length || 0}`);
      setTotalRecords(allRecords?.length || 0);
    } catch (err) {
      console.error("Error loading data:", err);
      setError("Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = () => {
    try {
      const headers = ["Date", "Open", "High", "Low", "Close", "Volume", "Returns"];
      const csvData = data.map(row => [
        row.date,
        row.open,
        row.high,
        row.low,
        row.close,
        row.volume,
        row.returns?.toFixed(2)
      ]);

      const csvContent = [
        headers.join(","),
        ...csvData.map(row => row.join(","))
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${activeAsset}_data_${format(new Date(), "yyyyMMdd")}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading CSV:", err);
      setError("Failed to download CSV. Please try again.");
    }
  };

  const filteredData = data.filter(item =>
    searchTerm === "" ||
    item.date?.includes(searchTerm) ||
    item.close?.toString().includes(searchTerm) ||
    item.volume?.toString().includes(searchTerm)
  );

  const totalPages = Math.max(1, Math.ceil(totalRecords / recordsPerPage));

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Market Data Viewer</h1>
          <p className="text-slate-500 mt-1">
            View and download raw market data
          </p>
        </div>
        
        {processingStatus && (
          <Card className="mb-6 bg-blue-50 border-blue-200">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-blue-800">
                  Processing Data {processingStatus.assetType && `(${processingStatus.assetType})`}
                </CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={cancelProcessing}
                  className="text-blue-800 hover:text-blue-900 hover:bg-blue-100"
                >
                  Cancel Process
                </Button>
              </div>
              <CardDescription className="text-blue-700">
                {processingStatus.status === 'uploading' ? 'Uploading file...' : 
                 processingStatus.status === 'processing' ? 'Processing data...' : 
                 'Background process running...'}
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-blue-700">
                  <span>{processingStatus.processedRows || 0} of {processingStatus.totalRows || '?'} rows processed</span>
                  <span>{processingStatus.progress || 0}%</span>
                </div>
                <Progress 
                  value={processingStatus.progress || 0} 
                  className="h-2 bg-blue-200" 
                  indicatorClassName="bg-blue-600" 
                />
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="mb-6">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle>Raw Data Explorer</CardTitle>
                <CardDescription>
                  {totalRecords ? `${totalRecords} records available for ${activeAsset.toUpperCase()}` : 
                   loading ? "Loading data..." : "No records found"}
                </CardDescription>
              </div>

              <div className="flex items-center gap-4">
                <Tabs defaultValue={activeAsset} onValueChange={setActiveAsset}>
                  <TabsList>
                    <TabsTrigger value="nifty">Nifty</TabsTrigger>
                    <TabsTrigger value="gold">Gold</TabsTrigger>
                  </TabsList>
                </Tabs>

                <Button variant="outline" onClick={downloadCSV} disabled={loading || data.length === 0}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>

                <Button 
                  variant="outline" 
                  onClick={loadData} 
                  disabled={loading}
                  className="relative"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  {loading ? "Loading..." : "Refresh"}
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by date or value..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Date</TableHead>
                    <TableHead className="text-right">Open</TableHead>
                    <TableHead className="text-right">High</TableHead>
                    <TableHead className="text-right">Low</TableHead>
                    <TableHead className="text-right">Close</TableHead>
                    <TableHead className="text-right">Volume</TableHead>
                    <TableHead className="text-right">Returns (%)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    [1, 2, 3, 4, 5].map(i => (
                      <TableRow key={i} className="animate-pulse">
                        <TableCell colSpan={7} className="h-12">
                          <div className="h-4 bg-slate-200 rounded w-full"></div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : filteredData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                        {error ? error : totalRecords > 0 ? "No matching data found" : "No data available"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredData.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {row.date ? format(new Date(row.date), "yyyy-MM-dd") : "N/A"}
                        </TableCell>
                        <TableCell className="text-right">{row.open?.toFixed(2) || "—"}</TableCell>
                        <TableCell className="text-right">{row.high?.toFixed(2) || "—"}</TableCell>
                        <TableCell className="text-right">{row.low?.toFixed(2) || "—"}</TableCell>
                        <TableCell className="text-right">{row.close?.toFixed(2) || "—"}</TableCell>
                        <TableCell className="text-right">{row.volume?.toLocaleString() || "—"}</TableCell>
                        <TableCell className="text-right">{row.returns?.toFixed(2) || "—"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-slate-500">
                {totalRecords > 0 ? (
                  `Showing page ${page} of ${totalPages} (${totalRecords} total records)`
                ) : (
                  "No records available"
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1 || loading}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages || loading || totalRecords === 0}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
