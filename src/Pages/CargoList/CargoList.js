

import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { SidebarLayout } from "../../Components";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./CargoList.css";

const DRAFT_KEY = "shipmentDrafts";
const CONTAINER_MAX_WEIGHT = 26500;
const CONTAINER_MAX_VOL_CBM = 33.2;
const WEIGHT_WARN_PCT = 0.9;
const WEIGHT_CRIT_PCT = 1.0;

const PackingWarningsModal = ({ messages, onClose, onProceed }) => {
  if (!messages || messages.length === 0) return null;
  const hasOverflow = messages.some((m) => m.type === "overflow");
const iconFor = (t) => ({
  overflow: "📦",
  no_space: "🚫",
  stacking: "⚠️",
  success: "✅"
}[t] || "ℹ️");
  const titleFor = (t) =>
    ({
      overflow: "Item Exceeds Container Dimensions",
      no_space: "Not Enough Space",
      success: "Packed Successfully",
      stacking: "Stacking Rule Violated",
      
    }[t] || "Notice");
  const hintFor = (t) =>
    ({
      overflow: "💡 Use a larger container or reduce item size.",
      no_space: "💡 Reduce quantity or use a larger container.",
      stacking: "💡 Reorder items or enable Disable Stacking for that item.",
    }[t] || "");
  const colorFor = (t) =>
    ({
      overflow: { bg: "#FEF2F2", border: "#FCA5A5", text: "#991B1B", badge: "#DC2626" },
      no_space: { bg: "#FFF7ED", border: "#FCD34D", text: "#92400E", badge: "#D97706" },
      success: { bg: "#ECFDF5", border: "#86EFAC", text: "#166534", badge: "#16A34A" },
      stacking: { bg: "#FFFBEB", border: "#FDE68A", text: "#92400E", badge: "#B45309" },
    }[t] || { bg: "#EFF6FF", border: "#BFDBFE", text: "#1E40AF", badge: "#2563EB" });

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 99999,
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          width: 500,
          maxWidth: "95vw",
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
          overflow: "hidden",
          fontFamily: "'DM Sans','Segoe UI',sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 24px 16px",
            borderBottom: "1px solid #f1f5f9",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                background: "#FEF3C7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
              }}
            >
              {hasOverflow ? "🚨" : "⚠️"}
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
                Packing Validation
              </div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                {messages.length} issue{messages.length > 1 ? "s" : ""} detected
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              width: 30,
              height: 30,
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              background: "transparent",
              cursor: "pointer",
              fontSize: 14,
              color: "#64748b",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ✕
          </button>
        </div>

        <div
          style={{
            overflowY: "auto",
            padding: "16px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {messages.map((msg, i) => {
            const c = colorFor(msg.type);
            return (
              <div
                key={i}
                style={{
                  borderRadius: 10,
                  padding: "14px 16px",
                  background: c.bg,
                  border: `1px solid ${c.border}`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                    marginBottom: 8,
                  }}
                >
                  <span style={{ fontSize: 20 }}>{iconFor(msg.type)}</span>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        marginBottom: 4,
                        color: c.text,
                      }}
                    >
                      {titleFor(msg.type)}
                    </div>
                    {msg.item && (
                      <span
                        style={{
                          display: "inline-block",
                          padding: "2px 8px",
                          borderRadius: 20,
                          fontSize: 11,
                          fontWeight: 600,
                          color: "#fff",
                          background: c.badge,
                        }}
                      >
                        {msg.item}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ fontSize: 13, lineHeight: 1.7, color: c.text }}>
                  {(msg.message || "").split("\n").map((line, li) => (
                    <div key={li}>{line}</div>
                  ))}
                </div>

                <div
                  style={{
                    marginTop: 10,
                    fontSize: 12,
                    color: "#64748b",
                    background: "rgba(255,255,255,0.7)",
                    borderRadius: 6,
                    padding: "6px 10px",
                  }}
                >
                  {hintFor(msg.type)}
                </div>
              </div>
            );
          })}
        </div>

        <div
          style={{
            padding: "14px 24px",
            borderTop: "1px solid #f1f5f9",
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
          }}
        >
          {onProceed && !hasOverflow && (
            <button
              onClick={onProceed}
              style={{
                padding: "8px 18px",
                borderRadius: 8,
                background: "transparent",
                border: "1px solid #cbd5e1",
                color: "#475569",
                cursor: "pointer",
                fontSize: 13,
              }}
            >
            {messages.every((m) => m.type === "success") ? "Proceed →" : "Proceed Anyway →"}
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              padding: "8px 20px",
              borderRadius: 8,
              background: "#1e40af",
              border: "none",
              color: "#fff",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {hasOverflow ? "Close" : "Got it"}
          </button>
        </div>
      </div>
    </div>
  );
};

