// Metal purity % (approximate standard values)
export const METAL_PURITY = {
  copper: 99.9,
  nickel: 99.5,
  zinc: 99.7,
  tin: 99.9,
  aluminium: 99.5,
  iron: 98.0,
};

/**
 * Generate simulated historical prices for a metal
 * In production: replace this with a real API call
 * @param {number} currentPrice - today's price in INR
 * @param {number} days - how many days of history to generate
 */
export function generateHistoricalPrices(currentPrice, days = 14) {
  const history = [];
  let price = currentPrice * 0.97; // start slightly below current

  for (let i = 0; i < days; i++) {
    // ±1.5% random daily movement
    price = price + (Math.random() - 0.48) * currentPrice * 0.015;
    history.push(Math.round(price));
  }

  // Make last value = current price so chart connects cleanly
  history[history.length - 1] = currentPrice;
  return history;
}

/**
 * Linear regression predictor
 * @param {number[]} history - array of past prices
 * @param {number} daysAhead - how many future days to predict
 * @returns {number[]} predicted prices
 */
export function linearRegPredict(history, daysAhead = 7) {
  const n = history.length;
  const xs = Array.from({ length: n }, (_, i) => i);

  const sumX = xs.reduce((a, b) => a + b, 0);
  const sumY = history.reduce((a, b) => a + b, 0);
  const sumXY = xs.reduce((a, x, i) => a + x * history[i], 0);
  const sumX2 = xs.reduce((a, x) => a + x * x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return Array.from({ length: daysAhead }, (_, i) =>
    Math.max(0, Math.round(intercept + slope * (n + i))),
  );
}

/**
 * Score each metal: higher purity per rupee = better buy
 * Score = (purity% / price) * 1000
 * @param {Object} prices - { copper, nickel, zinc, tin, aluminium, iron }
 * @returns {Array} sorted array from best to worst
 */
export function rankMetalsToBuy(prices) {
  return Object.entries(prices)
    .map(([metal, price]) => {
      const purity = METAL_PURITY[metal] ?? 99;
      const score =
        price > 0 ? parseFloat(((purity / price) * 1000).toFixed(3)) : 0;
      return { metal, price, purity, score };
    })
    .sort((a, b) => b.score - a.score);
}

/**
 * Get trend label from predicted vs current price
 */
export function getTrend(currentPrice, predictedPrice) {
  const pct = ((predictedPrice - currentPrice) / currentPrice) * 100;
  if (pct > 1) return { label: "Rising", color: "#A32D2D", icon: "▲", pct };
  if (pct < -1) return { label: "Falling", color: "#3B6D11", icon: "▼", pct };
  return { label: "Stable", color: "#185FA5", icon: "→", pct };
}
