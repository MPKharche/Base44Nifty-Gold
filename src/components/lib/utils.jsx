// Create the utils file in components directory
export function cn(...inputs) {
  return inputs.filter(Boolean).join(" ");
}

// Add the calculateEMA function
export function calculateEMA(data, period) {
  const k = 2 / (period + 1);
  let emaData = Array(period - 1).fill(0);
  
  // First EMA is just the average of the first 'period' elements
  const firstSum = data.slice(0, period).reduce((a, b) => a + b, 0);
  const firstEMA = firstSum / period;
  emaData.push(firstEMA);
  
  // Calculate subsequent EMAs
  for (let i = period; i < data.length; i++) {
    const currentValue = data[i];
    const previousEMA = emaData[emaData.length - 1];
    const currentEMA = (currentValue * k) + (previousEMA * (1 - k));
    emaData.push(currentEMA);
  }
  
  return emaData;
}