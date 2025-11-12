import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, AlertCircle, Check, FileText, Loader2 } from "lucide-react";
import { MarketData } from "@/api/entities";
import { parseCSVFile } from "@/api/csvParser";
import { Progress } from "@/components/ui/progress";

export default function DataUploader({ onUploadComplete }) {
  const [niftyFile, setNiftyFile] = useState(null);
  const [goldFile, setGoldFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [uploadStats, setUploadStats] = useState({ nifty: null, gold: null });

  const handleFileChange = (type, e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError(`Please upload a CSV file for ${type}`);
      return;
    }

    if (type === 'nifty') {
      setNiftyFile(file);
    } else {
      setGoldFile(file);
    }
    setError("");
  };

  const parseCSV = async (file) => {
    try {
      const result = await parseCSVFile(file);
      return result;
    } catch (err) {
      console.error("CSV parsing error:", err);
      throw new Error(`Failed to parse CSV file: ${err.message}`);
    }
  };

  const processData = (rawData, assetType) => {
    // Find the date column (could be 'time', 'date', 'Date', etc.)
    const dateColumn = rawData[0] ? 
      Object.keys(rawData[0]).find(key => 
        ['time', 'date', 'Date', 'TIME', 'DATE'].includes(key)
      ) : null;
    
    if (!dateColumn) {
      throw new Error('Could not find date column in CSV. Expected column names: time, date, Date');
    }

    return rawData.map((row, index, array) => {
      // Convert all numeric fields
      const numericFields = ['open', 'high', 'low', 'close', 'Close', 'Open', 'High', 'Low', 'Volume', 'volume'];
      const processedRow = {};

      numericFields.forEach(field => {
        if (row[field] !== undefined) {
          const value = typeof row[field] === 'number' ? row[field] : parseFloat(String(row[field]).replace(/[^\d.-]/g, ''));
          // Use lowercase field names
          const lowerField = field.toLowerCase();
          processedRow[lowerField] = isNaN(value) ? null : value;
        }
      });

      // Calculate returns if possible
      if (index > 0 && processedRow.close !== null) {
        const prevRow = array[index - 1];
        const prevClose = typeof prevRow.close === 'number' ? prevRow.close : 
          typeof prevRow.Close === 'number' ? prevRow.Close :
          parseFloat(String(prevRow.close || prevRow.Close || 0).replace(/[^\d.-]/g, ''));
        
        if (!isNaN(prevClose) && prevClose !== 0 && processedRow.close !== null) {
          processedRow.returns = ((processedRow.close - prevClose) / prevClose) * 100;
        }
      }

      // Format date - handle various formats
      let dateValue = row[dateColumn];
      if (typeof dateValue === 'string') {
        // Try to parse date string
        const date = new Date(dateValue);
        if (!isNaN(date.getTime())) {
          dateValue = date.toISOString().split('T')[0];
        }
      } else if (dateValue instanceof Date) {
        dateValue = dateValue.toISOString().split('T')[0];
      }

      return {
        date: dateValue,
        asset_type: assetType,
        open: processedRow.open,
        high: processedRow.high,
        low: processedRow.low,
        close: processedRow.close,
        volume: processedRow.volume || null,
        returns: processedRow.returns || null
      };
    }).filter(row => 
      row.open !== null && 
      row.high !== null && 
      row.low !== null && 
      row.close !== null &&
      row.date
    );
  };

  const uploadData = async () => {
    if (!niftyFile && !goldFile) {
      setError("Please select at least one file to upload");
      return;
    }

    try {
      setUploading(true);
      setError("");
      setProgress(0);

      // Upload and process Nifty data
      let niftyData = [];
      if (niftyFile) {
        setProgress(10);
        const rawNiftyData = await parseCSV(niftyFile);
        niftyData = processData(rawNiftyData, 'nifty');
        setProgress(30);
      }

      // Upload and process Gold data
      let goldData = [];
      if (goldFile) {
        setProgress(40);
        const rawGoldData = await parseCSV(goldFile);
        goldData = processData(rawGoldData, 'gold');
        setProgress(60);
      }

      // Save data in batches
      const batchSize = 50;
      
      if (niftyData.length > 0) {
        for (let i = 0; i < niftyData.length; i += batchSize) {
          const batch = niftyData.slice(i, i + batchSize);
          await MarketData.bulkCreate(batch);
          setProgress(60 + (i / niftyData.length) * 20);
        }
      }

      if (goldData.length > 0) {
        for (let i = 0; i < goldData.length; i += batchSize) {
          const batch = goldData.slice(i, i + batchSize);
          await MarketData.bulkCreate(batch);
          setProgress(80 + (i / goldData.length) * 20);
        }
      }

      // Update stats
      setUploadStats({
        nifty: niftyData.length > 0 ? {
          count: niftyData.length,
          dateRange: {
            start: niftyData[0].date,
            end: niftyData[niftyData.length - 1].date
          }
        } : null,
        gold: goldData.length > 0 ? {
          count: goldData.length,
          dateRange: {
            start: goldData[0].date,
            end: goldData[goldData.length - 1].date
          }
        } : null
      });

      setProgress(100);
      if (onUploadComplete) {
        onUploadComplete();
      }
    } catch (err) {
      console.error("Upload error:", err);
      setError(`Upload error: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Market Data</CardTitle>
        <CardDescription>Import OHLC data for Nifty and Gold</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Nifty Data (CSV)</label>
            <div className="mt-1 flex items-center gap-2">
              <Input
                type="file"
                accept=".csv"
                onChange={(e) => handleFileChange('nifty', e)}
                disabled={uploading}
              />
              {niftyFile && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setNiftyFile(null)}
                >
                  Clear
                </Button>
              )}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Gold Data (CSV)</label>
            <div className="mt-1 flex items-center gap-2">
              <Input
                type="file"
                accept=".csv"
                onChange={(e) => handleFileChange('gold', e)}
                disabled={uploading}
              />
              {goldFile && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setGoldFile(null)}
                >
                  Clear
                </Button>
              )}
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {uploading && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-sm text-slate-600 text-center">
                Processing data... {progress}%
              </p>
            </div>
          )}

          {uploadStats.nifty || uploadStats.gold ? (
            <div className="space-y-4">
              <Alert className="bg-green-50 border-green-200">
                <Check className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-700">
                  Successfully uploaded market data
                </AlertDescription>
              </Alert>

              {uploadStats.nifty && (
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h3 className="font-medium mb-2">Nifty Data</h3>
                  <p className="text-sm text-slate-600">Records: {uploadStats.nifty.count}</p>
                  <p className="text-sm text-slate-600">
                    Date Range: {uploadStats.nifty.dateRange.start} to {uploadStats.nifty.dateRange.end}
                  </p>
                </div>
              )}

              {uploadStats.gold && (
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h3 className="font-medium mb-2">Gold Data</h3>
                  <p className="text-sm text-slate-600">Records: {uploadStats.gold.count}</p>
                  <p className="text-sm text-slate-600">
                    Date Range: {uploadStats.gold.dateRange.start} to {uploadStats.gold.dateRange.end}
                  </p>
                </div>
              )}
            </div>
          ) : null}

          <Button
            onClick={uploadData}
            disabled={uploading || (!niftyFile && !goldFile)}
            className="w-full"
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload Data
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}