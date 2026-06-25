import { useState, useEffect } from "react";
import "./App.css";
import { products } from "./data/products";
import { grades } from "./data/grades";
import { calculateFloorPrice } from "./utils/floorCalculator";
import PricePrediction from "./components/PricePrediction";

// Helper: format a value in both INR and USD
function DualPrice({ inr, usdInr, decimals = 2, size = "normal" }) {
  const usd = usdInr && typeof usdInr === "number" ? inr / usdInr : null;
  return (
    <span className={`dual-price ${size}`}>
      <span className="inr">₹{inr.toFixed(decimals)}</span>
      {usd !== null && <span className="usd">${usd.toFixed(decimals)}</span>}
    </span>
  );
}

// Metal keys
const METALS = ["copper", "nickel", "zinc", "tin", "aluminium", "iron"];

const DEFAULT_PRICES = {
  copper: 870,
  nickel: 1320,
  zinc: 240,
  tin: 2800,
  aluminium: 230,
  iron: 75,
};

function App() {
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quotePrice, setQuotePrice] = useState("");
  const [usdInr, setUsdInr] = useState(null);
  const [loadingRate, setLoadingRate] = useState(true);
  const [prices, setPrices] = useState(DEFAULT_PRICES);

  useEffect(() => {
    const fetchUsdRate = async () => {
      try {
        const API_KEY = import.meta.env.VITE_EXCHANGE_API_KEY;
        if (!API_KEY) {
          setUsdInr(86);
          return;
        }
        const response = await fetch(
          `https://v6.exchangerate-api.com/v6/${API_KEY}/latest/USD`,
        );
        const data = await response.json();
        if (data.result === "success") {
          setUsdInr(data.conversion_rates.INR);
        } else {
          setUsdInr(86);
        }
      } catch {
        setUsdInr(86);
      } finally {
        setLoadingRate(false);
      }
    };
    fetchUsdRate();
  }, []);

  const rateReady = usdInr && typeof usdInr === "number";

  const product = products.find((p) => p.id === Number(selectedProduct));
  const grade = product ? grades.find((g) => g.id === product.gradeId) : null;
  const result =
    product && grade
      ? calculateFloorPrice(grade, prices, product.spread)
      : null;

  const approved =
    quotePrice && result && Number(quotePrice) >= result.floorPrice;
  const difference =
    quotePrice && result ? Number(quotePrice) - result.floorPrice : 0;

  return (
    <div className="app">
      <div className="blob blob1" />
      <div className="blob blob2" />
      <div className="blob blob3" />

      <div className="container">
        {/* ── Hero ── */}
        <div className="hero">
          <div className="hero-eyebrow">Floor Price Intelligence Engine</div>
          <h1>MULTIMETALS</h1>
          <p>Real-time metal cost simulation &amp; quotation validation</p>
          <div className="hero-badges">
            <span className="badge badge-live">● Live</span>
            <span className="badge">{products.length} Products</span>
            <span className="badge">{grades.length} Grades</span>
            {rateReady && (
              <span className="badge badge-rate">
                1 USD = ₹{Number(usdInr).toFixed(2)}
              </span>
            )}
          </div>
        </div>

        {/* ── Market Data Control Panel ── */}
        <div className="glass">
          <div className="glass-header">
            <span className="glass-title">Market Data Control Panel</span>
            <span className="tag">Editable Demo Rates · INR</span>
          </div>

          <div className="stats">
            {METALS.map((metal) => (
              <div className="card" key={metal}>
                <span className="card-label">{metal}</span>
                <input
                  type="number"
                  value={prices[metal]}
                  onChange={(e) =>
                    setPrices({ ...prices, [metal]: Number(e.target.value) })
                  }
                />
                {rateReady && (
                  <p className="card-sub">
                    ≈ ${(prices[metal] / usdInr).toFixed(2)} USD / kg
                  </p>
                )}
              </div>
            ))}

            <div className="card floor">
              <span className="card-label">Exchange Rate</span>
              <h2>
                {loadingRate ? "Loading..." : `₹${Number(usdInr).toFixed(2)}`}
              </h2>
              <p className="card-sub" style={{ color: "#f5c97a" }}>
                {loadingRate ? "" : "per 1 USD · Live Feed"}
              </p>
            </div>
          </div>
        </div>

        {/* ── Live Market Prices (display only) ── */}
        <div className="glass">
          <div className="glass-header">
            <span className="glass-title">Live Market Snapshot</span>
            <span className="tag">Cu · Ni · Zn</span>
          </div>
          <div className="stats">
            {["copper", "nickel", "zinc"].map((metal) => (
              <div className="card" key={metal}>
                <span className="card-label">{metal}</span>
                <h2>₹{prices[metal]}</h2>
                {rateReady && (
                  <p className="card-sub">
                    ${(prices[metal] / usdInr).toFixed(2)} USD
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Product Selection ── */}
        <div className="glass">
          <div className="glass-header">
            <span className="glass-title">Select Product</span>
          </div>
          <select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
          >
            <option value="">— Choose a product —</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {product && grade && result && (
          <>
            {/* ── Product Info + Grade Composition (side by side) ── */}
            <div className="two-col">
              <div className="glass" style={{ marginBottom: 0 }}>
                <div className="glass-header">
                  <span className="glass-title">Product Info</span>
                </div>
                <div className="info-table">
                  <div className="info-row">
                    <span>Product</span>
                    <strong>{product.name}</strong>
                  </div>
                  <div className="info-row">
                    <span>Grade</span>
                    <strong>{grade.name}</strong>
                  </div>
                  <div className="info-row">
                    <span>Spread</span>
                    <strong>
                      ₹{product.spread}
                      {rateReady && (
                        <em className="usd-tag">
                          ${(product.spread / usdInr).toFixed(2)}
                        </em>
                      )}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="glass" style={{ marginBottom: 0 }}>
                <div className="glass-header">
                  <span className="glass-title">Grade Composition</span>
                </div>
                <div className="composition-bars">
                  {METALS.map((metal) => {
                    const pct = grade[metal] || 0;
                    return (
                      <div className="comp-row" key={metal}>
                        <span className="comp-label">{metal}</span>
                        <div className="comp-bar-track">
                          <div
                            className={`comp-bar comp-bar--${metal}`}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                        <span className="comp-pct">{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ── Main Calculation Cards ── */}
            <div className="stats" style={{ marginTop: 24 }}>
              <div className="card">
                <span className="card-label">Metal Cost</span>
                <h2>
                  <DualPrice inr={result.metalCost} usdInr={usdInr} />
                </h2>
              </div>
              <div className="card">
                <span className="card-label">Melt Loss (3%)</span>
                <h2>
                  <DualPrice inr={result.meltLoss} usdInr={usdInr} />
                </h2>
              </div>
              <div className="card floor">
                <span className="card-label">Floor Price</span>
                <h2>
                  <DualPrice inr={result.floorPrice} usdInr={usdInr} />
                </h2>
              </div>
            </div>

            {/* ── Calculation Breakdown ── */}
            <div className="glass">
              <div className="glass-header">
                <span className="glass-title">Calculation Breakdown</span>
              </div>

              <div className="breakdown-table">
                {METALS.map((metal) => {
                  const inrVal = ((grade[metal] || 0) * prices[metal]) / 100;
                  const usdVal = rateReady ? inrVal / usdInr : null;
                  return (
                    <div className="breakdown-row" key={metal}>
                      <span className="breakdown-label">
                        {metal.charAt(0).toUpperCase() + metal.slice(1)} Cost
                        <em className="pct-badge">{grade[metal] || 0}%</em>
                      </span>
                      <span className="breakdown-value">
                        ₹{inrVal.toFixed(2)}
                        {usdVal !== null && (
                          <em className="usd-tag">${usdVal.toFixed(2)}</em>
                        )}
                      </span>
                    </div>
                  );
                })}

                <div className="breakdown-divider" />

                <div className="breakdown-row">
                  <span className="breakdown-label">Metal Cost</span>
                  <span className="breakdown-value">
                    ₹{result.metalCost.toFixed(2)}
                    {rateReady && (
                      <em className="usd-tag">
                        ${(result.metalCost / usdInr).toFixed(2)}
                      </em>
                    )}
                  </span>
                </div>
                <div className="breakdown-row">
                  <span className="breakdown-label">Melt Loss (3%)</span>
                  <span className="breakdown-value">
                    ₹{result.meltLoss.toFixed(2)}
                    {rateReady && (
                      <em className="usd-tag">
                        ${(result.meltLoss / usdInr).toFixed(2)}
                      </em>
                    )}
                  </span>
                </div>
                <div className="breakdown-row">
                  <span className="breakdown-label">Spread</span>
                  <span className="breakdown-value">
                    ₹{product.spread}
                    {rateReady && (
                      <em className="usd-tag">
                        ${(product.spread / usdInr).toFixed(2)}
                      </em>
                    )}
                  </span>
                </div>

                <div className="breakdown-divider" />

                <div className="breakdown-row breakdown-total">
                  <span className="breakdown-label">Floor Price</span>
                  <span className="breakdown-value">
                    ₹{result.floorPrice.toFixed(2)}
                    {rateReady && (
                      <em className="usd-tag">
                        ${(result.floorPrice / usdInr).toFixed(2)}
                      </em>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* ── Quote Validation ── */}
            <div className="glass">
              <div className="glass-header">
                <span className="glass-title">Quote Validation</span>
              </div>
              <label>Enter Quote Price (₹ INR)</label>
              <input
                type="number"
                placeholder="Enter quotation amount in ₹"
                value={quotePrice}
                onChange={(e) => setQuotePrice(e.target.value)}
              />

              {quotePrice && (
                <>
                  <div
                    className={approved ? "status success" : "status danger"}
                  >
                    {approved ? (
                      <>✅ Quote Above Floor · Auto Approved</>
                    ) : (
                      <>⚠ Quote Below Floor · MD Approval Required</>
                    )}
                  </div>

                  {/* ── Difference Card — INR + USD both ── */}
                  <div className="diff-card" style={{ marginTop: 20 }}>
                    <div className="diff-card-inner">
                      <div className="diff-block">
                        <span className="card-label">Difference (INR)</span>
                        <h2
                          style={{
                            color: difference >= 0 ? "#86efac" : "#fca5a5",
                          }}
                        >
                          {difference >= 0 ? "+" : ""}₹{difference.toFixed(2)}
                        </h2>
                      </div>
                      {rateReady && (
                        <div className="diff-block diff-block--usd">
                          <span className="card-label">Difference (USD)</span>
                          <h2
                            style={{
                              color: difference >= 0 ? "#86efac" : "#fca5a5",
                            }}
                          >
                            {difference >= 0 ? "+" : ""}$
                            {(difference / usdInr).toFixed(2)}
                          </h2>
                        </div>
                      )}
                    </div>
                    <div className="diff-meta">
                      <span>
                        Quote: ₹{Number(quotePrice).toFixed(2)}
                        {rateReady &&
                          ` / $${(Number(quotePrice) / usdInr).toFixed(2)}`}
                      </span>
                      <span>
                        Floor: ₹{result.floorPrice.toFixed(2)}
                        {rateReady &&
                          ` / $${(result.floorPrice / usdInr).toFixed(2)}`}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {/* ── Price Prediction ── */}
        <PricePrediction prices={prices} usdInr={usdInr} />
      </div>
    </div>
  );
}

export default App;
