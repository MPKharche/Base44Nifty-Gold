import React from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { RefreshCw } from "lucide-react";

// Mock data for rebalancing history
const mockHistory = [
  {
    date: "2024-01-15",
    oldWeights: { nifty: 65, gold: 35 },
    newWeights: { nifty: 60, gold: 40 },
    trigger: "Threshold"
  },
  {
    date: "2024-01-01",
    oldWeights: { nifty: 58, gold: 42 },
    newWeights: { nifty: 60, gold: 40 },
    trigger: "Scheduled"
  },
  {
    date: "2023-12-15",
    oldWeights: { nifty: 63, gold: 37 },
    newWeights: { nifty: 60, gold: 40 },
    trigger: "Threshold"
  }
];

export default function RebalanceHistory() {
  return (
    <div className="space-y-4">
      {mockHistory.map((record, index) => (
        <div
          key={index}
          className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
        >
          <div className="flex items-center gap-4">
            <RefreshCw className="w-5 h-5 text-indigo-600" />
            <div>
              <div className="font-medium">
                {format(new Date(record.date), "MMMM d, yyyy")}
              </div>
              <div className="text-sm text-slate-500 mt-1">
                Nifty: {record.oldWeights.nifty}% → {record.newWeights.nifty}% | 
                Gold: {record.oldWeights.gold}% → {record.newWeights.gold}%
              </div>
            </div>
          </div>
          <Badge variant={record.trigger === "Threshold" ? "default" : "secondary"}>
            {record.trigger}
          </Badge>
        </div>
      ))}
    </div>
  );
}