const CargoList = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState("");
  const [weightAlert, setWeightAlert] = useState(null);
  const [alertDismissed, setAlertDismissed] = useState(false);
  const [packingMessages, setPackingMessages] = useState([]);
  const [showPackingModal, setShowPackingModal] = useState(false);
  const [pendingNavigate, setPendingNavigate] = useState(null);

  const viewShipmentName = location.state?.viewShipmentName || null;

  const selectedContainer = location.state?.selectedContainer ||
    location.state?.container || {
      container_name: "20FT General Purpose",
      internal_length_mm: 5898,
      internal_width_mm: 2352,
      internal_height_mm: 2393,
      max_payload_kg: 27000,
    };

  const normalizeCargoItemForPacking = (item) => ({
    id: item.id,
    product_name: item.product_name || "",
    shipment_name: item.shipment_name || "",
    cargo_type: item.cargo_type || item.type || "",
    type: item.type || item.cargo_type || "",
    color: item.color || "#1565c0",
    length_mm: Number(item.length_mm || 0),
    width_mm: Number(item.width_mm || 0),
    height_mm: Number(item.height_mm || 0),
    weight_kg: Number(item.weight_kg || 0),
    quantity: Number(item.quantity || 0),
    layers_count: Number(item.layers_count || 1),
    max_height_mm: Number(item.max_height_mm || 0),
    max_mass_kg: Number(item.max_mass_kg || 0),
    tilt_length: Boolean(item.tilt_length),
    tilt_width: Boolean(item.tilt_width),
    no_stack: Boolean(item.no_stack),
    rotate: Boolean(item.rotate || item.rotate_90 || item.rotation),
  });

  const loadData = async () => {
    setAlertDismissed(false);
    try {
      setLoading(true);
      setError("");
      const url = viewShipmentName
        ? `http://localhost:5000/api/cargo?shipment=${encodeURIComponent(
            viewShipmentName
          )}`
        : "http://localhost:5000/api/cargo";
      const cargoRes = await fetch(url);
      const cargo = await cargoRes.json();
      setItems(Array.isArray(cargo) ? cargo : []);
    } catch {
      setError("Cannot connect to backend. Is the server running on port 5000?");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [viewShipmentName]);

useEffect(() => {
    // ✅ FIX 1 & 2: If we're viewing a saved/completed shipment, NEVER write a draft.
    // viewShipmentName being set means the user navigated here from the shipments list
    // to view an existing DB shipment — not creating a new one.
    if (viewShipmentName) return;

    if (items.length === 0) return;
    const shipmentName = items.find(
      (item) => item.shipment_name && String(item.shipment_name).trim()
    )?.shipment_name;
    if (!shipmentName) return;

    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      const drafts = Array.isArray(parsed)
        ? parsed.reduce((acc, d) => {
            const k = (d.name || "").toLowerCase();
            if (k) acc[k] = d;
            return acc;
          }, {})
        : parsed;

      const key = shipmentName.toLowerCase();
      const existing = drafts[key] || {};
      const firstItem = items[0] || {};

      drafts[key] = {
        id: `draft_${shipmentName.replace(/\s+/g, "_")}`,
        name: shipmentName,
        status: "draft",
        // ✅ FIX 3: Use items.length (number of item lines) not sum of quantities.
        // This matches what the DB stores in shipments.item_count.
        item_count: items.length,
        created_at: existing.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        form: existing.form || {
          shipment_name: shipmentName,
          product_name: firstItem.product_name || "",
          type: firstItem.type || firstItem.cargo_type || "",
          color: firstItem.color || "#1565c0",
          length_cm: firstItem.length_mm
            ? String(parseFloat(firstItem.length_mm) / 10)
            : "",
          width_cm: firstItem.width_mm
            ? String(parseFloat(firstItem.width_mm) / 10)
            : "",
          height_cm: firstItem.height_mm
            ? String(parseFloat(firstItem.height_mm) / 10)
            : "",
          weight_kg: firstItem.weight_kg || "",
          quantity: firstItem.quantity || "",
          layers_count: firstItem.layers_count || "",
          max_height_cm: firstItem.max_height_mm
            ? String(parseFloat(firstItem.max_height_mm) / 10)
            : "",
          max_mass_kg: firstItem.max_mass_kg || "",
          tilt_length: Boolean(firstItem.tilt_length),
          tilt_width: Boolean(firstItem.tilt_width),
          no_stack: Boolean(firstItem.no_stack),
          rotate: Boolean(
            firstItem.rotate ||
              firstItem.rotation ||
              firstItem.rotate_90 ||
              firstItem.rotate_180 ||
              firstItem.rotate_270
          ),
          rotate_90: Boolean(
            firstItem.rotate_90 || firstItem.rotate || firstItem.rotation
          ),
        },
      };

      localStorage.setItem(DRAFT_KEY, JSON.stringify(drafts));
    } catch {}
  }, [items, viewShipmentName]);

  const totalItems = items.length;
  const totalWeight = items.reduce(
    (sum, i) => sum + parseFloat(i.weight_kg || 0) * parseInt(i.quantity || 0),
    0
  );
  const totalVolume = items.reduce(
    (sum, i) =>
      sum +
      (parseFloat(i.length_mm || 0) *
        parseFloat(i.width_mm || 0) *
        parseFloat(i.height_mm || 0) *
        parseInt(i.quantity || 0)) /
        1e9,
    0
  );
  const totalQty = items.reduce((sum, i) => sum + parseInt(i.quantity || 0), 0);

  useEffect(() => {
    if (items.length === 0 || alertDismissed) return;
    const pct = totalWeight / CONTAINER_MAX_WEIGHT;
    if (pct >= WEIGHT_CRIT_PCT) setWeightAlert("red");
    else if (pct >= WEIGHT_WARN_PCT) setWeightAlert("amber");
    else setWeightAlert(null);
  }, [items, totalWeight, alertDismissed]);

  const handleDelete = async (item) => {
    try {
      const res = await fetch(`http://localhost:5000/api/cargo/${item.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Delete failed");
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      toast.success(`${item.product_name} deleted successfully`);
    } catch {
      toast.error("Failed to delete cargo item");
    }
  };

  const handleCalculate = async () => {
    if (!items.length) {
      setError("No cargo items to calculate.");
      return;
    }

    setError("");

    // Cost analysis must happen before 3D loading.
    // The CostAnalysis page will show user charge inputs, compare all containers,
    // recommend the lowest-cost container, and then proceed to 3D.
    navigate("/cost-analysis", {
      state: {
        cargoItems: items.map(normalizeCargoItemForPacking),
        selectedContainer,
        shipmentName:
          items.find((i) => i.shipment_name && String(i.shipment_name).trim())?.shipment_name ||
          viewShipmentName ||
          "Shipment",
      },
    });
  };

  // ✅ FIX: "Proceed Anyway" navigates to /3d-viewer using the pending state
  const handleModalProceed = () => {
    setShowPackingModal(false);
    if (pendingNavigate) {
      navigate("/3d-viewer", { state: pendingNavigate });
    }
    setPendingNavigate(null);
  };

  // "Got it" / close — dismiss modal and stay on cargo list
  const handleModalClose = () => {
    setShowPackingModal(false);
    setPendingNavigate(null);
  };

  const handleExportCSV = () => {
    if (!items.length) {
      toast.error("No cargo items to export");
      return;
    }

    const headers = [
      "Shipment Name",
      "Product Name",
      "Type",
      "Length (cm)",
      "Width (cm)",
      "Height (cm)",
      "Weight (kg)",
      "Quantity",
      "Layers",
      "Max Height (cm)",
      "Max Mass (kg)",
      "Tilt",
      "Rotate",
      "No Stack",
      "Color",
    ];

    const rows = items.map((item) => [
      item.shipment_name || "",
      item.product_name || "",
      item.type || item.cargo_type || "",
      (parseFloat(item.length_mm || 0) / 10) || "",
      (parseFloat(item.width_mm || 0) / 10) || "",
      (parseFloat(item.height_mm || 0) / 10) || "",
      item.weight_kg || "",
      item.quantity || "",
      item.layers_count || "",
      (parseFloat(item.max_height_mm || 0) / 10) || "",
      item.max_mass_kg || "",
      item.tilt_length ? "Yes" : "No",
      item.rotate || item.rotation || item.rotate_90 || item.rotate_180 || item.rotate_270
        ? "Yes"
        : "No",
      item.no_stack ? "Yes" : "No",
      item.color || "",
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "cargo_items.csv";
    link.click();
    toast.success("CSV exported successfully");
  };

  const filtered = items
    .filter((i) => (i.product_name || "").toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "name")
        return (a.product_name || "").localeCompare(b.product_name || "");
      if (sortBy === "weight")
        return parseFloat(b.weight_kg || 0) - parseFloat(a.weight_kg || 0);
      if (sortBy === "volume") {
        const volA =
          parseFloat(a.length_mm || 0) *
          parseFloat(a.width_mm || 0) *
          parseFloat(a.height_mm || 0);
        const volB =
          parseFloat(b.length_mm || 0) *
          parseFloat(b.width_mm || 0) *
          parseFloat(b.height_mm || 0);
        return volB - volA;
      }
      return 0;
    });

  const shipmentName =
    items.find((item) => item.shipment_name && String(item.shipment_name).trim())
      ?.shipment_name || "";
      const savedLayoutKey = shipmentName ? `cargoset_saved_layout_${shipmentName}` : null;

const getSavedLayoutBox = (productName) => {
  try {
    const saved = savedLayoutKey
      ? JSON.parse(localStorage.getItem(savedLayoutKey) || "[]")
      : [];

    return saved.find((b) => b.product_name === productName) || null;
  } catch {
    return null;
  }
};
  const tableTitle = shipmentName
    ? String(shipmentName).trim().toUpperCase()
    : "CARGO CONFIGURATION DATASET";

  const weightPct = totalWeight / CONTAINER_MAX_WEIGHT;
  const weightPctDisp = (weightPct * 100).toFixed(1);
  const weightOver = Math.max(0, totalWeight - CONTAINER_MAX_WEIGHT);
  const weightRem = Math.max(0, CONTAINER_MAX_WEIGHT - totalWeight);
  const isRed = weightAlert === "red";
  const alertAccent = isRed ? "#E24B4A" : "#EF9F27";
  const alertBg = isRed ? "#FCEBEB" : "#FAEEDA";
  const alertTextDark = isRed ? "#501313" : "#633806";
  const alertTextMid = isRed ? "#A32D2D" : "#854F0B";
  const alertTextBadge = isRed ? "#791F1F" : "#633806";
  const dismissAlert = () => {
    setWeightAlert(null);
    setAlertDismissed(true);
  };

  return (
    <SidebarLayout title="Cargo Items > Item List">
      <ToastContainer position="top-right" autoClose={2000} />

      {showPackingModal && (
        <PackingWarningsModal
          messages={packingMessages}
          onClose={handleModalClose}
          onProceed={handleModalProceed}
        />
      )}

      {weightAlert && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 14,
              padding: "28px 28px 22px",
              width: 400,
              border: "0.5px solid #e2e8f0",
              boxShadow: "0 8px 40px rgba(0,0,0,0.16)",
              fontFamily: "inherit",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
              <div
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 10,
                  flexShrink: 0,
                  background: alertBg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 24,
                }}
              >
                {isRed ? "🚫" : "⚠️"}
              </div>
              <div>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: alertTextDark,
                    marginBottom: 2,
                  }}
                >
                  {isRed ? "Weight limit exceeded" : "Weight limit warning"}
                </div>
                <div style={{ fontSize: 12, color: alertTextMid }}>
                  20ft container · {isRed ? "over maximum capacity" : "approaching max capacity"}
                </div>
              </div>
            </div>

            <div
              style={{
                background: "#f1f5f9",
                borderRadius: 100,
                height: 10,
                overflow: "hidden",
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  width: `${Math.min(weightPct * 100, 100)}%`,
                  height: "100%",
                  borderRadius: 100,
                  background: alertAccent,
                  transition: "width 0.4s",
                }}
              />
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <span style={{ fontSize: 12, color: "#64748b" }}>
                Used <strong style={{ color: "#0f172a" }}>{totalWeight.toLocaleString()} kg</strong> of{" "}
                <strong style={{ color: "#0f172a" }}>{CONTAINER_MAX_WEIGHT.toLocaleString()} kg</strong>
              </span>
              <span
                style={{
                  borderRadius: 6,
                  padding: "3px 10px",
                  fontSize: 12,
                  fontWeight: 500,
                  background: alertBg,
                  color: alertTextBadge,
                }}
              >
                {weightPctDisp}%
              </span>
            </div>

            <div
              style={{
                padding: "12px 14px",
                marginBottom: 16,
                background: alertBg,
                borderLeft: `3px solid ${alertAccent}`,
                fontSize: 13,
                lineHeight: 1.6,
                color: alertTextDark,
              }}
            >
              In a <strong>{CONTAINER_MAX_WEIGHT.toLocaleString()} kg</strong> container, you have used{" "}
              <strong>{totalWeight.toLocaleString()} kg</strong>.{" "}
              {isRed ? (
                <>
                  You are <strong>{weightOver.toLocaleString()} kg over</strong> the maximum — reduce
                  cargo before proceeding.
                </>
              ) : (
                <>
                  Only <strong>{weightRem.toLocaleString()} kg</strong> remaining — adding more cargo
                  may exceed the limit.
                </>
              )}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 12,
                color: "#64748b",
                paddingTop: 14,
                borderTop: "0.5px solid #e2e8f0",
                marginBottom: 18,
              }}
            >
              <span>Remaining capacity</span>
              <span style={{ fontWeight: 500, color: isRed ? "#A32D2D" : "#0f172a" }}>
                {isRed ? `-${weightOver.toLocaleString()} kg` : `${weightRem.toLocaleString()} kg`}
              </span>
            </div>

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                onClick={dismissAlert}
                style={{
                  background: "transparent",
                  border: "0.5px solid #cbd5e1",
                  borderRadius: 6,
                  padding: "8px 16px",
                  fontSize: 13,
                  cursor: "pointer",
                  color: "#64748b",
                }}
              >
                Dismiss
              </button>
              <button
                onClick={dismissAlert}
                style={{
                  background: isRed ? "#A32D2D" : "#1a2a4a",
                  border: "none",
                  borderRadius: 6,
                  padding: "8px 18px",
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                  color: "#fff",
                }}
              >
                {isRed ? "Review cargo" : "Got it"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="cl-breadcrumb">
        Dashboard › Cargo Items › <span>Item List</span>
      </div>

      <div className="cl-header-row">
        <div>
          <h2 className="cl-title">Cargo Item List</h2>
        </div>
        <div className="cl-header-actions">
          <button className="cl-btn-export" onClick={handleExportCSV}>
            ⬇ Export CSV
          </button>

          <button
            className="cl-btn-add"
            onClick={() =>
              navigate("/cargo-config", {
                state: {
                  shipmentName: viewShipmentName || shipmentName || "",
                  returnShipmentName: viewShipmentName || shipmentName || "",
                  selectedContainer,
                },
              })
            }
          >
            + Add Cargo
          </button>
        </div>
      </div>

      {error && <div className="cl-error">{error}</div>}

      <div className="cl-stats-grid">
        <div className="cl-stat-card">
          <div className="cl-stat-icon" style={{ background: "#fff4e5" }}>
            📦
          </div>
          <div>
            <div className="cl-stat-val">{totalItems}</div>
            <div className="cl-stat-label">Total Items</div>
          </div>
        </div>

        <div
          className="cl-stat-card"
          style={{
            cursor: "pointer",
            borderColor:
              weightPct >= WEIGHT_CRIT_PCT
                ? "#E24B4A"
                : weightPct >= WEIGHT_WARN_PCT
                ? "#EF9F27"
                : undefined,
            transition: "border-color 0.3s",
          }}
          onClick={() => setAlertDismissed(false)}
          title="Click to view weight usage"
        >
          <div
            className="cl-stat-icon"
            style={{
              background:
                weightPct >= WEIGHT_CRIT_PCT
                  ? "#FCEBEB"
                  : weightPct >= WEIGHT_WARN_PCT
                  ? "#FAEEDA"
                  : "#e8f5e9",
            }}
          >
            ⚖️
          </div>
          <div>
            <div
              className="cl-stat-val"
              style={{
                color:
                  weightPct >= WEIGHT_CRIT_PCT
                    ? "#A32D2D"
                    : weightPct >= WEIGHT_WARN_PCT
                    ? "#854F0B"
                    : undefined,
              }}
            >
              {totalWeight.toLocaleString()} kg
            </div>
            <div className="cl-stat-label">
              Total Weight
              {weightPct >= WEIGHT_WARN_PCT && (
                <span
                  style={{
                    marginLeft: 6,
                    fontSize: 10,
                    fontWeight: 600,
                    color: weightPct >= WEIGHT_CRIT_PCT ? "#A32D2D" : "#854F0B",
                  }}
                >
                  {weightPct >= WEIGHT_CRIT_PCT ? "● OVER LIMIT" : "● NEAR LIMIT"}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="cl-stat-card">
          <div className="cl-stat-icon" style={{ background: "#e3f2fd" }}>
            📐
          </div>
          <div>
            <div className="cl-stat-val">{totalVolume.toFixed(2)} m³</div>
            <div className="cl-stat-label">Total Volume</div>
          </div>
        </div>

        <div className="cl-stat-card">
          <div className="cl-stat-icon" style={{ background: "#f3e5f5" }}>
            🔢
          </div>
          <div>
            <div className="cl-stat-val">{totalQty} pcs</div>
            <div className="cl-stat-label">Total Quantity</div>
          </div>
        </div>
      </div>

      <div
        className="cl-toolbar"
        style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}
      >
        <div className="cl-search-box" style={{ flex: 1 }}>
          <span>🔍</span>
          <input
            placeholder="Search cargo items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select className="cl-filter-select">
          <option>All Items</option>
        </select>

        <select
          className="cl-filter-select"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="name">Sort by: Name</option>
          <option value="weight">Sort by: Weight</option>
          <option value="volume">Sort by: Volume</option>
        </select>

        <button
          className="cl-btn-calculate"
          onClick={handleCalculate}
          disabled={calculating}
          style={{ marginLeft: "auto" }}
        >
          {calculating ? "Calculating..." : "⚡ Calculate"}
        </button>
      </div>

      <div className="cl-table-card">
        <div className="cl-table-header">
          <div className="cl-table-title">{tableTitle}</div>
          <div className="cl-table-sub">{filtered.length} items</div>
        </div>

        {loading ? (
          <div className="cl-loading">Loading cargo items...</div>
        ) : (
          <div className="cl-table-wrap">
            <table className="cl-table">
              <thead>
                <tr>
                  <th rowSpan="2">#</th>
                  
                  <th rowSpan="2">COLOR</th>
                  <th rowSpan="2">PRODUCT NAME</th>
                  <th rowSpan="2">TYPE</th>
                  <th colSpan="3">DIMENSIONS (CM)</th>
                  <th rowSpan="2">WEIGHT (KG)</th>
                  <th rowSpan="2">QTY</th>
                  <th rowSpan="2">TOTAL VOLUME (CM³)</th>
                  <th rowSpan="2">TOTAL WT (KG)</th>
                  <th rowSpan="2">LAYERS</th>
                  <th rowSpan="2">MAX H (CM)</th>
                  <th rowSpan="2">MAX MASS (KG)</th>
                  <th rowSpan="2">TILTABLE</th>
                  <th rowSpan="2">ROTATABLE</th>
                  <th rowSpan="2">NO STACK</th>
                  <th rowSpan="2">ACTIONS</th>
                </tr>
                <tr>
                  <th>L</th>
                  <th>W</th>
                  <th>H</th>
                </tr>
              </thead>

              <tbody>
                {!filtered.length ? (
                  <tr>
                    <td colSpan={18} style={{ textAlign: "center", padding: 32, color: "#888" }}>
                      No cargo items. Click "+ Add Cargo" to add one.
                    </td>
                  </tr>
                ) : (
                  filtered.map((item, i) => {
                    const savedBox = getSavedLayoutBox(item.product_name);

const displayLength = savedBox?.length_mm ?? item.length_mm;
const displayWidth = savedBox?.width_mm ?? item.width_mm;
const displayHeight = savedBox?.height_mm ?? item.height_mm;

const isManuallyChanged =
  savedBox &&
  (
    Number(savedBox.length_mm) !== Number(item.length_mm) ||
    Number(savedBox.width_mm) !== Number(item.width_mm) ||
    Number(savedBox.height_mm) !== Number(item.height_mm)
  );
                    const vol = (
                      (parseFloat(item.length_mm || 0) *
                        parseFloat(item.width_mm || 0) *
                        parseFloat(item.height_mm || 0) *
                        parseInt(item.quantity || 0)) /
                      1000
                    ).toLocaleString();

                    const totalWt = (
                      parseFloat(item.weight_kg || 0) * parseInt(item.quantity || 0)
                    ).toLocaleString();

                    // rotate is auto-set by packing engine and stored in DB
const isRotateYes = Boolean(
  item.rotate ||
  item.rotate_90 ||
  item.rotation ||
  isManuallyChanged
);


                    return (
                      <tr key={item.id}>
                        <td>{i + 1}</td>
                        <td>
                          <span
                            className="cl-color-dot"
                            style={{ background: item.color || "#1565c0" }}
                          />
                        </td>
                        <td style={{ fontWeight: 600 }}>{item.product_name}</td>
                        <td>{item.type || item.cargo_type || "—"}</td>
<td>{(parseFloat(displayLength || 0) / 10).toLocaleString()}</td>
<td>{(parseFloat(displayWidth || 0) / 10).toLocaleString()}</td>
<td>{(parseFloat(displayHeight || 0) / 10).toLocaleString()}</td>
                        <td>{parseFloat(item.weight_kg || 0).toLocaleString()}</td>
                        <td>{item.quantity}</td>
                        <td>{vol}</td>
                        <td>{totalWt}</td>
                        <td>{item.layers_count || 1}</td>
                        <td>
                          {item.max_height_mm
                            ? (parseFloat(item.max_height_mm) / 10).toLocaleString()
                            : "—"}
                        </td>
                        <td>{item.max_mass_kg || "—"}</td>
                        <td>
                          <span className={`cl-badge ${item.tilt_length ? "yes" : "no"}`}>
                            {item.tilt_length ? "Yes" : "No"}
                          </span>
                        </td>
                        <td>
                          <span className={`cl-badge ${isRotateYes ? "yes" : "no"}`}>
                            {isRotateYes ? "Yes" : "No"}
                          </span>
                        </td>
                        <td>
                          <span className={`cl-badge ${item.no_stack ? "yes" : "no"}`}>
                            {item.no_stack ? "Yes" : "No"}
                          </span>
                        </td>
                        <td>
                          <button
                            className="cl-action-btn"
                            onClick={() =>
                              navigate("/cargo-config", {
                                state: { editItem: item, selectedContainer },
                              })
                            }
                          >
                            — Edit
                          </button>
                          <button className="cl-action-del" onClick={() => handleDelete(item)}>
                            ✕
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="cl-pagination">
          <span>
            Showing 1–{filtered.length} of {filtered.length} items
          </span>
          <div className="cl-page-btns">
            <button className="cl-page-btn">‹</button>
            <button className="cl-page-btn active">1</button>
            <button className="cl-page-btn">›</button>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
};

export default CargoList;
