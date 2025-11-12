import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import DataUploader from "@/components/upload/DataUploader";
import SampleDataGenerator from "@/components/upload/SampleDataGenerator";
import { useNavigate } from "react-router-dom";

export default function UploadData() {
  const navigate = useNavigate();

  const handleUploadComplete = () => {
    // Trigger refresh event for other components
    const refreshEvent = new CustomEvent('marketDataRefresh', {
      detail: {
        source: 'dataUploader',
        timestamp: Date.now()
      }
    });
    window.dispatchEvent(refreshEvent);
    
    // Optionally navigate to dashboard
    // navigate('/Dashboard');
  };

  const handleDataGenerated = () => {
    // Trigger refresh event
    const refreshEvent = new CustomEvent('marketDataRefresh', {
      detail: {
        source: 'sampleDataGenerator',
        timestamp: Date.now()
      }
    });
    window.dispatchEvent(refreshEvent);
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Upload Market Data</h1>
          <p className="text-slate-500 mt-1">Import your own data or generate sample data to get started</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <DataUploader onUploadComplete={handleUploadComplete} />
          <SampleDataGenerator onDataGenerated={handleDataGenerated} />
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Data Format Requirements</CardTitle>
            <CardDescription>CSV files should contain the following columns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p><strong>Required columns:</strong></p>
              <ul className="list-disc pl-5 space-y-1">
                <li><code>time</code> or <code>date</code> - Date in YYYY-MM-DD format</li>
                <li><code>open</code> - Opening price</li>
                <li><code>high</code> - High price</li>
                <li><code>low</code> - Low price</li>
                <li><code>close</code> - Closing price</li>
              </ul>
              <p className="mt-4"><strong>Optional columns:</strong></p>
              <ul className="list-disc pl-5 space-y-1">
                <li><code>Volume</code> or <code>volume</code> - Trading volume</li>
              </ul>
              <p className="mt-4 text-slate-600">
                The application will automatically calculate returns and process the data for analysis.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
