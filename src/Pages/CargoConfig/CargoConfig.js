import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { SidebarLayout } from "../../Components";
import "./CargoConfig.css";

const DRAFTS_KEY = "shipmentDrafts";
const API = "http://localhost:5000";

const defaultForm = {
  shipment_name: "",
  product_name: "",
  type: "",
  color: "#1565c0",
  length_cm: "",
  width_cm: "",
  height_cm: "",
  weight_kg: "",
  quantity: "",
  layers_count: "",
  max_height_cm: "",
  max_mass_kg: "",
  tilt_length: false,   // auto-set by engine after Calculate
  no_stack: false,
  rotate: false,        // auto-set by engine after Calculate
};

function saveDraft(form) {
  const name = (form.shipment_name || "").trim();
  if (!name) return;
  try {
    const raw = localStorage.getItem(DRAFTS_KEY);
    const drafts = raw ? JSON.parse(raw) : {};
    drafts[name.toLowerCase()] = {
      id: `draft_${name.replace(/\s+/g, "_")}`,
      name,
      status: "draft",
      item_count: parseInt(form.quantity || 0),
      created_at:
        drafts[name.toLowerCase()]?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      form,
    };
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
  } catch {}
}

function removeDraft(shipmentName) {
  if (!shipmentName) return;
  try {
    const raw = localStorage.getItem(DRAFTS_KEY);
    if (!raw) return;
    const drafts = JSON.parse(raw);
    delete drafts[shipmentName.toLowerCase()];
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
  } catch {}
}

const cmToMm = (val) => String(parseFloat(val) * 10 || 0);
const mmToCm = (val) => {
  const n = parseFloat(val);
  return isNaN(n) ? "" : String(n / 10);
};

function getShapeType(type) {
  const t = (type || "").toLowerCase();
  if (t === "sacks" || t === "jumbo bags") return "sack";
  if (t === "barrels" || t === "drums" || t === "pipes") return "cylinder";
  return "box";
}

