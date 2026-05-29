import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../CostAnalysis/CostAnalysis.css";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

const CONTAINER_KEYS = ["20ft", "40ft", "40ft_hc", "45ft_hc"];

const CONTAINER_NAMES = {
  "20ft": "20ft Standard",
  "40ft": "40ft Standard",
  "40ft_hc": "40ft High Cube",
  "45ft_hc": "45ft High Cube",
};

const RATE_LABELS = {
  base_freight_rate: "Base Freight Rate",
  customs_clearance: "Customs Clearance",
  terminal_handling: "Terminal Handling",
  documentation_fees: "Documentation Fees",
};

function fmt(n, decimals = 0) {
  if (n == null || Number.isNaN(Number(n))) return "—";
  return Number(n).toLocaleString("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export default function ShareReport() {
  const { shareId } = useParams();
  const navigate = useNavigate();

  const [report, setReport] = useState(null);
  const [currency, setCurrency] = useState("INR");
const [loading, setLoading] = useState(true);

  const currencySymbols = {
    INR: "₹",
    USD: "$",
    EUR: "€",
    GBP: "£",
    AED: "د.إ",
    SGD: "S$",
  };

useEffect(() => {
  setLoading(true);

  fetch(`${API}/api/share-report/${shareId}`)
    .then((res) => res.json())
    .then((data) => {
      console.log("SHARE DATA =", data);
      setReport(data);
      setLoading(false);
    })
    .catch((err) => {
      console.error(err);
      alert("Shared report not found");
      setLoading(false);
    });
}, [shareId]);

  const cargoItems = report?.cargoItems || [];
  const analysisData = report?.analysisData || null;
  const rates = report?.rates || report?.freightRates || {};

if (loading) {
  return <h2 style={{ padding: 30 }}>Loading shared report...</h2>;
}

if (!report) {
  return <h2 style={{ padding: 30 }}>Report not found</h2>;
}

if (!analysisData) {
  return <h2 style={{ padding: 30 }}>Analysis data missing</h2>;
}

  return (
    <div className="cost-analysis" style={{ padding: "30px" }}>
      <div className="ca-header">
        <h2>💰 Freight Cost Analysis</h2>
      </div>

      <div className="ca-section">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "15px",
          }}
        >
          <h3>Freight Charges ({currency} per container)</h3>

          <div className="currency-box">
            <label>Select Currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="currency-select"
            >
              <option value="INR">₹ INR - Indian Rupee</option>
              <option value="USD">$ USD - US Dollar</option>
              <option value="EUR">€ EUR - Euro</option>
              <option value="GBP">£ GBP - Pound</option>
              <option value="AED">د.إ AED - Dirham</option>
              <option value="SGD">S$ SGD - Singapore Dollar</option>
            </select>
          </div>
        </div>

        <div className="ca-table-wrap">
          <table className="ca-table ca-input-table">
            <thead>
              <tr>
                <th>Charge Type</th>
                {CONTAINER_KEYS.map((k) => (
                  <th key={k}>{CONTAINER_NAMES[k]}</th>
                ))}
              </tr>
            </thead>

            <tbody>
              {Object.entries(RATE_LABELS).map(([rateKey, label]) => (
                <tr key={rateKey}>
                  <td>
                    <strong>{label}</strong>
                  </td>

                  {CONTAINER_KEYS.map((k) => (
                    <td key={k}>
                      <input
                        className="ca-rate-input"
                        type="number"
                        value={rates?.[k]?.[rateKey] || 0}
                        readOnly
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="ca-formula-note">
          Shared view only. Freight values are read-only.
        </p>
      </div>

      <div className="ca-section">
        <h3>Cargo Summary From Item List</h3>

        <div className="ca-summary-grid">
          <div className="ca-stat">
            <span className="ca-stat-label">Total Volume</span>
            <span className="ca-stat-value">
              {fmt(analysisData.totalVolM3, 4)} m³
            </span>
          </div>

          <div className="ca-stat">
            <span className="ca-stat-label">Total Weight</span>
            <span className="ca-stat-value">
              {fmt(analysisData.totalWtKg, 2)} kg
            </span>
          </div>

          <div className="ca-stat">
            <span className="ca-stat-label">Item Lines</span>
            <span className="ca-stat-value">{cargoItems.length}</span>
          </div>

          <div className="ca-stat">
            <span className="ca-stat-label">Total Qty</span>
            <span className="ca-stat-value">
              {fmt(analysisData.totalUnits)}
            </span>
          </div>
        </div>

        <div className="ca-table-wrap" style={{ marginTop: "20px" }}>
          <table className="ca-table">
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Length</th>
                <th>Width</th>
                <th>Height</th>
                <th>Weight</th>
                <th>Qty</th>
              </tr>
            </thead>

            <tbody>
              {cargoItems.map((item, index) => (
                <tr key={index}>
                  <td>{item.product_name}</td>
                  <td>{item.length_mm}</td>
                  <td>{item.width_mm}</td>
                  <td>{item.height_mm}</td>
                  <td>{item.weight_kg}</td>
                  <td>{item.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

{report.costBasedResult && (
        <div className="ca-section">
          <h3>Cost-Based Method — Rejection Resolution</h3>
          <div className="ca-table-wrap">
            <table className="ca-table">
              <thead>
                <tr style={{ background: '#1e3a8a' }}>
                  <th style={{ color: '#fff' }}>Case</th>
                  <th style={{ color: '#fff' }}>Container Plan</th>
                  <th style={{ color: '#fff' }}>20ft Count</th>
                  <th style={{ color: '#fff' }}>40ft Count</th>
                  <th style={{ color: '#fff' }}>40HC Count</th>
                  <th style={{ color: '#fff' }}>45HC Count</th>
                  <th style={{ color: '#fff' }}>Items Fitted</th>
                  <th style={{ color: '#fff' }}>Rejected Items</th>
                  <th style={{ color: '#fff' }}>Total Cost</th>
                </tr>
              </thead>
              <tbody>
                {report.costBasedResult.results.map((row, idx) => {
                  const isWinner = report.costBasedResult.winner && row.label === report.costBasedResult.winner.label;
                  const isSelected = report.selectedPlan ? row.label === report.selectedPlan.label : isWinner;
                  return (
                    <tr key={idx} style={{
                      background: isSelected ? '#dbeafe' : row.feasible ? '#f0fdf4' : '#fff7f7',
                      fontWeight: isSelected ? 700 : 400,
                      outline: isSelected ? '2px solid #2563eb' : undefined,
                    }}>
                      <td>Solution {idx + 1}</td>
                      <td>
                        <strong>{row.label}</strong>
                        {isWinner && (
                          <span style={{ marginLeft: 8, background: '#ca8a04', color: '#fff', borderRadius: 5, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>✓ Optimal</span>
                        )}
                        {isSelected && !isWinner && (
                          <span style={{ marginLeft: 8, background: '#2563eb', color: '#fff', borderRadius: 5, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>✓ Selected</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>{row.counts?.['20ft'] || 0}</td>
                      <td style={{ textAlign: 'center' }}>{row.counts?.['40ft'] || 0}</td>
                      <td style={{ textAlign: 'center' }}>{row.counts?.['40ft_hc'] || 0}</td>
                      <td style={{ textAlign: 'center' }}>{row.counts?.['45ft_hc'] || 0}</td>
                      <td style={{ textAlign: 'center', color: '#166534', fontWeight: 600 }}>{row.itemsFitted}</td>
                      <td style={{ textAlign: 'center', color: row.itemsRejected > 0 ? '#b91c1c' : '#166534', fontWeight: 600 }}>{row.itemsRejected}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>{currencySymbols[currency]}{fmt(row.totalCost)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

<div className="ca-recommendation">
        <span className="ca-rec-icon">✅</span>

        <div>
          <strong>
            {report.selectedPlan || report.costBasedResult?.winner
              ? `${report.selectedPlan ? 'Selected' : 'Optimal'} Container Plan: ${(report.selectedPlan || report.costBasedResult.winner).label}`
              : `Lowest Cost Container: ${CONTAINER_NAMES[analysisData.recommended]}`
            }
          </strong>

          <p>
            {report.selectedPlan || report.costBasedResult?.winner
              ? `Total cost ${currencySymbols[currency]}${fmt((report.selectedPlan || report.costBasedResult.winner).totalCost)} · ${(report.selectedPlan || report.costBasedResult.winner).itemsFitted}/${report.costBasedResult?.totalAllItems} items fitted ✅`
              : `Total cost ${currencySymbols[currency]}${fmt(analysisData.analysis[analysisData.recommended].totalCost)} using ${analysisData.analysis[analysisData.recommended].containersRequired} container(s).`
            }
          </p>

          <button
            className="btn-primary ca-proceed-btn"
            onClick={() => navigate(`/share/${shareId}/3d`)}
          >
            View 3D
          </button>
        </div>
      </div>
    </div>
  );
}