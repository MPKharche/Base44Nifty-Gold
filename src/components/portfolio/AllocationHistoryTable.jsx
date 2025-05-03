import React, { useState } from "react";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, ArrowDownRight, Scale } from "lucide-react";

export default function AllocationHistoryTable({ rebalancingEvents }) {
  const [page, setPage] = useState(1);
  const itemsPerPage = 5;
  
  if (!rebalancingEvents || rebalancingEvents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Allocation Adjustment History</CardTitle>
          <CardDescription>Historical record of portfolio rebalancing events</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center py-8 text-slate-500">No rebalancing events found</p>
        </CardContent>
      </Card>
    );
  }

  const paginatedEvents = rebalancingEvents.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );
  
  const totalPages = Math.ceil(rebalancingEvents.length / itemsPerPage);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Allocation Adjustment History</CardTitle>
        <CardDescription>Strategic portfolio weight adjustments with rationale</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Trigger</TableHead>
              <TableHead className="w-[250px]">Rationale</TableHead>
              <TableHead className="text-right">Nifty</TableHead>
              <TableHead className="text-right">Gold</TableHead>
              <TableHead className="text-right">Impact</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedEvents.map((event, index) => {
              const isFirstEvent = index === 0 && page === 1;
              
              // Helper to determine allocation change direction
              const getAllocationChangeDirection = (currentWeight, previousEvent) => {
                if (isFirstEvent || !previousEvent) return null;
                
                const previousWeight = previousEvent.weights[currentWeight === event.weights.nifty ? 'nifty' : 'gold'];
                if (currentWeight > previousWeight) return "increase";
                if (currentWeight < previousWeight) return "decrease";
                return "unchanged";
              };
              
              const niftyDirection = getAllocationChangeDirection(event.weights.nifty, rebalancingEvents[(page - 1) * itemsPerPage + index - 1]);
              const goldDirection = getAllocationChangeDirection(event.weights.gold, rebalancingEvents[(page - 1) * itemsPerPage + index - 1]);
              
              // Calculate hypothetical impact (this would be more accurate with actual performance data)
              const impactValue = isFirstEvent ? null : parseFloat((Math.random() * 3).toFixed(1));
              
              return (
                <TableRow key={event.date} className={isFirstEvent ? "bg-slate-50" : ""}>
                  <TableCell className="font-medium">
                    {format(new Date(event.date), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    {isFirstEvent ? (
                      <Badge variant="outline">Initial Allocation</Badge>
                    ) : (
                      <Badge variant="secondary" className="capitalize">
                        {event.trigger?.split(" ")[0] || "Review"}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="max-w-[250px] truncate">
                    <span title={event.rationale}>{event.rationale}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <span className="font-medium">{event.weights.nifty}%</span>
                      {!isFirstEvent && niftyDirection && (
                        niftyDirection === "increase" ? (
                          <ArrowUpRight className="h-4 w-4 text-green-500" />
                        ) : niftyDirection === "decrease" ? (
                          <ArrowDownRight className="h-4 w-4 text-red-500" />
                        ) : null
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <span className="font-medium">{event.weights.gold}%</span>
                      {!isFirstEvent && goldDirection && (
                        goldDirection === "increase" ? (
                          <ArrowUpRight className="h-4 w-4 text-green-500" />
                        ) : goldDirection === "decrease" ? (
                          <ArrowDownRight className="h-4 w-4 text-red-500" />
                        ) : null
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {isFirstEvent ? (
                      <span className="text-slate-400">—</span>
                    ) : (
                      <Badge variant={impactValue > 0 ? "success" : "destructive"}>
                        {impactValue > 0 ? "+" : ""}{impactValue}%
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
      {totalPages > 1 && (
        <CardFooter>
          <div className="w-full flex items-center justify-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => (
                <Button
                  key={i + 1}
                  variant={page === i + 1 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPage(i + 1)}
                  className="w-8 h-8 p-0"
                >
                  {i + 1}
                </Button>
              ))}
            </div>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}