function drawSackPreview(ctx, CW, CH, color, w, h, d) {
  const hex = color || "#1565c0";
  const r = parseInt(hex.slice(1, 3), 16),
    g = parseInt(hex.slice(3, 5), 16),
    b = parseInt(hex.slice(5, 7), 16);
  const isoX = 0.6,
    isoY = 0.35;
  const corners3D = [
    [0, 0, 0],
    [w, 0, 0],
    [w, h, 0],
    [0, h, 0],
    [0, 0, d],
    [w, 0, d],
    [w, h, d],
    [0, h, d],
  ];
  const proj = ([px, py, pz]) => [px + pz * isoX, -py + pz * isoY];
  const pts2D_raw = corners3D.map(proj);
  const xs = pts2D_raw.map((p) => p[0]),
    ys = pts2D_raw.map((p) => p[1]);
  const minX = Math.min(...xs),
    maxX = Math.max(...xs),
    minY = Math.min(...ys),
    maxY = Math.max(...ys);
  const PAD = 18,
    scale = Math.min(
      (CW - PAD * 2) / (maxX - minX),
      (CH - PAD * 2) / (maxY - minY)
    );
  const offX = CW / 2 - ((minX + maxX) / 2) * scale,
    offY = CH / 2 - ((minY + maxY) / 2) * scale;
  const pts = pts2D_raw.map(([px, py]) => [px * scale + offX, py * scale + offY]);

  const drawBulged = (p0, p1, p2, p3, light, bulge = 0.18) => {
    const lR = Math.min(255, Math.round(r * light)),
      lG = Math.min(255, Math.round(g * light)),
      lB = Math.min(255, Math.round(b * light));
    const fcx = (p0[0] + p1[0] + p2[0] + p3[0]) / 4,
      fcy = (p0[1] + p1[1] + p2[1] + p3[1]) / 4;
    const fw = Math.sqrt((p1[0] - p0[0]) ** 2 + (p1[1] - p0[1]) ** 2);
    const fh = Math.sqrt((p3[0] - p0[0]) ** 2 + (p3[1] - p0[1]) ** 2);
    const bAmt = Math.min(fw, fh) * bulge;
    const midPush = (pa, pb) => {
      const mx = (pa[0] + pb[0]) / 2,
        my = (pa[1] + pb[1]) / 2,
        dx = mx - fcx,
        dy = my - fcy,
        len = Math.sqrt(dx * dx + dy * dy) || 1;
      return [mx + (dx / len) * bAmt, my + (dy / len) * bAmt];
    };
    ctx.beginPath();
    ctx.moveTo(p0[0], p0[1]);
    ctx.quadraticCurveTo(...midPush(p0, p1), p1[0], p1[1]);
    ctx.quadraticCurveTo(...midPush(p1, p2), p2[0], p2[1]);
    ctx.quadraticCurveTo(...midPush(p2, p3), p3[0], p3[1]);
    ctx.quadraticCurveTo(...midPush(p3, p0), p0[0], p0[1]);
    ctx.closePath();
    const grd = ctx.createRadialGradient(
      fcx - bAmt * 0.3,
      fcy - bAmt * 0.3,
      bAmt * 0.1,
      fcx,
      fcy,
      bAmt * 2
    );
    grd.addColorStop(
      0,
      `rgb(${Math.min(255, lR + 45)},${Math.min(255, lG + 45)},${Math.min(
        255,
        lB + 45
      )})`
    );
    grd.addColorStop(
      1,
      `rgb(${Math.max(0, lR - 30)},${Math.max(0, lG - 30)},${Math.max(
        0,
        lB - 30
      )})`
    );
    ctx.fillStyle = grd;
    ctx.fill();
    ctx.strokeStyle = `rgba(${Math.max(0, lR - 40)},${Math.max(
      0,
      lG - 40
    )},${Math.max(0, lB - 40)},0.5)`;
    ctx.lineWidth = 1;
    ctx.stroke();
    if (light >= 1.0) {
      ctx.save();
      ctx.globalAlpha = 0.22;
      ctx.strokeStyle = `rgb(${Math.max(0, lR - 70)},${Math.max(
        0,
        lG - 70
      )},${Math.max(0, lB - 70)})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo((p0[0] + p3[0]) / 2, (p0[1] + p3[1]) / 2);
      ctx.lineTo((p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo((p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2);
      ctx.lineTo((p2[0] + p3[0]) / 2, (p2[1] + p3[1]) / 2);
      ctx.stroke();
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = `rgb(${Math.max(0, lR - 50)},${Math.max(
        0,
        lG - 50
      )},${Math.max(0, lB - 50)})`;
      ctx.beginPath();
      ctx.arc(fcx, fcy, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  };

  drawBulged(pts[4], pts[5], pts[6], pts[7], 1.05, 0.22);
  drawBulged(pts[1], pts[5], pts[6], pts[2], 0.72, 0.15);
  drawBulged(pts[7], pts[6], pts[2], pts[3], 1.0, 0.2);
}

function drawCylinderPreview(ctx, CW, CH, color, w, h, d) {
  const hex = color || "#1565c0";
  const r = parseInt(hex.slice(1, 3), 16),
    g = parseInt(hex.slice(3, 5), 16),
    b = parseInt(hex.slice(5, 7), 16);
  const cx2 = CW / 2,
    cy2 = CH / 2;
  const isHorizontal = w > h;

  if (isHorizontal) {
    const radius = Math.min(h, d) * 0.38;
    const PAD = 20;
    const bodyW = w * 0.55;
    const scale = Math.min(
      (CW - PAD * 2) / (bodyW + radius * 2),
      (CH - PAD * 2) / (radius * 2.8)
    );
    const rS = radius * scale;
    const bW = bodyW * scale;
    const ellipseRX = rS * 0.38;
    const leftX = cx2 - bW / 2;
    const rightX = cx2 + bW / 2;
    const midY = cy2;

    const bodyGrd = ctx.createLinearGradient(0, midY - rS, 0, midY + rS);
    bodyGrd.addColorStop(
      0,
      `rgb(${Math.min(255, r + 40)},${Math.min(255, g + 40)},${Math.min(
        255,
        b + 40
      )})`
    );
    bodyGrd.addColorStop(
      0.4,
      `rgb(${Math.min(255, r + 15)},${Math.min(255, g + 15)},${Math.min(
        255,
        b + 15
      )})`
    );
    bodyGrd.addColorStop(
      1,
      `rgb(${Math.max(0, r - 50)},${Math.max(0, g - 50)},${Math.max(
        0,
        b - 50
      )})`
    );

    ctx.beginPath();
    ctx.ellipse(leftX, midY, ellipseRX, rS, 0, Math.PI / 2, -Math.PI / 2);
    ctx.lineTo(rightX, midY - rS);
    ctx.ellipse(rightX, midY, ellipseRX, rS, 0, -Math.PI / 2, Math.PI / 2);
    ctx.lineTo(leftX, midY + rS);
    ctx.closePath();
    ctx.fillStyle = bodyGrd;
    ctx.fill();
    ctx.strokeStyle = `rgba(${Math.max(0, r - 60)},${Math.max(
      0,
      g - 60
    )},${Math.max(0, b - 60)},0.5)`;
    ctx.lineWidth = 1;
    ctx.stroke();

    const capGrd = ctx.createRadialGradient(
      rightX - ellipseRX * 0.3,
      midY - rS * 0.2,
      rS * 0.05,
      rightX,
      midY,
      rS
    );
    capGrd.addColorStop(
      0,
      `rgb(${Math.min(255, r + 60)},${Math.min(255, g + 60)},${Math.min(
        255,
        b + 60
      )})`
    );
    capGrd.addColorStop(1, `rgb(${r},${g},${b})`);
    ctx.beginPath();
    ctx.ellipse(rightX, midY, ellipseRX, rS, 0, 0, Math.PI * 2);
    ctx.fillStyle = capGrd;
    ctx.fill();
    ctx.strokeStyle = `rgba(${Math.max(0, r - 60)},${Math.max(
      0,
      g - 60
    )},${Math.max(0, b - 60)},0.4)`;
    ctx.stroke();
  } else {
    const radius = Math.min(w, d) * 0.35;
    const bodyH = h * 0.55;
    const PAD = 20;
    const scale = Math.min(
      (CW - PAD * 2) / (radius * 2.8),
      (CH - PAD * 2) / (bodyH + radius)
    );
    const rS = radius * scale;
    const hS = bodyH * scale;
    const ellipseRY = rS * 0.38;
    const topY = cy2 - hS / 2 - ellipseRY;
    const botY = cy2 + hS / 2;

    const grd = ctx.createLinearGradient(cx2 - rS, 0, cx2 + rS, 0);
    grd.addColorStop(
      0,
      `rgb(${Math.max(0, r - 60)},${Math.max(0, g - 60)},${Math.max(
        0,
        b - 60
      )})`
    );
    grd.addColorStop(
      0.35,
      `rgb(${Math.min(255, r + 30)},${Math.min(255, g + 30)},${Math.min(
        255,
        b + 30
      )})`
    );
    grd.addColorStop(
      1,
      `rgb(${Math.max(0, r - 40)},${Math.max(0, g - 40)},${Math.max(
        0,
        b - 40
      )})`
    );

    ctx.beginPath();
    ctx.ellipse(cx2, botY, rS, ellipseRY, 0, 0, Math.PI);
    ctx.lineTo(cx2 - rS, topY);
    ctx.ellipse(cx2, topY, rS, ellipseRY, 0, Math.PI, 0);
    ctx.closePath();
    ctx.fillStyle = grd;
    ctx.fill();
    ctx.strokeStyle = `rgba(${Math.max(0, r - 60)},${Math.max(
      0,
      g - 60
    )},${Math.max(0, b - 60)},0.6)`;
    ctx.lineWidth = 1;
    ctx.stroke();

    const topGrd = ctx.createRadialGradient(
      cx2 - rS * 0.2,
      topY - ellipseRY * 0.2,
      rS * 0.05,
      cx2,
      topY,
      rS
    );
    topGrd.addColorStop(
      0,
      `rgb(${Math.min(255, r + 60)},${Math.min(255, g + 60)},${Math.min(
        255,
        b + 60
      )})`
    );
    topGrd.addColorStop(1, `rgb(${r},${g},${b})`);
    ctx.beginPath();
    ctx.ellipse(cx2, topY, rS, ellipseRY, 0, 0, Math.PI * 2);
    ctx.fillStyle = topGrd;
    ctx.fill();
    ctx.strokeStyle = `rgba(${Math.max(0, r - 60)},${Math.max(
      0,
      g - 60
    )},${Math.max(0, b - 60)},0.4)`;
    ctx.stroke();
  }
}

function Shape3D({ color, w, h, d, type }) {
  const canvasRef = useRef(null);
  const shapeType = getShapeType(type);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const CW = canvas.width,
      CH = canvas.height;
    ctx.clearRect(0, 0, CW, CH);

    const sx = w || 80,
      sy = h || 60,
      sd = d || 50;

    if (shapeType === "sack") {
      drawSackPreview(ctx, CW, CH, color, sx, sy, sd);
      return;
    }
    if (shapeType === "cylinder") {
      drawCylinderPreview(ctx, CW, CH, color, sx, sy, sd);
      return;
    }

    const isoX = 0.6,
      isoY = 0.35;
    const corners3D = [
      [0, 0, 0],
      [sx, 0, 0],
      [sx, sy, 0],
      [0, sy, 0],
      [0, 0, sd],
      [sx, 0, sd],
      [sx, sy, sd],
      [0, sy, sd],
    ];
    const proj = ([px, py, pz]) => [px + pz * isoX, -py + pz * isoY];
    const pts2D_raw = corners3D.map(proj);
    const xs = pts2D_raw.map((p) => p[0]),
      ys = pts2D_raw.map((p) => p[1]);
    const minX = Math.min(...xs),
      maxX = Math.max(...xs),
      minY = Math.min(...ys),
      maxY = Math.max(...ys);
    const PAD = 14,
      scale = Math.min(
        (CW - PAD * 2) / (maxX - minX),
        (CH - PAD * 2) / (maxY - minY)
      );
    const offX = CW / 2 - ((minX + maxX) / 2) * scale,
      offY = CH / 2 - ((minY + maxY) / 2) * scale;
    const pts2D = pts2D_raw.map(([px, py]) => [px * scale + offX, py * scale + offY]);
    const hex = color || "#1565c0";
    const r = parseInt(hex.slice(1, 3), 16),
      g = parseInt(hex.slice(3, 5), 16),
      b = parseInt(hex.slice(5, 7), 16);

    const face = (indices, light) => {
      const lR = Math.min(255, Math.round(r * light)),
        lG = Math.min(255, Math.round(g * light)),
        lB = Math.min(255, Math.round(b * light));
      ctx.beginPath();
      ctx.moveTo(pts2D[indices[0]][0], pts2D[indices[0]][1]);
      indices.slice(1).forEach((i) => ctx.lineTo(pts2D[i][0], pts2D[i][1]));
      ctx.closePath();
      ctx.fillStyle = `rgb(${lR},${lG},${lB})`;
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.18)";
      ctx.lineWidth = 1;
      ctx.stroke();
    };

    face([0, 1, 5, 4], 1.12);
    face([1, 5, 6, 2], 0.72);
    face([0, 1, 2, 3], 1.0);
  }, [color, w, h, d, shapeType]);

  return (
    <canvas
      ref={canvasRef}
      width={220}
      height={190}
      style={{ display: "block", margin: "0 auto 18px auto" }}
    />
  );
}

const CargoConfig = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const editItem = location.state?.editItem || null;
  const isFresh = Boolean(location.state?.fresh);
  const resumeDraft = location.state?.resumeDraft || null;
  const returnShipmentName = location.state?.returnShipmentName || null;
  const passedShipmentName = location.state?.shipmentName || "";
  const isEditMode = Boolean(editItem?.id);

  const appliedStateKeyRef = useRef(null);
  const stateKey = JSON.stringify({
    fresh: isFresh,
    resume: !!resumeDraft,
    edit: editItem?.id,
  });
  const prevShipmentNameRef = useRef("");
  const formRef = useRef(defaultForm);

  const [form, setForm] = useState(() => {
    if (isFresh) {
      appliedStateKeyRef.current = stateKey;
      return {
        ...defaultForm,
        shipment_name: passedShipmentName || "",
      };
    }

    if (isEditMode && editItem) {
      appliedStateKeyRef.current = stateKey;
      return {
        ...defaultForm,
        shipment_name: editItem.shipment_name || "",
        product_name: editItem.product_name || "",
        type: editItem.type || editItem.cargo_type || "",
        color: editItem.color || "#1565c0",
        length_cm: mmToCm(editItem.length_mm),
        width_cm: mmToCm(editItem.width_mm),
        height_cm: mmToCm(editItem.height_mm),
        weight_kg: editItem.weight_kg || "",
        quantity: editItem.quantity || "",
        layers_count: editItem.layers_count || "",
        max_height_cm: mmToCm(editItem.max_height_mm),
        max_mass_kg: editItem.max_mass_kg || "",
        tilt_length: Boolean(editItem.tilt_length),
        tilt_width: Boolean(editItem.tilt_width),
        no_stack: Boolean(editItem.no_stack),
        rotate: Boolean(
          editItem.rotate ||
            editItem.rotation ||
            editItem.rotate_90 ||
            editItem.rotate_180 ||
            editItem.rotate_270
        ),
        rotate_90: Boolean(
          editItem.rotate_90 || editItem.rotate || editItem.rotation
        ),
        rotate_180: Boolean(editItem.rotate_180),
        rotate_270: Boolean(editItem.rotate_270),
      };
    }

    if (resumeDraft) {
      appliedStateKeyRef.current = stateKey;
      const f = { ...defaultForm, ...resumeDraft };
      prevShipmentNameRef.current = (f.shipment_name || "").trim();
      return f;
    }

    appliedStateKeyRef.current = stateKey;
    return {
      ...defaultForm,
      shipment_name: passedShipmentName || "",
    };
  });

const [saving, setSaving] = useState(false);
const [error, setError] = useState("");
const [showPopup, setShowPopup] = useState(false);
const [popupMessage, setPopupMessage] = useState("");
const [nameExists, setNameExists] = useState(false);

  useEffect(() => {
    if (appliedStateKeyRef.current === stateKey) return;
    appliedStateKeyRef.current = stateKey;

    if (isFresh) {
      prevShipmentNameRef.current = "";
      setForm({
        ...defaultForm,
        shipment_name: passedShipmentName || "",
      });
      return;
    }

    if (isEditMode && editItem) {
      setForm({
        ...defaultForm,
        shipment_name: editItem.shipment_name || "",
        product_name: editItem.product_name || "",
        type: editItem.type || editItem.cargo_type || "",
        color: editItem.color || "#1565c0",
        length_cm: mmToCm(editItem.length_mm),
        width_cm: mmToCm(editItem.width_mm),
        height_cm: mmToCm(editItem.height_mm),
        weight_kg: editItem.weight_kg || "",
        quantity: editItem.quantity || "",
        layers_count: editItem.layers_count || "",
        max_height_cm: mmToCm(editItem.max_height_mm),
        max_mass_kg: editItem.max_mass_kg || "",
        tilt_length: Boolean(editItem.tilt_length),
        tilt_width: Boolean(editItem.tilt_width),
        no_stack: Boolean(editItem.no_stack),
        rotate: Boolean(
          editItem.rotate ||
            editItem.rotation ||
            editItem.rotate_90 ||
            editItem.rotate_180 ||
            editItem.rotate_270
        ),
        rotate_90: Boolean(
          editItem.rotate_90 || editItem.rotate || editItem.rotation
        ),
        rotate_180: Boolean(editItem.rotate_180),
        rotate_270: Boolean(editItem.rotate_270),
      });
      return;
    }

    if (resumeDraft) {
      const f = { ...defaultForm, ...resumeDraft };
      prevShipmentNameRef.current = (f.shipment_name || "").trim();
      setForm(f);
      return;
    }

    prevShipmentNameRef.current = "";
    setForm((prev) => ({
      ...prev,
      shipment_name: passedShipmentName || "",
    }));
  }, [stateKey, isFresh, passedShipmentName, isEditMode, editItem, resumeDraft]);

  useEffect(() => {
    const qty = Number(form.quantity) || 0;
    const height = Number(form.height_cm) || 0;
    const weight = Number(form.weight_kg) || 0;

    let layers = 0,
      maxHeight = 0,
      maxMass = 0;

    if (form.no_stack) {
      layers = qty > 0 ? 1 : 0;
      maxHeight = height;
      maxMass = weight;
    } else {
      layers = qty;
      maxHeight = height * qty;
      maxMass = weight * qty;
    }

    setForm((prev) => {
      const nL = layers ? String(layers) : "";
      const nH = maxHeight ? String(maxHeight) : "";
      const nM = maxMass ? String(maxMass) : "";
      if (
        prev.layers_count === nL &&
        prev.max_height_cm === nH &&
        prev.max_mass_kg === nM
      ) {
        return prev;
      }
      return {
        ...prev,
        layers_count: nL,
        max_height_cm: nH,
        max_mass_kg: nM,
      };
    });
  }, [form.quantity, form.height_cm, form.weight_kg, form.no_stack]);

  const set = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  useEffect(() => {
    formRef.current = form;
  }, [form]);

  useEffect(() => {
    if (isEditMode || isFresh) return;
    const currentName = (form.shipment_name || "").trim();
    if (
      prevShipmentNameRef.current &&
      prevShipmentNameRef.current !== currentName
    ) {
      removeDraft(prevShipmentNameRef.current);
    }
    if (!currentName) return;
    const timer = setTimeout(() => {
      saveDraft(form);
      prevShipmentNameRef.current = currentName;
    }, 800);
    return () => clearTimeout(timer);
  }, [form, isEditMode, isFresh]);

  useEffect(() => {
    return () => {
      if (isEditMode || isFresh) return;
      const f = formRef.current;
      if (f?.shipment_name?.trim()) saveDraft(f);
    };
  }, [isEditMode, isFresh]);

  let previewLength = parseFloat(form.length_cm) || 80;
  let previewWidth = parseFloat(form.width_cm) || 50;
  let previewHeight = parseFloat(form.height_cm) || 60;

  // Tilt/rotate are determined automatically by the packing engine after Calculate.
  // Preview shows the item in its natural input orientation.

  const volume =
    form.length_cm && form.width_cm && form.height_cm
      ? (
          parseFloat(form.length_cm || 0) *
          parseFloat(form.width_cm || 0) *
          parseFloat(form.height_cm || 0) *
          parseFloat(form.quantity || 1)
        ).toLocaleString()
      : "0";

  const totalWeight =
    form.weight_kg && form.quantity
      ? (
          parseFloat(form.weight_kg || 0) * parseFloat(form.quantity || 0)
        ).toLocaleString()
      : "0";

  const CSV_COLORS = [
    "#e53935",
    "#8e24aa",
    "#1e88e5",
    "#00897b",
    "#f4511e",
    "#6d4c41",
    "#3949ab",
    "#039be5",
    "#43a047",
    "#fb8c00",
    "#d81b60",
    "#5e35b1",
    "#00acc1",
    "#7cb342",
    "#fdd835",
    "#546e7a",
    "#c0ca33",
    "#00bcd4",
    "#ff7043",
    "#ab47bc",
  ];

  const handleCSVImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!form.shipment_name?.trim()) {
      setPopupMessage("Please enter Shipment Name before importing CSV.");
      setShowPopup(true);
      event.target.value = "";
      return;
    }

    const shipmentName = form.shipment_name.trim();
    const reader = new FileReader();

    reader.onload = async (e) => {
      const text = e.target.result;
      const rows = text.trim().split("\n");

      if (rows.length < 2) {
        setPopupMessage("CSV file is empty or has no data rows");
        setShowPopup(true);
        event.target.value = "";
        return;
      }

      const headers = rows[0].split(",").map((h) => h.trim().toLowerCase());
      const getCol = (row, name) => {
        const idx = headers.indexOf(name);
        return idx !== -1 ? row[idx]?.trim() || "" : "";
      };

      const hasCmCols = headers.includes("length_cm");
      let successCount = 0,
        failCount = 0,
        colorIndex = 0;

        // Clear old shipment data before importing new CSV
try {
  await fetch(`${API}/api/cargo/shipment/${encodeURIComponent(shipmentName)}`, {
    method: "DELETE",
  });
} catch (err) {
  console.error("Failed to clear old shipment data:", err);
}

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i].split(",");
        if (row.every((c) => !c.trim())) continue;

        const qty = parseFloat(getCol(row, "quantity")) || 0;
        const noStack = getCol(row, "disable_stacking") === "true";
        const weight = parseFloat(getCol(row, "weight_kg")) || 0;

        const rawL = hasCmCols ? getCol(row, "length_cm") : getCol(row, "length_mm");
        const rawW = hasCmCols ? getCol(row, "width_cm") : getCol(row, "width_mm");
        const rawH = hasCmCols ? getCol(row, "height_cm") : getCol(row, "height_mm");

        const length_mm = hasCmCols ? parseFloat(rawL) * 10 : parseFloat(rawL);
        const width_mm = hasCmCols ? parseFloat(rawW) * 10 : parseFloat(rawW);
        const height_mm = hasCmCols ? parseFloat(rawH) * 10 : parseFloat(rawH);

        const layers = noStack ? (qty > 0 ? 1 : 0) : qty;
        const maxHeight_mm = noStack ? height_mm : height_mm * qty;
        const maxMass = noStack ? weight : weight * qty;

        const typeRaw = getCol(row, "type");
        const autoColor = CSV_COLORS[colorIndex % CSV_COLORS.length];
        colorIndex++;

        const rotateCsv =
          getCol(row, "rotate") === "true" ||
          getCol(row, "rotation") === "true" ||
          getCol(row, "rotate_90") === "true" ||
          getCol(row, "rotate_180") === "true" ||
          getCol(row, "rotate_270") === "true";

        const payload = {
          shipment_name: shipmentName,
          product_name: getCol(row, "name") || getCol(row, "product_name"),
          type: typeRaw,
          cargo_type: typeRaw,
          color: getCol(row, "color") || autoColor,
          length_mm: String(length_mm),
          width_mm: String(width_mm),
          height_mm: String(height_mm),
          weight_kg: String(weight),
          quantity: getCol(row, "quantity"),
          layers_count: String(layers),
          max_height_mm: String(maxHeight_mm),
          max_mass_kg: String(maxMass),
          tilt_length: getCol(row, "tilt_to_length") === "true",
          tilt_width: getCol(row, "tilt_to_width") === "true",
          no_stack: noStack,
          rotate: rotateCsv,
          rotation: rotateCsv,
          rotate_90: rotateCsv,
          rotate_180: false,
          rotate_270: false,
        };

        try {
          const res = await fetch(`${API}/api/cargo`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
          
          successCount++;
        } catch (err) {
          console.error(`Row ${i} failed:`, err.message);
          failCount++;
        }
      }

      removeDraft(shipmentName);
      event.target.value = "";

      setPopupMessage(
        `CSV Import Complete!\nShipment: ${shipmentName}\n✅ ${successCount} item(s) added successfully.${
          failCount > 0 ? `\n❌ ${failCount} item(s) failed.` : ""
        }`
      );
      setShowPopup(true);
    };

    reader.readAsText(file);
  };

  const handleSave = async () => {
    setError("");

    if (
      !form.shipment_name ||
      !form.product_name ||
      !form.length_cm ||
      !form.width_cm ||
      !form.height_cm ||
      !form.weight_kg ||
      !form.quantity
    ) {
      setError("Please fill all required fields");
      return;
    }

    if (isEditMode && !editItem?.id) {
      setError("Edit item ID is missing");
      return;
    }
// ✅ FIX: block saving if name matches a completed shipment
if (nameExists && !isEditMode) {
  setError("⚠ This shipment name already exists as a completed shipment. Please use a different name.");
  return;
}

setSaving(true);
    setSaving(true);

    try {
      const payload = {
        shipment_name: form.shipment_name,
        product_name: form.product_name,
        type: form.type,
        cargo_type: form.type,
        color: form.color,
        length_mm: cmToMm(form.length_cm),
        width_mm: cmToMm(form.width_cm),
        height_mm: cmToMm(form.height_cm),
        weight_kg: form.weight_kg,
        quantity: form.quantity,
        layers_count: form.layers_count,
        max_height_mm: cmToMm(form.max_height_cm),
        max_mass_kg: form.max_mass_kg,
        tilt_length: form.tilt_length,
        tilt_width: form.tilt_width,
        no_stack: form.no_stack,
        rotate: Boolean(form.rotate),
        rotation: Boolean(form.rotate),
        rotate_90: Boolean(form.rotate),
        rotate_180: false,
        rotate_270: false,
      };

      const url = isEditMode ? `${API}/api/cargo/${editItem.id}` : `${API}/api/cargo`;
      const method = isEditMode ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);

      removeDraft(form.shipment_name);
      localStorage.removeItem("cargoDraft");
      setForm({ ...defaultForm });

      navigate("/cargo-list", {
        state: {
          refreshCargoList: true,
          viewShipmentName: returnShipmentName || form.shipment_name?.trim(),
        },
      });
    } catch (err) {
      setError("Failed to save: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SidebarLayout
      title={isEditMode ? "Cargo Items > Edit Item" : "Cargo Items > Configure Item"}
    >
      <div className="cc-breadcrumb">
        Dashboard › Cargo Items › <span>{isEditMode ? "Edit Item" : "Configure Item"}</span>
      </div>

      <div className="cc-header-row">
        <div>
          <h2 className="cc-title">{isEditMode ? "Edit Cargo Item" : "Configure Cargo Item"}</h2>
          <p className="cc-subtitle"></p>
        </div>

        <div className="cc-header-actions">
          {!isEditMode && (
            <label className="cc-btn-import">
              Import CSV
              <input
                type="file"
                accept=".csv"
                onChange={handleCSVImport}
                style={{ display: "none" }}
              />
            </label>
          )}
        </div>
      </div>

      {showPopup && (
        <div className="popup-overlay">
          <div className="popup-box">
            <h3>Import Status</h3>
            <p style={{ whiteSpace: "pre-line" }}>{popupMessage}</p>
            <button
              onClick={() => {
                setShowPopup(false);
                navigate("/cargo-list", {
                  state: {
                    refreshCargoList: true,
                    viewShipmentName: returnShipmentName || form.shipment_name?.trim(),
                  },
                });
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {error && <div className="cc-error">{error}</div>}

      <div className="cc-main-card">
        <div className="cc-card-header">
          <div className="cc-card-header-left">
            <div className="cc-card-icon">📦</div>
            <div>
              <div className="cc-card-label">Cargo Configuration</div>
            </div>
          </div>
          <div className="cc-step-dots">
            <div className="cc-dot active" />
            <div className="cc-dot active" />
            <div className="cc-dot" />
          </div>
        </div>

        <div className="cc-card-body">
          <div className="cc-left-panel">
            <div className="cc-preview-label">PREVIEW</div>
            <Shape3D
              color={form.color}
              w={previewLength}
              h={previewHeight}
              d={previewWidth}
              type={form.type}
            />

            <div style={{ marginTop: "-12px" }}></div>

            <div className="cc-summary-label" style={{ marginTop: "-55px" }}>
              LIVE SUMMARY
            </div>

            <div className="cc-stat-row">
              <span className="cc-stat-key">TOTAL VOLUME</span>
              <span className="cc-stat-val">
                {volume}
                <span className="cc-stat-unit">cm³</span>
              </span>
            </div>

            <div className="cc-stat-row">
              <span className="cc-stat-key">TOTAL WEIGHT</span>
              <span className="cc-stat-val">
                {totalWeight}
                <span className="cc-stat-unit">kg</span>
              </span>
            </div>

            <div className="cc-stat-row">
              <span className="cc-stat-key">UNITS</span>
              <span className="cc-stat-val">
                {form.quantity || 0}
                <span className="cc-stat-unit">pcs</span>
              </span>
            </div>

            {/* ── AUTO PACKING RESULT ── shown after Calculate */}
            <div className="cc-orientation-label" style={{ marginTop: 14 }}>
              PACKING RESULT
            </div>
            <div style={{ fontSize:10, color:"#8899aa", marginBottom:6, lineHeight:1.4 }}>
              Set automatically after Calculate
            </div>
            <div className="cc-orient-row">
              <div><label>Tilt</label></div>
              <span style={{
                padding:"2px 10px", borderRadius:12, fontSize:11, fontWeight:600,
                background: form.tilt_length ? "#d4edda" : "#f1f5f9",
                color:      form.tilt_length ? "#155724" : "#64748b",
                border:     form.tilt_length ? "1px solid #c3e6cb" : "1px solid #e2e8f0",
              }}>
                {form.tilt_length ? "Yes" : "No"}
              </span>
            </div>
            <div className="cc-orient-row" style={{ marginTop: 8 }}>
              <div><label>Rotate</label></div>
              <span style={{
                padding:"2px 10px", borderRadius:12, fontSize:11, fontWeight:600,
                background: form.rotate ? "#d4edda" : "#f1f5f9",
                color:      form.rotate ? "#155724" : "#64748b",
                border:     form.rotate ? "1px solid #c3e6cb" : "1px solid #e2e8f0",
              }}>
                {form.rotate ? "Yes" : "No"}
              </span>
            </div>
          </div>

          <div className="cc-right-form">
            <div className="cc-section-label" style={{ marginTop: 0 }}>
              SHIPMENT NAME
            </div>
            <input
              className="cc-input"
              placeholder="Shipment Name"
              value={form.shipment_name}
onChange={(e) => {
  const val = e.target.value.toUpperCase();
  set("shipment_name", val);
  const trimmed = val.trim();
  if (!trimmed) { setNameExists(false); return; }
  // ✅ FIX: only warn for completed shipments, not drafts
  // Drafts are fine to continue — user is just adding more items
  fetch(`http://localhost:5000/api/shipments`)
    .then((r) => r.json())
    .then((data) => {
      const exists = Array.isArray(data) && data.some(
        (s) =>
          (s.name || "").trim().toUpperCase() === trimmed.toUpperCase() &&
          s.status === "completed"
      );
      setNameExists(exists);
    })
    .catch(() => setNameExists(false));
}}
style={{ marginBottom: nameExists ? "4px" : "18px", borderColor: nameExists ? "#e53935" : "" }}
            />

{nameExists && (
  <div style={{ fontSize: 12, color: "#e53935", marginBottom: 14, marginTop: 2, paddingLeft: 2 }}>
    ⚠ Shipment name already exists
  </div>
)}

<div className="cc-section-label" style={{ marginTop: 0 }}>
  PRODUCT NAME
</div>

            <div className="cc-product-row">
              <div style={{ flex: 1 }}>
                <input
                  className="cc-input"
                  placeholder="Enter product name"
                  value={form.product_name}
                  onChange={(e) => set("product_name", e.target.value)}
                  style={{ marginBottom: "10px" }}
                />

                <div
                  className="cc-section-label"
                  style={{ marginTop: 0, marginBottom: "10px", marginLeft: "60px" }}
                >
                  TYPE
                </div>

                <select
                  className="cc-input"
                  value={form.type}
                  onChange={(e) => set("type", e.target.value)}
                  style={{ color: form.type ? "#1a2744" : "#aaa" }}
                >
                  <option value="">Select Type</option>
                  <option value="Cartons">Cartons</option>
                  <option value="Crates">Crates</option>
                  <option value="Pallets">Pallets</option>
                  <option value="Jumbo Bags">Jumbo Bags</option>
                  <option value="Sacks">Sacks</option>
                  <option value="Pipes">Pipes</option>
                  <option value="Barrels">Barrels</option>
                  <option value="Loose">Loose</option>
                </select>
              </div>

              <div className="cc-color-col">
                <div className="cc-color-label">Color</div>
                <input
                  type="color"
                  className="cc-color-swatch"
                  value={form.color}
                  onChange={(e) => set("color", e.target.value)}
                />
              </div>
            </div>

            <div className="cc-section-label"></div>
            <div className="cc-stack-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
              <div className="cc-constraint-box">
                <div className="cc-constraint-header">WEIGHT</div>
                <div className="cc-constraint-body">
                  <input
                    className="cc-constraint-input"
                    type="number"
                    placeholder="0"
                    value={form.weight_kg}
                    onChange={(e) => set("weight_kg", e.target.value)}
                  />
                  <div className="cc-constraint-unit">kilograms</div>
                </div>
              </div>

              <div className="cc-constraint-box">
                <div className="cc-constraint-header">QUANTITY</div>
                <div className="cc-constraint-body">
                  <input
                    className="cc-constraint-input"
                    type="number"
                    placeholder="0"
                    value={form.quantity}
                    onChange={(e) => set("quantity", e.target.value)}
                  />
                  <div className="cc-constraint-unit">pieces</div>
                </div>
              </div>
            </div>

            <div className="cc-section-label">DIMENSIONS</div>
            <div className="cc-stack-grid">
              <div className="cc-constraint-box">
                <div className="cc-constraint-header">LENGTH</div>
                <div className="cc-constraint-body">
                  <input
                    className="cc-constraint-input"
                    type="number"
                    placeholder="0"
                    value={form.length_cm}
                    onChange={(e) => set("length_cm", e.target.value)}
                  />
                  <div className="cc-constraint-unit">centimeters</div>
                </div>
              </div>

              <div className="cc-constraint-box">
                <div className="cc-constraint-header">WIDTH</div>
                <div className="cc-constraint-body">
                  <input
                    className="cc-constraint-input"
                    type="number"
                    placeholder="0"
                    value={form.width_cm}
                    onChange={(e) => set("width_cm", e.target.value)}
                  />
                  <div className="cc-constraint-unit">centimeters</div>
                </div>
              </div>

              <div className="cc-constraint-box">
                <div className="cc-constraint-header">HEIGHT</div>
                <div className="cc-constraint-body">
                  <input
                    className="cc-constraint-input"
                    type="number"
                    placeholder="0"
                    value={form.height_cm}
                    onChange={(e) => set("height_cm", e.target.value)}
                  />
                  <div className="cc-constraint-unit">centimeters</div>
                </div>
              </div>
            </div>

            <div className="cc-section-label">STACK CONSTRAINTS</div>
            <div className="cc-stack-grid">
              <div className="cc-constraint-box">
                <div className="cc-constraint-header">LAYERS COUNT</div>
                <div className="cc-constraint-body">
                  <input
                    className="cc-constraint-input"
                    type="number"
                    value={form.layers_count}
                    readOnly
                  />
                  <div className="cc-constraint-unit">layers max</div>
                </div>
              </div>

              <div className="cc-constraint-box">
                <div className="cc-constraint-header">MAX HEIGHT</div>
                <div className="cc-constraint-body">
                  <input
                    className="cc-constraint-input"
                    type="number"
                    value={form.max_height_cm}
                    readOnly
                  />
                  <div className="cc-constraint-unit">centimeters</div>
                </div>
              </div>

              <div className="cc-constraint-box">
                <div className="cc-constraint-header">MAX MASS</div>
                <div className="cc-constraint-body">
                  <input
                    className="cc-constraint-input"
                    type="number"
                    value={form.max_mass_kg}
                    readOnly
                  />
                  <div className="cc-constraint-unit">kilograms</div>
                </div>
              </div>
            </div>

            <div className="cc-nostack-row">
              <div className="cc-nostack-left">
                <span className="cc-nostack-icon">🚫</span>
                <div>
                  <div className="cc-nostack-title">Disable Stacking</div>
                </div>
              </div>
              <label className="cc-toggle">
                <input
                  type="checkbox"
                  checked={form.no_stack}
                  onChange={(e) => set("no_stack", e.target.checked)}
                />
                <span className="cc-toggle-slider" />
              </label>
            </div>

            <div className="cc-footer">
              <button className="cc-btn-cancel" onClick={() => navigate("/shipments")}>
                Cancel
              </button>
              <button className="cc-btn-add" onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : isEditMode ? "Update Cargo →" : "Add Cargo →"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
};

export default CargoConfig;