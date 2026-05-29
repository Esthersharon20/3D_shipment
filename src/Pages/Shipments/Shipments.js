import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarLayout } from "../../Components";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Must match the key used in CargoConfig.js
const DRAFTS_KEY = "shipmentDrafts";

const Shipments = () => {
  const navigate = useNavigate();
  const [shipments, setShipments] = useState([]);
  const [localDrafts, setLocalDrafts] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [view, setView] = useState("cards");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:5000/api/shipments");
      const data = await res.json();
      setShipments(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Cannot connect to backend");
    } finally {
      setLoading(false);
    }
  };

  // Read drafts from localStorage — CargoList stores them as an array
  const loadLocalDrafts = () => {
    try {
      const raw = localStorage.getItem(DRAFTS_KEY);
      if (!raw) {
        setLocalDrafts([]);
        return;
      }
      const parsed = JSON.parse(raw);
      // Handle both array (CargoList format) and object (legacy format)
      if (Array.isArray(parsed)) {
        setLocalDrafts(parsed);
      } else {
        setLocalDrafts(Object.values(parsed));
      }
    } catch {
      setLocalDrafts([]);
    }
  };

  useEffect(() => {
    load();
    loadLocalDrafts();
  }, []);

  const handleDelete = async (id, shipmentName) => {
    const res = await fetch(`http://localhost:5000/api/shipments/${id}`, {
      method: "DELETE",
    });
    const data = await res.json();
    // Also remove any localStorage draft with the same name so it doesn't reappear
    try {
      const raw = localStorage.getItem(DRAFTS_KEY);
      if (raw) {
        const drafts = JSON.parse(raw);
        // drafts can be either an object or array — handle both
        if (Array.isArray(drafts)) {
const updated = drafts.filter(
  (d) => d.shipment_id !== id
);

          localStorage.setItem(DRAFTS_KEY, JSON.stringify(updated));
} else {
  delete drafts[id];
  localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
}
      }
    } catch {
      /* ignore */
    }
    toast.success("Shipment deleted");
    load();
    loadLocalDrafts();
  };

  const handleDeleteDraft = (draftName) => {
    try {
      const raw = localStorage.getItem(DRAFTS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const updated = parsed.filter(
          (d) =>
            (d.name || "").toLowerCase() !== (draftName || "").toLowerCase()
        );
        localStorage.setItem(DRAFTS_KEY, JSON.stringify(updated));
      } else {
        delete parsed[(draftName || "").toLowerCase()];
        localStorage.setItem(DRAFTS_KEY, JSON.stringify(parsed));
      }
      loadLocalDrafts();
      toast.success("Draft discarded");
    } catch {
      toast.error("Failed to discard draft");
    }
  };

  // Filter out local drafts whose name already has a completed DB record
