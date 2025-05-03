

import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  LayoutDashboard,
  LineChart,
  BarChart3,
  Activity,
  ChartPieIcon,
  ArrowUpDown,
  LightbulbIcon,
  Upload,
  Menu,
  X,
  User,
  LogOut,
  TrendingUp,
  BadgeDollarSign,
  RefreshCw,
  Table,
  Database
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { User as UserEntity } from "@/api/entities";
import { cn } from "@/lib/utils";
import Logo from "../components/Logo";

export default function Layout({ children, currentPageName }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const location = useLocation();
  
  const logout = async () => {
    await UserEntity.logout();
  };

  // Handle global data refresh with improved status feedback
  const triggerDataRefresh = () => {
    setIsRefreshing(true);
    
    console.log("Manual data refresh triggered from layout");
    
    // Clear any cached data in localStorage
    try {
      localStorage.removeItem('niftyCache');
      localStorage.removeItem('goldCache');
    } catch (e) {
      console.warn("Failed to clear cache:", e);
    }
    
    // Create refreshEvent with stronger parameters
    const refreshEvent = new CustomEvent('marketDataRefresh', { 
      detail: { 
        source: 'layoutRefresh',
        manual: true,
        forceReload: true,
        timestamp: Date.now() 
      } 
    });
    window.dispatchEvent(refreshEvent);
    
    // Reset refreshing state after delay to show visual feedback
    setTimeout(() => {
      setIsRefreshing(false);
    }, 2000);
  };

  const navItems = [
    {
      name: "Dashboard",
      icon: <LayoutDashboard className="w-5 h-5" />,
      path: createPageUrl("Dashboard")
    },
    {
      name: "Portfolio Strategy",
      icon: <TrendingUp className="w-5 h-5" />,
      path: createPageUrl("PortfolioStrategy")
    },
    {
      name: "Dynamic Portfolio",
      icon: <BadgeDollarSign className="w-5 h-5" />,
      path: createPageUrl("DynamicPortfolioStrategy")
    },
    {
      name: "Lag Correlation",
      icon: <LineChart className="w-5 h-5" />,
      path: createPageUrl("LagCorrelation")
    },
    {
      name: "Volatility Analysis",
      icon: <Activity className="w-5 h-5" />,
      path: createPageUrl("VolatilityAnalysis")
    },
    {
      name: "Statistical Analysis",
      icon: <ChartPieIcon className="w-5 h-5" />,
      path: createPageUrl("StatisticalAnalysis")
    },
    {
      name: "Ratio & Z-Score",
      icon: <ArrowUpDown className="w-5 h-5" />,
      path: createPageUrl("RatioZScore")
    },
    {
      name: "Advanced Insights",
      icon: <LightbulbIcon className="w-5 h-5" />,
      path: createPageUrl("AdvancedInsights")
    },
    {
      name: "Upload Data",
      icon: <Upload className="w-5 h-5" />,
      path: createPageUrl("UploadData")
    },
    {
      name: "Raw Data",
      icon: <Table className="w-5 h-5" />,
      path: createPageUrl("DataViewer")
    }
  ];

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Mobile sidebar backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-64 bg-white shadow-xl transition-transform duration-300 ease-in-out md:relative md:translate-x-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <Link to={createPageUrl("Dashboard")}>
            <Logo />
          </Link>
          {/* Add refresh button */}
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              title="Refresh All Data"
              onClick={triggerDataRefresh}
              disabled={isRefreshing}
              className="text-slate-600 hover:text-blue-600"
            >
              <RefreshCw className={cn("h-5 w-5", isRefreshing && "animate-spin")} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <nav className="p-4">
          <div className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  location.pathname === item.path
                    ? "bg-gradient-to-r from-blue-50 to-amber-50 text-blue-700 font-medium"
                    : "text-slate-600 hover:bg-slate-100"
                )}
              >
                {item.icon}
                {item.name}
              </Link>
            ))}
          </div>
          
          <div className="mt-8 pt-4 border-t border-slate-200">
            <div className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-600">
              <User className="w-5 h-5" />
              <span>Account</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-3 rounded-lg w-full justify-start px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
              onClick={logout}
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </Button>
          </div>
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="bg-white border-b border-slate-200 px-4 py-2 md:hidden">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <Link to={createPageUrl("Dashboard")}>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold bg-gradient-to-r from-blue-700 to-amber-600 bg-clip-text text-transparent">
                  QuantEdge Alpha
                </span>
              </div>
            </Link>
            <div className="w-9"></div> {/* Spacer for alignment */}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

