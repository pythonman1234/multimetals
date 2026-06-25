import { useState, useEffect, useRef } from "react";
import {
  generateHistoricalPrices,
  linearRegPredict,
  rankMetalsToBuy,
  getTrend,
} from "../utils/metalAdvisor";

// Chart.js must be loaded — add this to your index.html:
// <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js"></script>
// OR install via npm: npm install chart.js

let ChartJS = null;

export default function PricePrediction({ prices, usdInr }) {
  const [selectedMetal, setSelectedMetal] = useState("copper");
  const [daysAhead, setDaysAhead] = useState(7);
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  const metals = ["copper", "nickel", "zinc", "tin", "aluminium", "iron"];

  const currentPrice = prices[selectedMetal] || 0;
  const history = generateHistoricalPrices(currentPrice, 14);
  const predictions = linearRegPredict(history, daysAhead);
  const lastHistoric = history[history.length - 1];
  const lastPredicted = predictions[predictions.length - 1];
  const trend = getTrend(lastHistoric, lastPredicted);
  const change = lastPredicted - lastHistoric;
  const rankings = rankMetalsToBuy(prices);
  const rateReady = usdInr && typeof usdInr === "number";

  // Build chart labels
  const histLabels = Array.from({ length: 14 }, (_, i) => `-${14 - i}d`);
  const predLabels = Array.from({ length: daysAhead }, (_, i) => `+${i + 1}d`);
  const allLabels = [...histLabels, ...predLabels];

  // Historical data + null for pred zone; pred data bridged from last historical point
  const historicalData = [...history, ...Array(daysAhead).fill(null)];
  const predData = [
    ...Array(13).fill(null),
    history[13], // bridge point
    ...predictions,
  ];

  useEffect(() => {
    // Dynamically import Chart.js if not already available
    const initChart = async () => {
      if (typeof window !== "undefined" && window.Chart) {
        ChartJS = window.Chart;
      } else {
        const mod = await import("chart.js/auto");
        ChartJS = mod.default;
      }
      renderChart();
    };
    initChart();
  }, [selectedMetal, daysAhead, prices]);

  function renderChart() {
    if (!chartRef.current || !ChartJS) return;
    if (chartInstance.current) chartInstance.current.destroy();

    chartInstance.current = new ChartJS(chartRef.current, {
      type: "line",
      data: {
        labels: allLabels,
        datasets: [
          {
            label: "Historical",
            data: historicalData,
            borderColor: "#378ADD",
            backgroundColor: "rgba(55,138,221,0.08)",
            borderWidth: 2,
            pointRadius: 2,
            tension: 0.3,
            fill: false,
          },
          {
            label: "Predicted",
            data: predData,
            borderColor: "#1D9E75",
            backgroundColor: "rgba(29,158,117,0.08)",
            borderWidth: 2,
            borderDash: [6, 4],
            pointRadius: 2,
            tension: 0.3,
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ₹${ctx.parsed.y?.toLocaleString() ?? ""}`,
            },
          },
        },
        scales: {
          x: {
            ticks: { font: { size: 11 }, maxRotation: 0 },
            grid: { color: "rgba(0,0,0,0.05)" },
          },
          y: {
            ticks: {
              font: { size: 11 },
              callback: (v) => "₹" + v.toLocaleString(),
            },
            grid: { color: "rgba(0,0,0,0.05)" },
          },
        },
      },
    });
  }

  const trendColor =
    trend.label === "Rising"
      ? "#A32D2D"
      : trend.label === "Falling"
        ? "#3B6D11"
        : "#185FA5";

  const trendBg =
    trend.label === "Rising"
      ? "#FCEBEB"
      : trend.label === "Falling"
        ? "#EAF3DE"
        : "#E6F1FB";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* ── Price Prediction Section ── */}
      <div className="glass">
        <h3 style={{ marginBottom: "16px" }}>📈 Price Prediction Engine</h3>

        {/* Controls */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            marginBottom: "16px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: 1, minWidth: "160px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "6px",
                fontSize: "14px",
                opacity: 0.75,
              }}
            >
              Select Metal
            </label>
            <select
              value={selectedMetal}
              onChange={(e) => setSelectedMetal(e.target.value)}
              style={{ width: "100%" }}
            >
              {metals.map((m) => (
                <option key={m} value={m}>
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div style={{ flex: 1, minWidth: "160px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "6px",
                fontSize: "14px",
                opacity: 0.75,
              }}
            >
              Forecast Days: {daysAhead}
            </label>
            <input
              type="range"
              min={3}
              max={30}
              step={1}
              value={daysAhead}
              onChange={(e) => setDaysAhead(Number(e.target.value))}
              style={{ width: "100%" }}
            />
          </div>
        </div>

        {/* Stat Cards */}
        <div className="stats" style={{ marginBottom: "16px" }}>
          <div className="card">
            <span>Current Price</span>
            <h2>₹{currentPrice.toLocaleString()}</h2>
            {rateReady && (
              <p style={{ fontSize: "0.75em", opacity: 0.7, marginTop: 4 }}>
                ${(currentPrice / usdInr).toFixed(2)} USD
              </p>
            )}
          </div>

          <div className="card">
            <span>{daysAhead}-Day Forecast</span>
            <h2>₹{lastPredicted.toLocaleString()}</h2>
            {rateReady && (
              <p style={{ fontSize: "0.75em", opacity: 0.7, marginTop: 4 }}>
                ${(lastPredicted / usdInr).toFixed(2)} USD
              </p>
            )}
          </div>

          <div className="card floor">
            <span>Expected Change</span>
            <h2 style={{ color: change >= 0 ? "#c0392b" : "#27ae60" }}>
              {change >= 0 ? "+" : ""}₹{change.toLocaleString()}
            </h2>
            <span
              style={{
                display: "inline-block",
                marginTop: "8px",
                padding: "3px 10px",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: 500,
                background: trendBg,
                color: trendColor,
              }}
            >
              {trend.icon} {trend.label} ({Math.abs(trend.pct).toFixed(1)}%)
            </span>
          </div>
        </div>

        {/* Custom Legend */}
        <div
          style={{
            display: "flex",
            gap: "16px",
            marginBottom: "8px",
            fontSize: "12px",
            opacity: 0.75,
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span
              style={{
                width: 24,
                height: 2,
                background: "#378ADD",
                display: "inline-block",
                borderRadius: 2,
              }}
            ></span>
            Historical
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span
              style={{
                width: 24,
                height: 2,
                background: "#1D9E75",
                display: "inline-block",
                borderRadius: 2,
                borderTop: "2px dashed #1D9E75",
              }}
            ></span>
            Predicted
          </span>
        </div>

        {/* Chart */}
        <div style={{ position: "relative", width: "100%", height: "260px" }}>
          <canvas
            ref={chartRef}
            role="img"
            aria-label={`${selectedMetal} price prediction chart`}
          />
        </div>

        <p style={{ marginTop: "12px", fontSize: "12px", opacity: 0.6 }}>
          ⚠ Prediction uses linear regression on simulated historical data. For
          production, connect a real price feed API.
        </p>
      </div>

      {/* ── Best Metal to Buy ── */}
      <div className="glass">
        <h3 style={{ marginBottom: "8px" }}>🏆 Best Metal to Buy Right Now</h3>
        <p style={{ marginBottom: "16px", fontSize: "13px", opacity: 0.7 }}>
          Score = purity% ÷ price × 1000 — higher score means more value per
          rupee
        </p>

        {rankings.map((item, index) => {
          const maxScore = rankings[0].score;
          const barWidth = ((item.score / maxScore) * 100).toFixed(0);
          const isBest = index === 0;

          return (
            <div
              key={item.metal}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px 14px",
                marginBottom: "8px",
                borderRadius: "10px",
                border: isBest
                  ? "2px solid #1D9E75"
                  : "0.5px solid rgba(255,255,255,0.1)",
                background: isBest
                  ? "rgba(29,158,117,0.06)"
                  : "rgba(255,255,255,0.03)",
              }}
            >
              {/* Rank */}
              <span
                style={{
                  fontSize: "18px",
                  fontWeight: 500,
                  minWidth: "28px",
                  color: isBest ? "#1D9E75" : "rgba(255,255,255,0.4)",
                }}
              >
                {isBest ? "★" : index + 1}
              </span>

              {/* Info */}
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "4px",
                  }}
                >
                  <span
                    style={{ fontWeight: 500, textTransform: "capitalize" }}
                  >
                    {item.metal}
                  </span>
                  {isBest && (
                    <span
                      style={{
                        fontSize: "11px",
                        padding: "3px 10px",
                        borderRadius: "6px",
                        background: "#E1F5EE",
                        color: "#0F6E56",
                        fontWeight: 500,
                      }}
                    >
                      Best Buy
                    </span>
                  )}
                </div>

                <div
                  style={{
                    fontSize: "12px",
                    opacity: 0.65,
                    marginBottom: "6px",
                  }}
                >
                  ₹{item.price.toLocaleString()}/kg · {item.purity}% purity ·
                  Score: {item.score}
                  {rateReady && (
                    <span style={{ marginLeft: "6px" }}>
                      (${(item.price / usdInr).toFixed(2)} USD)
                    </span>
                  )}
                </div>

                {/* Progress bar */}
                <div
                  style={{
                    height: "5px",
                    borderRadius: "3px",
                    background: "rgba(255,255,255,0.1)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${barWidth}%`,
                      borderRadius: "3px",
                      background: isBest ? "#1D9E75" : "#378ADD",
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