// ✅ FIX 1 (backup guard): Also filter by name so a saved shipment's draft
// never shows as a second card, even if shipment_id isn't on the draft object.
const dbShipmentIds = new Set(shipments.map((s) => s.shipment_id).filter(Boolean));
const dbShipmentNames = new Set(
  shipments.map((s) => (s.name || "").toLowerCase().trim()).filter(Boolean)
);
const filteredLocalDrafts = localDrafts.filter(
  (d) =>
    !dbShipmentIds.has(d.shipment_id) &&
    !dbShipmentNames.has((d.name || "").toLowerCase().trim())
);

  // Combine: DB shipments first, then local-only drafts
  const allShipments = [
    ...shipments,
    ...filteredLocalDrafts.map((d) => ({
      id: d.id,
      name: d.name,
      status: "draft",
      item_count: d.item_count || 0,
      container_count: 0,
      calc_time_s: 0,
      created_at: d.created_at,
      _isLocalDraft: true,
      _draftForm: d.form,
      _draftName: d.name,
    })),
  ];

  const filtered = allShipments.filter((s) => {
    const matchSearch = (s.name || "")
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchFilter = filter === "all" || s.status === filter;
    return matchSearch && matchFilter;
  });

  const formatDate = (ts) => {
    if (!ts) return "";
    const d = new Date(ts);
    return (
      d.toLocaleDateString("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }) +
      " " +
      d.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    );
  };

  const shortId = (id) => (id ? String(id).substring(0, 15) + "..." : "");
  const copyId = (id) => {
    navigator.clipboard.writeText(id);
    toast.success("ID copied!");
  };

  // View completed shipment → cargo list (read-only context)
  const handleView = (s) => {
    navigate("/cargo-list", { state: { viewShipmentName: s.name } });
  };

  // Resume a local draft → cargo-config pre-filled with saved form data
const handleResumeDraft = (s) => {
  navigate("/cargo-list", {
    state: {
      viewShipmentName: s.name,
    },
  });
};

  // Edit completed shipment → cargo-config for that shipment name
const handleEdit = (s) => {
  navigate("/cargo-list", {
    state: {
      viewShipmentName: s.name,
    },
  });
};

  return (
    <SidebarLayout title="Shipments">
      <ToastContainer position="top-right" autoClose={2000} />

      {/* Header */}
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: "20px 28px",
          marginBottom: 24,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          border: "1px solid #e8e8e8",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 52,
              height: 52,
              background: "#1565c0",
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 26,
            }}
          >
            🚢
          </div>
          <div
            style={{ fontWeight: 700, fontSize: 22, color: "#1a1a1a" }}
          >
            Your Shipments
          </div>
        </div>
        {/* IMPORTANT: fresh:true tells CargoConfig to NOT restore any old draft */}
        <button
          onClick={() => navigate("/cargo-config", { state: { fresh: true } })}
          style={{
            background: "#1565c0",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "11px 22px",
            fontWeight: 600,
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          + New Shipment
        </button>
      </div>

      {/* Search */}
      <div
        style={{
          background: "#fff",
          borderRadius: 10,
          padding: "10px 16px",
          marginBottom: 16,
          border: "1px solid #e0e0e0",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <span style={{ color: "#aaa" }}>🔍</span>
        <input
          placeholder="Search shipments..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            border: "none",
            outline: "none",
            fontSize: 14,
            color: "#333",
            background: "transparent",
          }}
        />
      </div>

      {/* Filter + View toggle */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 24 }}>
        {[{ key: "all", label: "All" }, { key: "completed", label: "Completed" }, { key: "draft", label: "Draft" }].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{
              padding: "7px 20px",
              borderRadius: 7,
              border: "1px solid #ddd",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 13,
              background: filter === f.key ? "#1565c0" : "#fff",
              color: filter === f.key ? "#fff" : "#555",
            }}
          >
            {f.label}
          </button>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
          {[{ key: "cards", label: "⊞ Cards" }, { key: "table", label: "☰ Table" }].map((v) => (
            <button
              key={v.key}
              onClick={() => setView(v.key)}
              style={{
                padding: "7px 16px",
                borderRadius: 7,
                border: "1px solid #ddd",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 13,
                background: view === v.key ? "#1565c0" : "#fff",
                color: view === v.key ? "#fff" : "#555",
              }}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 80, color: "#aaa" }}>
          Loading shipments...
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: 80, color: "#aaa" }}>
          No shipments yet. Click <strong>+ New Shipment</strong> to create one.
        </div>
      ) : view === "cards" ? (
        /* ── Cards view ── */
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(310px, 1fr))",
            gap: 18,
          }}
        >
          {filtered.map((s) => (
            <div
              key={s.id}
              onClick={() => {
                if (s._isLocalDraft) handleResumeDraft(s);
              }}
              style={{
                background: "#fff",
                borderRadius: 12,
                border: "1px solid #e8e8e8",
                overflow: "hidden",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                cursor: s._isLocalDraft ? "pointer" : "default",
              }}
            >
              <div
                style={{
                  height: 5,
                  background: s.status === "completed" ? "#4caf50" : "#ff9800",
                }}
              />
              <div style={{ padding: "18px 20px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 12,
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: 17 }}>{s.name}</div>
                  <div style={{ display: "flex", gap: 10 }}>
                    {s._isLocalDraft ? (
                      <span
                        title="Resume Draft"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleResumeDraft(s);
                        }}
                        style={{
                          cursor: "pointer",
                          color: "#ff9800",
                          fontSize: 16,
                        }}
                      >
                        ✏️
                      </span>
                    ) : (
                      <>
                        <span
                          title="View"
                          onClick={() => handleView(s)}
                          style={{ cursor: "pointer", color: "#aaa", fontSize: 16 }}
                        >
                          👁
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {s._isLocalDraft ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 18,
                      fontSize: 12,
                      color: "#ff9800",
                      fontWeight: 600,
                    }}
                  >
                    ⏳ Unsaved Draft — click ✏️ to resume
                  </div>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 18,
                      fontSize: 12,
                      color: "#888",
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>ID</span>
                    <span
                      style={{
                        fontFamily: "monospace",
                        background: "#f5f5f5",
                        padding: "3px 8px",
                        borderRadius: 5,
                        color: "#555",
                      }}
                    >
                      {shortId(s.id)}
                    </span>
                    <span
                      onClick={() => copyId(s.id)}
                      style={{ cursor: "pointer", color: "#aaa" }}
                    >
                      📋
                    </span>
                  </div>
                )}

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    borderTop: "1px solid #f0f0f0",
                    borderBottom: "1px solid #f0f0f0",
                    padding: "14px 0",
                    marginBottom: 14,
                  }}
                >
                  {[
                    { val: s.item_count, label: "Items" },
                    { val: s.container_count, label: "Containers" },
                    { val: parseFloat(s.calc_time_s || 0).toFixed(2), label: "Calc Time (S)" },
                  ].map((stat, i) => (
                    <React.Fragment key={stat.label}>
                      {i > 0 && <div style={{ width: 1, background: "#f0f0f0" }} />}
                      <div style={{ textAlign: "center", flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 20 }}>{stat.val}</div>
                        <div
                          style={{
                            fontSize: 10,
                            color: "#aaa",
                            textTransform: "uppercase",
                            letterSpacing: 0.5,
                            marginTop: 2,
                          }}
                        >
                          {stat.label}
                        </div>
                      </div>
                    </React.Fragment>
                  ))}
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      color: s.status === "completed" ? "#4caf50" : "#ff9800",
                      fontWeight: 600,
                      fontSize: 13,
                    }}
                  >
                    {s.status === "completed" ? "✓ Complete" : "⏳ Draft"}
                  </span>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ color: "#bbb", fontSize: 12 }}>
                      {formatDate(s.created_at)}
                    </span>
                    {s._isLocalDraft ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteDraft(s._draftName);
                        }}
                        style={{
                          background: "#ffebee",
                          color: "#e53935",
                          border: "none",
                          borderRadius: 6,
                          padding: "4px 10px",
                          cursor: "pointer",
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                      >
                        Discard
                      </button>
                    ) : (
                      <button
                        onClick={() => handleDelete(s.id, s.name)}
                        style={{
                          background: "#ffebee",
                          color: "#e53935",
                          border: "none",
                          borderRadius: 6,
                          padding: "4px 10px",
                          cursor: "pointer",
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ── Table view ── */
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            border: "1px solid #e8e8e8",
            overflow: "hidden",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ background: "#f8f9fa" }}>
                {["Name", "ID", "Items", "Containers", "Calc Time", "Status", "Created", "Actions"].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "13px 16px",
                      textAlign: "left",
                      fontWeight: 600,
                      color: "#666",
                      borderBottom: "1px solid #e8e8e8",
                      fontSize: 13,
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} style={{ borderBottom: "1px solid #f5f5f5" }}>
                  <td style={{ padding: "13px 16px", fontWeight: 600 }}>{s.name}</td>
                  <td style={{ padding: "13px 16px" }}>
                    {s._isLocalDraft ? (
                      <span style={{ fontSize: 12, color: "#ff9800", fontWeight: 600 }}>
                        Local Draft
                      </span>
                    ) : (
                      <>
                        <span
                          style={{
                            fontFamily: "monospace",
                            fontSize: 12,
                            color: "#666",
                            background: "#f5f5f5",
                            padding: "2px 7px",
                            borderRadius: 4,
                          }}
                        >
                          {shortId(s.id)}
                        </span>
                        <span
                          onClick={() => copyId(s.id)}
                          style={{ cursor: "pointer", marginLeft: 6, color: "#aaa" }}
                        >
                          📋
                        </span>
                      </>
                    )}
                  </td>
                  <td style={{ padding: "13px 16px" }}>{s.item_count}</td>
                  <td style={{ padding: "13px 16px" }}>{s.container_count}</td>
                  <td style={{ padding: "13px 16px" }}>
                    {parseFloat(s.calc_time_s || 0).toFixed(2)}s
                  </td>
                  <td style={{ padding: "13px 16px" }}>
                    <span
                      style={{
                        color: s.status === "completed" ? "#4caf50" : "#ff9800",
                        fontWeight: 600,
                      }}
                    >
                      {s.status === "completed" ? "✓ Complete" : "⏳ Draft"}
                    </span>
                  </td>
                  <td style={{ padding: "13px 16px", color: "#aaa", fontSize: 12 }}>
                    {formatDate(s.created_at)}
                  </td>
                  <td style={{ padding: "13px 16px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      {s._isLocalDraft ? (
                        <>
                          <button
                            onClick={() => handleResumeDraft(s)}
                            style={{
                              background: "#fff8e1",
                              color: "#f57f17",
                              border: "none",
                              borderRadius: 6,
                              padding: "5px 12px",
                              cursor: "pointer",
                              fontSize: 12,
                              fontWeight: 600,
                            }}
                          >
                            Resume
                          </button>
                          <button
                            onClick={() => handleDeleteDraft(s._draftName)}
                            style={{
                              background: "#ffebee",
                              color: "#e53935",
                              border: "none",
                              borderRadius: 6,
                              padding: "5px 12px",
                              cursor: "pointer",
                              fontSize: 12,
                              fontWeight: 600,
                            }}
                          >
                            Discard
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleView(s)}
                            style={{
                              background: "#e3f2fd",
                              color: "#1565c0",
                              border: "none",
                              borderRadius: 6,
                              padding: "5px 12px",
                              cursor: "pointer",
                              fontSize: 12,
                              fontWeight: 600,
                            }}
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleEdit(s)}
                            style={{
                              background: "#f3e5f5",
                              color: "#7b1fa2",
                              border: "none",
                              borderRadius: 6,
                              padding: "5px 12px",
                              cursor: "pointer",
                              fontSize: 12,
                              fontWeight: 600,
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(s.id, s.name)}
                            style={{
                              background: "#ffebee",
                              color: "#e53935",
                              border: "none",
                              borderRadius: 6,
                              padding: "5px 12px",
                              cursor: "pointer",
                              fontSize: 12,
                              fontWeight: 600,
                            }}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SidebarLayout>
  );
};

export default Shipments;