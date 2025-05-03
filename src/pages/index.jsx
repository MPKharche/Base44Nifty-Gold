import Layout from "./Layout.jsx";

import Dashboard from "./Dashboard";

import LagCorrelation from "./LagCorrelation";

import VolatilityAnalysis from "./VolatilityAnalysis";

import StatisticalAnalysis from "./StatisticalAnalysis";

import RatioZScore from "./RatioZScore";

import AdvancedInsights from "./AdvancedInsights";

import UploadData from "./UploadData";

import PortfolioStrategy from "./PortfolioStrategy";

import DynamicPortfolioStrategy from "./DynamicPortfolioStrategy";

import DataViewer from "./DataViewer";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Dashboard: Dashboard,
    
    LagCorrelation: LagCorrelation,
    
    VolatilityAnalysis: VolatilityAnalysis,
    
    StatisticalAnalysis: StatisticalAnalysis,
    
    RatioZScore: RatioZScore,
    
    AdvancedInsights: AdvancedInsights,
    
    UploadData: UploadData,
    
    PortfolioStrategy: PortfolioStrategy,
    
    DynamicPortfolioStrategy: DynamicPortfolioStrategy,
    
    DataViewer: DataViewer,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Dashboard />} />
                
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/LagCorrelation" element={<LagCorrelation />} />
                
                <Route path="/VolatilityAnalysis" element={<VolatilityAnalysis />} />
                
                <Route path="/StatisticalAnalysis" element={<StatisticalAnalysis />} />
                
                <Route path="/RatioZScore" element={<RatioZScore />} />
                
                <Route path="/AdvancedInsights" element={<AdvancedInsights />} />
                
                <Route path="/UploadData" element={<UploadData />} />
                
                <Route path="/PortfolioStrategy" element={<PortfolioStrategy />} />
                
                <Route path="/DynamicPortfolioStrategy" element={<DynamicPortfolioStrategy />} />
                
                <Route path="/DataViewer" element={<DataViewer />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}