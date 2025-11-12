# Nifty-Gold Portfolio Analyzer

A comprehensive financial analysis and portfolio optimization platform for analyzing Nifty (Indian stock index) and Gold markets. This application runs entirely in your browser using local storage - no external API dependencies required.

## Features

### 📊 Market Data Analysis
- Upload and visualize OHLC (Open, High, Low, Close) data for Nifty and Gold
- Interactive market dashboards with real-time data visualization
- Automatic trading signal generation and tracking
- Data viewer with filtering and sorting capabilities

### 💼 Portfolio Strategy & Optimization
- **Static Portfolio Strategy**: Fixed allocation strategies with customizable rebalancing
- **Dynamic Portfolio Strategy**: Adaptive allocation based on market conditions, momentum, volatility, and correlation
- Portfolio simulation with Monte Carlo analysis
- Performance comparison across different strategies
- Historical allocation tracking

### 📈 Advanced Analytics
- **Lag Correlation Analysis**: Time-lagged correlations between assets
- **Volatility Analysis**: Comprehensive risk metrics and volatility patterns
- **Statistical Analysis**: Statistical measures and distributions
- **Ratio & Z-Score Analysis**: Relative value indicators and mean reversion signals
- **Granger Causality**: Predictive relationships between assets

### 🤖 AI-Powered Insights (Local Analysis)
- Local AI recommendations for portfolio allocation
- Strategy insights and market analysis
- Automated signal generation based on technical indicators
- Market regime identification

### 💾 Data Management
- Local browser storage using IndexedDB (no server required)
- CSV file upload and parsing
- Sample data generator for testing
- Data export capabilities

## Technology Stack

- **Frontend**: React 18 + Vite
- **UI Components**: Radix UI + Tailwind CSS
- **Charts**: Recharts
- **Storage**: IndexedDB (local browser storage)
- **Routing**: React Router

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
npm install
```

### Running the Application

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Usage

1. **Upload Data**: Start by uploading CSV files with Nifty and Gold market data, or generate sample data
2. **View Dashboard**: Check the dashboard for market overview and recent signals
3. **Analyze**: Use various analysis pages to understand market relationships
4. **Optimize Portfolio**: Create and test portfolio strategies
5. **Get Insights**: Review AI-generated recommendations and insights

## Data Format

CSV files should contain the following columns:
- `time` or `date`: Date in YYYY-MM-DD format
- `open`: Opening price
- `high`: High price
- `low`: Low price
- `close`: Closing price
- `Volume` or `volume`: Trading volume (optional)

## Browser Compatibility

This application uses modern browser features including:
- IndexedDB for local storage
- ES6+ JavaScript features
- CSS Grid and Flexbox

Recommended browsers: Chrome, Firefox, Safari, Edge (latest versions)

## License

This project is open source and available for use and modification.

## Improvements Over Base44 Version

- ✅ **No External Dependencies**: Runs entirely locally in the browser
- ✅ **Faster Performance**: No API calls, instant data access
- ✅ **Privacy**: All data stays in your browser
- ✅ **Offline Capable**: Works without internet connection
- ✅ **Enhanced CSV Parsing**: Better error handling and format support
- ✅ **Improved AI Analysis**: Local algorithms for faster insights