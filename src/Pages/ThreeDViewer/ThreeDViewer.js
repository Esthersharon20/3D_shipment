// import React, { useEffect, useRef, useState } from "react";
// import { useLocation, useNavigate } from "react-router-dom";


// function hexToRgb(hex) {
//   if (!hex || typeof hex !== "string" || !hex.startsWith("#")) {
//     return { r: 21, g: 101, b: 192 };
//   }
//   const h = hex.replace("#", "");
//   if (h.length !== 6) return { r: 21, g: 101, b: 192 };
//   return {
//     r: parseInt(h.slice(0, 2), 16) || 21,
//     g: parseInt(h.slice(2, 4), 16) || 101,
//     b: parseInt(h.slice(4, 6), 16) || 192,
//   };
// }

// function to3D(x, y, z, angleY, angleX) {
//   const x1 = x * Math.cos(angleY) + z * Math.sin(angleY);
//   const z1 = -x * Math.sin(angleY) + z * Math.cos(angleY);
//   const y2 = y * Math.cos(angleX) - z1 * Math.sin(angleX);
//   const z2 = y * Math.sin(angleX) + z1 * Math.cos(angleX);
//   return [x1, y2, z2];
// }

// function project(tx, ty, tz, scale, cx, cy) {
//   return [cx + tx * scale, cy - ty * scale];
// }

// function faceCenterDepth(pts3D, indices) {
//   let z = 0;
//   indices.forEach((i) => { z += pts3D[i][2]; });
//   return z / indices.length;
// }

// function getShapeType(cargoType) {
//   const t = (cargoType || "").toLowerCase();
//   if (t === "sacks" || t === "jumbo bags" || t === "rice sack" || t === "rice sacks") return "sack";
//   if (t === "barrels" || t === "drums" || t === "pipes") return "cylinder";
//   return "box";
// }

// // ── CUBOID ────────────────────────────────────────────────────────────────────
// function drawCuboid(ctx, x, y, z, w, h, d, rgb, angleY, angleX, scale, cx, cy, alpha = 1, boxIndex = 0) {
//   const rawCorners = [
//     [x, y, z], [x + w, y, z], [x + w, y + h, z], [x, y + h, z],
//     [x, y, z + d], [x + w, y, z + d], [x + w, y + h, z + d], [x, y + h, z + d],
//   ];
//   const pts3D = rawCorners.map(([px, py, pz]) => to3D(px, py, pz, angleY, angleX));
//   const pts2D = pts3D.map(([tx, ty, tz]) => project(tx, ty, tz, scale, cx, cy));
//   const boxDepth = pts3D.reduce((sum, p) => sum + p[2], 0) / pts3D.length;
//   const faces = [
//     { pts: [0, 1, 2, 3], bright: 0.65, faceIndex: 0 },
//     { pts: [4, 5, 6, 7], bright: 0.85, faceIndex: 1 },
//     { pts: [0, 4, 7, 3], bright: 0.7, faceIndex: 2 },
//     { pts: [1, 5, 6, 2], bright: 0.8, faceIndex: 3 },
//     { pts: [0, 1, 5, 4], bright: 0.55, faceIndex: 4 },
//     { pts: [3, 2, 6, 7], bright: 1.0, faceIndex: 5 },
//   ];
//   const sorted = faces
//     .map((f) => ({ ...f, depth: faceCenterDepth(pts3D, f.pts), boxDepth, boxIndex }))
//     .sort((a, b) => {
//       const dz = a.depth - b.depth;
//       if (Math.abs(dz) > 0.1) return dz;
//       const db = a.boxDepth - b.boxDepth;
//       if (Math.abs(db) > 0.1) return db;
//       const di = a.boxIndex - b.boxIndex;
//       if (di !== 0) return di;
//       return a.faceIndex - b.faceIndex;
//     });
//   sorted.forEach(({ pts, bright }) => {
//     const r = Math.min(255, Math.round(rgb.r * bright));
//     const g = Math.min(255, Math.round(rgb.g * bright));
//     const b2 = Math.min(255, Math.round(rgb.b * bright));
//     ctx.beginPath();
//     ctx.moveTo(pts2D[pts[0]][0], pts2D[pts[0]][1]);
//     for (let i = 1; i < pts.length; i++) ctx.lineTo(pts2D[pts[i]][0], pts2D[pts[i]][1]);
//     ctx.closePath();
//     ctx.fillStyle = alpha < 1 ? `rgba(${r},${g},${b2},${alpha})` : `rgb(${r},${g},${b2})`;
//     ctx.fill();
//     const er = Math.max(0, r - 25), eg = Math.max(0, g - 25), eb = Math.max(0, b2 - 25);
//     ctx.strokeStyle = alpha < 1 ? `rgba(${er},${eg},${eb},${alpha})` : `rgb(${er},${eg},${eb})`;
//     ctx.lineWidth = 1;
//     ctx.stroke();
//   });
// }

// // ── SACK — realistic burlap sack look with bulgy pillow body and tied top ─────
// function drawSack(ctx, x, y, z, w, h, d, rgb, angleY, angleX, scale, cx, cy) {
//   const { r, g, b } = rgb;

//   // Shrink the bounding box slightly inward so the sack sits ON the floor
//   // instead of floating — the bulge visually lifts it otherwise
//   const inset = Math.min(w, d) * 0.04;
//   const sx = x + inset, sz = z + inset;
//   const sw = w - inset * 2, sd = d - inset * 2;

//   const rawCorners = [
//     [sx,      y,     sz    ], [sx + sw, y,     sz    ],
//     [sx + sw, y + h, sz    ], [sx,      y + h, sz    ],
//     [sx,      y,     sz + sd], [sx + sw, y,     sz + sd],
//     [sx + sw, y + h, sz + sd], [sx,      y + h, sz + sd],
//   ];
//   const pts3D = rawCorners.map(([px, py, pz]) => to3D(px, py, pz, angleY, angleX));
//   const pts2D = pts3D.map(([tx, ty, tz]) => project(tx, ty, tz, scale, cx, cy));

//   const faceDefs = [
//     { indices: [4, 5, 6, 7], bright: 0.85 }, // front
//     { indices: [1, 5, 6, 2], bright: 0.75 }, // right
//     { indices: [3, 2, 6, 7], bright: 1.0  }, // top
//     { indices: [0, 1, 2, 3], bright: 0.6  }, // back
//     { indices: [0, 4, 7, 3], bright: 0.7  }, // left
//     { indices: [0, 1, 5, 4], bright: 0.5  }, // bottom
//   ];

//   const sorted = faceDefs
//     .map((f) => ({ ...f, depth: faceCenterDepth(pts3D, f.indices) }))
//     .sort((a, b) => a.depth - b.depth);

//   sorted.forEach(({ indices, bright }) => {
//     const [p0, p1, p2, p3] = indices.map((i) => pts2D[i]);
//     const lR = Math.min(255, Math.round(r * bright));
//     const lG = Math.min(255, Math.round(g * bright));
//     const lB = Math.min(255, Math.round(b * bright));

//     const fcx = (p0[0] + p1[0] + p2[0] + p3[0]) / 4;
//     const fcy = (p0[1] + p1[1] + p2[1] + p3[1]) / 4;

//     // Compute face dimensions for bulge amount
//     const faceW = Math.sqrt((p1[0]-p0[0])**2 + (p1[1]-p0[1])**2);
//     const faceH = Math.sqrt((p3[0]-p0[0])**2 + (p3[1]-p0[1])**2);
//     // Large bulge — 22% of the smaller face dimension — pushed outward
//     const bulgeAmt = Math.min(faceW, faceH) * 0.22;

//     // Outward control point: mid-edge pushed away from face center
//     const outCtrl = (pa, pb) => {
//       const mx = (pa[0] + pb[0]) / 2;
//       const my = (pa[1] + pb[1]) / 2;
//       const dx = mx - fcx;
//       const dy = my - fcy;
//       const len = Math.sqrt(dx * dx + dy * dy) || 1;
//       return [mx + (dx / len) * bulgeAmt, my + (dy / len) * bulgeAmt];
//     };

//     // Draw bulged quad using quadratic bezier on each edge
//     ctx.beginPath();
//     ctx.moveTo(p0[0], p0[1]);
//     ctx.quadraticCurveTo(...outCtrl(p0, p1), p1[0], p1[1]);
//     ctx.quadraticCurveTo(...outCtrl(p1, p2), p2[0], p2[1]);
//     ctx.quadraticCurveTo(...outCtrl(p2, p3), p3[0], p3[1]);
//     ctx.quadraticCurveTo(...outCtrl(p3, p0), p0[0], p0[1]);
//     ctx.closePath();

//     // Radial gradient for fabric lighting
//     const grd = ctx.createRadialGradient(
//       fcx - bulgeAmt * 0.4, fcy - bulgeAmt * 0.4, bulgeAmt * 0.1,
//       fcx, fcy, Math.max(faceW, faceH) * 0.75
//     );
//     grd.addColorStop(0,   `rgb(${Math.min(255, lR + 55)},${Math.min(255, lG + 55)},${Math.min(255, lB + 55)})`);
//     grd.addColorStop(0.5, `rgb(${lR},${lG},${lB})`);
//     grd.addColorStop(1,   `rgb(${Math.max(0, lR - 45)},${Math.max(0, lG - 45)},${Math.max(0, lB - 45)})`);

//     ctx.fillStyle = grd;
//     ctx.fill();

//     // Fabric texture: stitching lines
//     ctx.save();
//     ctx.clip(); // clip to sack face shape

//     // Cross-stitch seam lines
//     ctx.globalAlpha = 0.18;
//     ctx.strokeStyle = `rgb(${Math.max(0, lR - 60)},${Math.max(0, lG - 60)},${Math.max(0, lB - 60)})`;
//     ctx.lineWidth = 1.0;
//     ctx.setLineDash([3, 4]);

//     // Vertical seam
//     ctx.beginPath();
//     ctx.moveTo((p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2);
//     ctx.lineTo((p3[0] + p2[0]) / 2, (p3[1] + p2[1]) / 2);
//     ctx.stroke();

//     // Horizontal seam
//     ctx.beginPath();
//     ctx.moveTo((p0[0] + p3[0]) / 2, (p0[1] + p3[1]) / 2);
//     ctx.lineTo((p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2);
//     ctx.stroke();

//     ctx.setLineDash([]);
//     ctx.restore();

//     // Outline
//     ctx.beginPath();
//     ctx.moveTo(p0[0], p0[1]);
//     ctx.quadraticCurveTo(...outCtrl(p0, p1), p1[0], p1[1]);
//     ctx.quadraticCurveTo(...outCtrl(p1, p2), p2[0], p2[1]);
//     ctx.quadraticCurveTo(...outCtrl(p2, p3), p3[0], p3[1]);
//     ctx.quadraticCurveTo(...outCtrl(p3, p0), p0[0], p0[1]);
//     ctx.closePath();
//     ctx.strokeStyle = `rgb(${Math.max(0, lR - 35)},${Math.max(0, lG - 35)},${Math.max(0, lB - 35)})`;
//     ctx.lineWidth = 1.0;
//     ctx.stroke();

//     // Tied top knot on the top face (brightest face)
//     if (bright >= 1.0) {
//       // Draw a small knot/tie at the top center of the top face
//       const kx = fcx;
//       const ky = fcy - faceH * 0.25;
//       const kr = Math.min(faceW, faceH) * 0.08;

//       ctx.save();
//       ctx.globalAlpha = 0.55;

//       // Knot circle
//       const kGrd = ctx.createRadialGradient(kx - kr*0.3, ky - kr*0.3, kr*0.1, kx, ky, kr);
//       kGrd.addColorStop(0, `rgb(${Math.min(255, lR + 40)},${Math.min(255, lG + 40)},${Math.min(255, lB + 40)})`);
//       kGrd.addColorStop(1, `rgb(${Math.max(0, lR - 50)},${Math.max(0, lG - 50)},${Math.max(0, lB - 50)})`);
//       ctx.beginPath();
//       ctx.arc(kx, ky, kr, 0, Math.PI * 2);
//       ctx.fillStyle = kGrd;
//       ctx.fill();
//       ctx.strokeStyle = `rgb(${Math.max(0, lR - 60)},${Math.max(0, lG - 60)},${Math.max(0, lB - 60)})`;
//       ctx.lineWidth = 0.8;
//       ctx.stroke();

//       // Two bunny-ear loops above knot
//       ctx.strokeStyle = `rgb(${Math.max(0, lR - 40)},${Math.max(0, lG - 40)},${Math.max(0, lB - 40)})`;
//       ctx.lineWidth = 1.5;
//       ctx.beginPath();
//       ctx.ellipse(kx - kr * 0.8, ky - kr * 1.2, kr * 0.5, kr * 1.0, -0.4, 0, Math.PI * 2);
//       ctx.stroke();
//       ctx.beginPath();
//       ctx.ellipse(kx + kr * 0.8, ky - kr * 1.2, kr * 0.5, kr * 1.0, 0.4, 0, Math.PI * 2);
//       ctx.stroke();

//       ctx.restore();
//     }
//   });
// }

// function drawSackFlat(ctx, box, rgb, view, scale, cx, cy) {
//   const { x, y, z, w, h, d } = box;
//   const { r, g, b } = rgb;
//   let left = 0, top = 0, width = 0, height = 0;
//   if (view === "Side") { left = z; top = y; width = d; height = h; }
//   else if (view === "Front") { left = x; top = y; width = w; height = h; }
//   else if (view === "Top") { left = x; top = z; width = w; height = d; }
//   const inset = 10;
//   left += inset; top += inset;
//   width = Math.max(6, width - inset * 2);
//   height = Math.max(6, height - inset * 2);
//   const [x1, y1] = project(left, top, 0, scale, cx, cy);
//   const [x2, y2] = project(left + width, top + height, 0, scale, cx, cy);
//   const drawX = Math.min(x1, x2), drawY = Math.min(y1, y2);
//   const drawW = Math.abs(x2 - x1), drawH = Math.abs(y2 - y1);

//   // Draw as a rounded rectangle with bulge (sack silhouette)
//   const bulge = Math.min(drawW, drawH) * 0.18;
//   const fcx2 = drawX + drawW / 2;
//   const fcy2 = drawY + drawH / 2;

//   const p0 = [drawX, drawY];
//   const p1 = [drawX + drawW, drawY];
//   const p2 = [drawX + drawW, drawY + drawH];
//   const p3 = [drawX, drawY + drawH];

//   const outCtrl = (pa, pb) => {
//     const mx = (pa[0] + pb[0]) / 2;
//     const my = (pa[1] + pb[1]) / 2;
//     const dx = mx - fcx2; const dy = my - fcy2;
//     const len = Math.sqrt(dx*dx + dy*dy) || 1;
//     return [mx + (dx/len)*bulge, my + (dy/len)*bulge];
//   };

//   const grd = ctx.createRadialGradient(fcx2 - drawW*0.2, fcy2 - drawH*0.2, Math.min(drawW, drawH)*0.05, fcx2, fcy2, Math.max(drawW, drawH)*0.7);
//   grd.addColorStop(0, `rgb(${Math.min(255, r + 55)},${Math.min(255, g + 55)},${Math.min(255, b + 55)})`);
//   grd.addColorStop(0.55, `rgb(${r},${g},${b})`);
//   grd.addColorStop(1, `rgb(${Math.max(0, r - 45)},${Math.max(0, g - 45)},${Math.max(0, b - 45)})`);

//   ctx.beginPath();
//   ctx.moveTo(p0[0], p0[1]);
//   ctx.quadraticCurveTo(...outCtrl(p0, p1), p1[0], p1[1]);
//   ctx.quadraticCurveTo(...outCtrl(p1, p2), p2[0], p2[1]);
//   ctx.quadraticCurveTo(...outCtrl(p2, p3), p3[0], p3[1]);
//   ctx.quadraticCurveTo(...outCtrl(p3, p0), p0[0], p0[1]);
//   ctx.closePath();
//   ctx.fillStyle = grd;
//   ctx.fill();
//   ctx.strokeStyle = `rgb(${Math.max(0, r - 30)},${Math.max(0, g - 30)},${Math.max(0, b - 30)})`;
//   ctx.lineWidth = 1;
//   ctx.stroke();
// }

// // ── CYLINDER — proper circular cross-section pipes ────────────────────────────
// // Strategy: use equal radius = min(h,d)/2 for the circular cross-section
// // but generate points in 3D world-space so projection is consistent.
// // The cylinder axis runs along X (length w). Each ring has uniform radius.
// function drawCylinder(ctx, x, y, z, w, h, d, rgb, angleY, angleX, scale, cx, cy) {
//   const { r, g, b } = rgb;
//   const segments = 32;

//   // Use equal radius so it's a true circle, not an ellipse
//   // The cross-section circle has radius = min(h,d)/2 centered in the h×d bounding box
//   const radius = Math.min(h, d) / 2;
//   const centerY = y + h / 2;
//   const centerZ = z + d / 2;

//   // Generate ring points for left cap (x) and right cap (x+w)
//   const leftPts3D = [];
//   const rightPts3D = [];

//   for (let i = 0; i < segments; i++) {
//     const angle = (i / segments) * Math.PI * 2;
//     // IMPORTANT: use equal radius for both Y and Z to get circles, not ellipses
//     const py = centerY + Math.cos(angle) * radius;
//     const pz = centerZ + Math.sin(angle) * radius;
//     leftPts3D.push(to3D(x,     py, pz, angleY, angleX));
//     rightPts3D.push(to3D(x + w, py, pz, angleY, angleX));
//   }

//   const leftPts2D  = leftPts3D.map((p)  => project(...p, scale, cx, cy));
//   const rightPts2D = rightPts3D.map((p) => project(...p, scale, cx, cy));
//   const leftDepth  = leftPts3D.reduce((sum, p)  => sum + p[2], 0) / segments;
//   const rightDepth = rightPts3D.reduce((sum, p) => sum + p[2], 0) / segments;

//   // Center points in 3D for cap gradients
//   const leftCenter3D  = to3D(x,     centerY, centerZ, angleY, angleX);
//   const rightCenter3D = to3D(x + w, centerY, centerZ, angleY, angleX);
//   const leftCenter2D  = project(...leftCenter3D,  scale, cx, cy);
//   const rightCenter2D = project(...rightCenter3D, scale, cx, cy);

//   // Lateral surface: draw quads between consecutive ring segments
//   // Sort by depth for correct overlap
//   const quads = [];
//   for (let i = 0; i < segments; i++) {
//     const ni = (i + 1) % segments;
//     // Normal direction: outward from axis
//     const angle = ((i + 0.5) / segments) * Math.PI * 2;
//     // Lighting: simulate light from upper-left
//     const nx = 0;
//     const ny = Math.cos(angle);
//     const nz = Math.sin(angle);
//     // Rotate normal same as geometry
//     const [rnx, rny] = [
//       nx * Math.cos(angleY) + nz * Math.sin(angleY),
//       ny * Math.cos(angleX) - nz * Math.sin(angleX),
//     ];
//     const bright = Math.max(0.30, Math.min(1.1, 0.65 + 0.5 * rny + 0.2 * rnx));

//     const avgDepth = (
//       leftPts3D[i][2] + leftPts3D[ni][2] +
//       rightPts3D[i][2] + rightPts3D[ni][2]
//     ) / 4;

//     quads.push({ i, ni, bright, depth: avgDepth });
//   }

//   // Draw back-to-front
//   quads.sort((a, b) => a.depth - b.depth);

//   quads.forEach(({ i, ni, bright }) => {
//     const lR = Math.min(255, Math.round(r * bright));
//     const lG = Math.min(255, Math.round(g * bright));
//     const lB = Math.min(255, Math.round(b * bright));
//     ctx.beginPath();
//     ctx.moveTo(leftPts2D[i][0],   leftPts2D[i][1]);
//     ctx.lineTo(leftPts2D[ni][0],  leftPts2D[ni][1]);
//     ctx.lineTo(rightPts2D[ni][0], rightPts2D[ni][1]);
//     ctx.lineTo(rightPts2D[i][0],  rightPts2D[i][1]);
//     ctx.closePath();
//     ctx.fillStyle = `rgb(${lR},${lG},${lB})`;
//     ctx.fill();
//     ctx.strokeStyle = `rgba(${Math.max(0, lR - 15)},${Math.max(0, lG - 15)},${Math.max(0, lB - 15)},0.25)`;
//     ctx.lineWidth = 0.3;
//     ctx.stroke();
//   });

//   // Draw cap that faces the viewer (higher depth = closer)
//   const drawCap = (pts2D, center2D, isRight) => {
//     const screenRadius = radius * scale;
//     const grd = ctx.createRadialGradient(
//       center2D[0] - screenRadius * 0.35,
//       center2D[1] - screenRadius * 0.35,
//       screenRadius * 0.05,
//       center2D[0], center2D[1],
//       screenRadius * 1.05
//     );
//     const highlight = isRight ? 80 : 35;
//     const shadow    = isRight ? 15 : 50;
//     grd.addColorStop(0, `rgb(${Math.min(255, r + highlight)},${Math.min(255, g + highlight)},${Math.min(255, b + highlight)})`);
//     grd.addColorStop(0.6, `rgb(${r},${g},${b})`);
//     grd.addColorStop(1, `rgb(${Math.max(0, r - shadow)},${Math.max(0, g - shadow)},${Math.max(0, b - shadow)})`);
//     ctx.beginPath();
//     pts2D.forEach(([px, py], idx) => idx === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py));
//     ctx.closePath();
//     ctx.fillStyle = grd;
//     ctx.fill();
//     ctx.strokeStyle = `rgba(${Math.max(0, r - 40)},${Math.max(0, g - 40)},${Math.max(0, b - 40)},0.6)`;
//     ctx.lineWidth = 0.9;
//     ctx.stroke();

//     // Concentric ring detail on cap for pipe look
//     ctx.save();
//     ctx.globalAlpha = 0.12;
//     ctx.strokeStyle = `rgb(${Math.max(0, r - 30)},${Math.max(0, g - 30)},${Math.max(0, b - 30)})`;
//     ctx.lineWidth = 1;
//     for (const frac of [0.45, 0.75]) {
//       ctx.beginPath();
//       pts2D.forEach(([px, py], idx) => {
//         const ipx = center2D[0] + (px - center2D[0]) * frac;
//         const ipy = center2D[1] + (py - center2D[1]) * frac;
//         idx === 0 ? ctx.moveTo(ipx, ipy) : ctx.lineTo(ipx, ipy);
//       });
//       ctx.closePath();
//       ctx.stroke();
//     }
//     ctx.restore();
//   };

//   // Draw the farther cap first, then the closer one on top
//   if (leftDepth < rightDepth) {
//     drawCap(leftPts2D,  leftCenter2D,  false);
//     drawCap(rightPts2D, rightCenter2D, true);
//   } else {
//     drawCap(rightPts2D, rightCenter2D, true);
//     drawCap(leftPts2D,  leftCenter2D,  false);
//   }
// }

// function drawCylinderFlat(ctx, box, rgb, view, scale, cx, cy) {
//   const { x, y, z, w, h, d } = box;
//   const { r, g, b } = rgb;
//   let centerA = 0, centerB = 0, radius = 0;
//   if (view === "Side") { radius = Math.min(h, d) / 2; centerA = z + d / 2; centerB = y + h / 2; }
//   else if (view === "Front") { radius = Math.min(w, h) / 2; centerA = x + w / 2; centerB = y + h / 2; }
//   else if (view === "Top") { radius = Math.min(w, d) / 2; centerA = x + w / 2; centerB = z + d / 2; }
//   radius = Math.max(4, radius);
//   const [px, py] = project(centerA, centerB, 0, scale, cx, cy);
//   const screenRadius = Math.max(3, radius * scale);
//   const grd = ctx.createRadialGradient(px - screenRadius * 0.35, py - screenRadius * 0.35, screenRadius * 0.12, px, py, screenRadius);
//   grd.addColorStop(0, `rgb(${Math.min(255, r + 70)},${Math.min(255, g + 70)},${Math.min(255, b + 70)})`);
//   grd.addColorStop(0.55, `rgb(${r},${g},${b})`);
//   grd.addColorStop(1, `rgb(${Math.max(0, r - 45)},${Math.max(0, g - 45)},${Math.max(0, b - 45)})`);
//   ctx.beginPath();
//   ctx.arc(px, py, screenRadius, 0, Math.PI * 2);
//   ctx.closePath();
//   ctx.fillStyle = grd;
//   ctx.fill();
//   ctx.strokeStyle = `rgb(${Math.max(0, r - 35)},${Math.max(0, g - 35)},${Math.max(0, b - 35)})`;
//   ctx.lineWidth = 1.2;
//   ctx.stroke();
// }

// // Upright cylinder: axis runs along Y (height h). Circular cross-section in X-Z plane.
// function drawCylinderUpright(ctx, x, y, z, w, h, d, rgb, angleY, angleX, scale, cx, cy) {
//   const { r, g, b } = rgb;
//   const segments = 32;
//   const radius = Math.min(w, d) / 2;
//   const centerX = x + w / 2;
//   const centerZ = z + d / 2;

//   const bottomPts3D = [], topPts3D = [];
//   for (let i = 0; i < segments; i++) {
//     const angle = (i / segments) * Math.PI * 2;
//     const px = centerX + Math.cos(angle) * radius;
//     const pz = centerZ + Math.sin(angle) * radius;
//     bottomPts3D.push(to3D(px, y,     pz, angleY, angleX));
//     topPts3D.push(   to3D(px, y + h, pz, angleY, angleX));
//   }
//   const bottomPts2D = bottomPts3D.map(p => project(...p, scale, cx, cy));
//   const topPts2D    = topPts3D.map(p    => project(...p, scale, cx, cy));
//   const topCenter3D = to3D(centerX, y + h, centerZ, angleY, angleX);
//   const topCenter2D = project(...topCenter3D, scale, cx, cy);

//   // Lateral quads — sorted back-to-front
//   const quads = [];
//   for (let i = 0; i < segments; i++) {
//     const ni = (i + 1) % segments;
//     const angle = ((i + 0.5) / segments) * Math.PI * 2;
//     const nx = Math.cos(angle), nz = Math.sin(angle);
//     const rnx = nx * Math.cos(angleY) + nz * Math.sin(angleY);
//     const bright = Math.max(0.30, Math.min(1.1, 0.65 + 0.55 * rnx));
//     const avgDepth = (bottomPts3D[i][2] + bottomPts3D[ni][2] + topPts3D[i][2] + topPts3D[ni][2]) / 4;
//     quads.push({ i, ni, bright, depth: avgDepth });
//   }
//   quads.sort((a, b) => a.depth - b.depth);
//   quads.forEach(({ i, ni, bright }) => {
//     const lR = Math.min(255, Math.round(r * bright));
//     const lG = Math.min(255, Math.round(g * bright));
//     const lB = Math.min(255, Math.round(b * bright));
//     ctx.beginPath();
//     ctx.moveTo(bottomPts2D[i][0],  bottomPts2D[i][1]);
//     ctx.lineTo(bottomPts2D[ni][0], bottomPts2D[ni][1]);
//     ctx.lineTo(topPts2D[ni][0],    topPts2D[ni][1]);
//     ctx.lineTo(topPts2D[i][0],     topPts2D[i][1]);
//     ctx.closePath();
//     ctx.fillStyle = `rgb(${lR},${lG},${lB})`;
//     ctx.fill();
//     ctx.strokeStyle = `rgba(${Math.max(0,lR-15)},${Math.max(0,lG-15)},${Math.max(0,lB-15)},0.25)`;
//     ctx.lineWidth = 0.3;
//     ctx.stroke();
//   });

//   // Top cap with gradient
//   const screenRadius = radius * scale;
//   const grd = ctx.createRadialGradient(
//     topCenter2D[0] - screenRadius * 0.35, topCenter2D[1] - screenRadius * 0.35, screenRadius * 0.05,
//     topCenter2D[0], topCenter2D[1], screenRadius * 1.05
//   );
//   grd.addColorStop(0,   `rgb(${Math.min(255,r+80)},${Math.min(255,g+80)},${Math.min(255,b+80)})`);
//   grd.addColorStop(0.6, `rgb(${r},${g},${b})`);
//   grd.addColorStop(1,   `rgb(${Math.max(0,r-30)},${Math.max(0,g-30)},${Math.max(0,b-30)})`);
//   ctx.beginPath();
//   topPts2D.forEach(([px, py], idx) => idx === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py));
//   ctx.closePath();
//   ctx.fillStyle = grd;
//   ctx.fill();
//   ctx.strokeStyle = `rgba(${Math.max(0,r-40)},${Math.max(0,g-40)},${Math.max(0,b-40)},0.6)`;
//   ctx.lineWidth = 0.9;
//   ctx.stroke();

//   // Concentric ring detail on top cap
//   ctx.save();
//   ctx.globalAlpha = 0.12;
//   ctx.strokeStyle = `rgb(${Math.max(0,r-30)},${Math.max(0,g-30)},${Math.max(0,b-30)})`;
//   ctx.lineWidth = 1;
//   for (const frac of [0.45, 0.75]) {
//     ctx.beginPath();
//     topPts2D.forEach(([px, py], idx) => {
//       const ipx = topCenter2D[0] + (px - topCenter2D[0]) * frac;
//       const ipy = topCenter2D[1] + (py - topCenter2D[1]) * frac;
//       idx === 0 ? ctx.moveTo(ipx, ipy) : ctx.lineTo(ipx, ipy);
//     });
//     ctx.closePath();
//     ctx.stroke();
//   }
//   ctx.restore();
// }

// // ── CYLINDER along Z axis (d is the longest dimension) ───────────────────────
// function drawCylinderZ(ctx, x, y, z, w, h, d, rgb, angleY, angleX, scale, cx, cy) {
//   const { r, g, b } = rgb;
//   const segments = 32;
//   const radius = Math.min(w, h) / 2;
//   const centerX = x + w / 2;
//   const centerY = y + h / 2;

//   const frontPts3D = [], backPts3D = [];
//   for (let i = 0; i < segments; i++) {
//     const angle = (i / segments) * Math.PI * 2;
//     const px = centerX + Math.cos(angle) * radius;
//     const py = centerY + Math.sin(angle) * radius;
//     frontPts3D.push(to3D(px, py, z,     angleY, angleX));
//     backPts3D.push( to3D(px, py, z + d, angleY, angleX));
//   }
//   const frontPts2D   = frontPts3D.map(p => project(...p, scale, cx, cy));
//   const backPts2D    = backPts3D.map(p  => project(...p, scale, cx, cy));
//   const frontDepth   = frontPts3D.reduce((s, p) => s + p[2], 0) / segments;
//   const backDepth    = backPts3D.reduce((s, p)  => s + p[2], 0) / segments;
//   const frontCenter3D = to3D(centerX, centerY, z,     angleY, angleX);
//   const backCenter3D  = to3D(centerX, centerY, z + d, angleY, angleX);
//   const frontCenter2D = project(...frontCenter3D, scale, cx, cy);
//   const backCenter2D  = project(...backCenter3D,  scale, cx, cy);

//   // Lateral quads
//   const quads = [];
//   for (let i = 0; i < segments; i++) {
//     const ni = (i + 1) % segments;
//     const angle = ((i + 0.5) / segments) * Math.PI * 2;
//     const nx = Math.cos(angle), ny = Math.sin(angle);
//     const rnx = nx * Math.cos(angleY);
//     const rny = ny * Math.cos(angleX);
//     const bright = Math.max(0.30, Math.min(1.1, 0.65 + 0.5 * rny + 0.2 * rnx));
//     const avgDepth = (frontPts3D[i][2] + frontPts3D[ni][2] + backPts3D[i][2] + backPts3D[ni][2]) / 4;
//     quads.push({ i, ni, bright, depth: avgDepth });
//   }
//   quads.sort((a, b) => a.depth - b.depth);
//   quads.forEach(({ i, ni, bright }) => {
//     const lR = Math.min(255, Math.round(r * bright));
//     const lG = Math.min(255, Math.round(g * bright));
//     const lB = Math.min(255, Math.round(b * bright));
//     ctx.beginPath();
//     ctx.moveTo(frontPts2D[i][0],  frontPts2D[i][1]);
//     ctx.lineTo(frontPts2D[ni][0], frontPts2D[ni][1]);
//     ctx.lineTo(backPts2D[ni][0],  backPts2D[ni][1]);
//     ctx.lineTo(backPts2D[i][0],   backPts2D[i][1]);
//     ctx.closePath();
//     ctx.fillStyle = `rgb(${lR},${lG},${lB})`;
//     ctx.fill();
//     ctx.strokeStyle = `rgba(${Math.max(0,lR-15)},${Math.max(0,lG-15)},${Math.max(0,lB-15)},0.25)`;
//     ctx.lineWidth = 0.3;
//     ctx.stroke();
//   });

//   const drawCap = (pts2D, center2D, isFront) => {
//     const screenRadius = radius * scale;
//     const grd = ctx.createRadialGradient(
//       center2D[0] - screenRadius * 0.35, center2D[1] - screenRadius * 0.35, screenRadius * 0.05,
//       center2D[0], center2D[1], screenRadius * 1.05
//     );
//     const hl = isFront ? 80 : 35, sh = isFront ? 15 : 50;
//     grd.addColorStop(0,   `rgb(${Math.min(255,r+hl)},${Math.min(255,g+hl)},${Math.min(255,b+hl)})`);
//     grd.addColorStop(0.6, `rgb(${r},${g},${b})`);
//     grd.addColorStop(1,   `rgb(${Math.max(0,r-sh)},${Math.max(0,g-sh)},${Math.max(0,b-sh)})`);
//     ctx.beginPath();
//     pts2D.forEach(([px, py], idx) => idx === 0 ? ctx.moveTo(px,py) : ctx.lineTo(px,py));
//     ctx.closePath();
//     ctx.fillStyle = grd; ctx.fill();
//     ctx.strokeStyle = `rgba(${Math.max(0,r-40)},${Math.max(0,g-40)},${Math.max(0,b-40)},0.6)`;
//     ctx.lineWidth = 0.9; ctx.stroke();
//   };
//   if (frontDepth < backDepth) { drawCap(frontPts2D, frontCenter2D, true);  drawCap(backPts2D, backCenter2D, false); }
//   else                         { drawCap(backPts2D,  backCenter2D,  false); drawCap(frontPts2D, frontCenter2D, true); }
// }

// function drawContainer(ctx, L, W, H, angleY, angleX, scale, cx, cy, containerName) {
//   const name = (containerName || "").toLowerCase();
//   const isFlatRack = name.includes("flat rack");
//   const isOpenTop = name.includes("open top") || name.includes("ot");
//   const FLOOR_THICKNESS = 120;
//   const rawCorners = [
//     [0, 0, 0], [L, 0, 0], [L, H, 0], [0, H, 0],
//     [0, 0, W], [L, 0, W], [L, H, W], [0, H, W],
//   ];
//   const pts3D = rawCorners.map(([px, py, pz]) => to3D(px, py, pz, angleY, angleX));
//   const pts2D = pts3D.map(([tx, ty, tz]) => project(tx, ty, tz, scale, cx, cy));
//   const allFaces = [
//     { pts: [0, 1, 2, 3] }, { pts: [4, 5, 6, 7] }, { pts: [0, 4, 7, 3] },
//     { pts: [1, 5, 6, 2] }, { pts: [0, 1, 5, 4] }, { pts: [3, 2, 6, 7] },
//   ];
//   let facesToDraw = [];
//   if (isFlatRack) facesToDraw = [];
//   else if (isOpenTop) facesToDraw = [allFaces[0], allFaces[2], allFaces[3], allFaces[4]];
//   else facesToDraw = allFaces;
//   facesToDraw.forEach((face) => {
//     ctx.beginPath();
//     ctx.moveTo(pts2D[face.pts[0]][0], pts2D[face.pts[0]][1]);
//     for (let i = 1; i < face.pts.length; i++) ctx.lineTo(pts2D[face.pts[i]][0], pts2D[face.pts[i]][1]);
//     ctx.closePath();
//     ctx.fillStyle = "rgba(0,0,0,0.03)";
//     ctx.fill();
//   });
//   ctx.strokeStyle = "rgba(30,30,30,0.7)";
//   ctx.lineWidth = 2;
//   let edgesToDraw = [];
//   if (isFlatRack) edgesToDraw = [[0,1],[1,5],[5,4],[4,0]];
//   else if (isOpenTop) edgesToDraw = [[0,1],[1,5],[5,4],[4,0],[0,3],[1,2],[4,7],[5,6]];
//   else edgesToDraw = [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];
//   edgesToDraw.forEach(([a, b]) => {
//     ctx.beginPath(); ctx.moveTo(pts2D[a][0], pts2D[a][1]); ctx.lineTo(pts2D[b][0], pts2D[b][1]); ctx.stroke();
//   });
//   const floorCorners = [
//     [0,0,0],[L,0,0],[L,0,W],[0,0,W],[0,-FLOOR_THICKNESS,0],[L,-FLOOR_THICKNESS,0],[L,-FLOOR_THICKNESS,W],[0,-FLOOR_THICKNESS,W],
//   ];
//   const floorPts3D = floorCorners.map(([px, py, pz]) => to3D(px, py, pz, angleY, angleX));
//   const floorPts2D = floorPts3D.map(([tx, ty, tz]) => project(tx, ty, tz, scale, cx, cy));
//   const floorFaces = [
//     { pts: [0,1,2,3], bright: 1.0 }, { pts: [4,5,6,7], bright: 0.35 },
//     { pts: [0,4,7,3], bright: 0.55 }, { pts: [1,5,6,2], bright: 0.65 },
//     { pts: [0,1,5,4], bright: 0.45 }, { pts: [3,2,6,7], bright: 0.75 },
//   ];
//   floorFaces
//     .map((f) => ({ ...f, depth: faceCenterDepth(floorPts3D, f.pts) }))
//     .sort((a, b) => a.depth - b.depth)
//     .forEach(({ pts, bright }) => {
//       const base = Math.round(55 * bright);
//       ctx.beginPath();
//       ctx.moveTo(floorPts2D[pts[0]][0], floorPts2D[pts[0]][1]);
//       for (let i = 1; i < pts.length; i++) ctx.lineTo(floorPts2D[pts[i]][0], floorPts2D[pts[i]][1]);
//       ctx.closePath();
//       ctx.fillStyle = `rgb(${base},${base},${base})`;
//       ctx.fill();
//       ctx.strokeStyle = "rgba(0,0,0,0.4)";
//       ctx.lineWidth = 1.5;
//       ctx.stroke();
//     });
// }

// function normalizePlacements(placements) {
//   return (placements || []).map((item) => {
//     // The packing engine already outputs the correct final dimensions
//     // (length_mm, height_mm, width_mm) after applying tilt/rotate.
//     // We must NOT re-apply any swaps here — just read the packed values directly.
//     const w = Number(item.length_mm || item.length || item.w || 0);
//     const h = Number(item.height_mm || item.height || item.h || 0);
//     const d = Number(item.width_mm  || item.width  || item.d || 0);
//     return {
//       x: Number(item.x || 0), y: Number(item.y || 0), z: Number(item.z || 0),
//       w, h, d,
//       color: item.color || "#1565c0",
//       label: item.product_name || "",
//       product_name: item.product_name || "",
//       cargo_type: item.cargo_type || item.type || "",
//       tilted: Boolean(item.tilted),
//       _original: item,
//     };
//   });
// }

// function getShortContainerName(name = "") {
//   const n = String(name).toLowerCase();
//   if (n.includes("40ft") && n.includes("general purpose")) return "40ftGP";
//   if (n.includes("20ft") && n.includes("general purpose")) return "20ftGP";
//   if (n.includes("40ft") && n.includes("open top")) return "40ftOT";
//   if (n.includes("20ft") && n.includes("open top")) return "20ftOT";
//   if (n.includes("40ft") && n.includes("flat rack")) return "40ftFR";
//   if (n.includes("20ft") && n.includes("flat rack")) return "20ftFR";
//   return name;
// }

// function getFlatViewRect(L, W, H, scale, cx, cy, activeView) {
//   if (activeView === "Side") {
//     const [x1, y1] = project(0, 0, 0, scale, cx, cy);
//     const [x2, y2] = project(W, H, 0, scale, cx, cy);
//     return { x: Math.min(x1,x2), y: Math.min(y1,y2), w: Math.abs(x2-x1), h: Math.abs(y2-y1) };
//   }
//   if (activeView === "Front") {
//     const [x1, y1] = project(0, 0, 0, scale, cx, cy);
//     const [x2, y2] = project(L, H, 0, scale, cx, cy);
//     return { x: Math.min(x1,x2), y: Math.min(y1,y2), w: Math.abs(x2-x1), h: Math.abs(y2-y1) };
//   }
//   if (activeView === "Top") {
//     const [x1, y1] = project(0, 0, 0, scale, cx, cy);
//     const [x2, y2] = project(L, W, 0, scale, cx, cy);
//     return { x: Math.min(x1,x2), y: Math.min(y1,y2), w: Math.abs(x2-x1), h: Math.abs(y2-y1) };
//   }
//   return null;
// }

// function computeOrigin(L, W, H, angleY, angleX, scale, canvasW, canvasH, activeView = "3D") {
//   if (activeView === "Side") {
//     const drawW = W * scale, drawH = H * scale;
//     return [canvasW * 0.72 - drawW / 2, canvasH * 0.70 + drawH / 2];
//   }
//   if (activeView === "Front") {
//     const drawW = L * scale, drawH = H * scale;
//     return [canvasW * 0.62 - drawW / 2, canvasH * 0.70 + drawH / 2];
//   }
//   if (activeView === "Top") {
//     const drawW = L * scale, drawH = W * scale;
//     return [canvasW * 0.62 - drawW / 2, canvasH * 0.72 + drawH / 2];
//   }
//   const rawCorners = [
//     [0,0,0],[L,0,0],[L,H,0],[0,H,0],[0,0,W],[L,0,W],[L,H,W],[0,H,W],
//   ];
//   const pts3D = rawCorners.map(([px, py, pz]) => to3D(px, py, pz, angleY, angleX));
//   const xs = pts3D.map((p) => p[0]), ys = pts3D.map((p) => p[1]);
//   const midX = (Math.min(...xs) + Math.max(...xs)) / 2;
//   const midY = (Math.min(...ys) + Math.max(...ys)) / 2;
//   return [canvasW * 0.5 - midX * scale, canvasH * 0.52 + midY * scale];
// }

// const ThreeDViewer = ({ injectedState } = {}) => {
//   const location = useLocation();
//   const navigate = useNavigate();
//   const canvasRef = useRef(null);
//   const animRef = useRef(null);
//   const camRef = useRef({ angleY: -0.55, angleX: 0.32, scale: 0.1 });
//   const dragRef = useRef({ active: false, lastX: 0, lastY: 0, pinchDist: null });
//   const isDirtyRef = useRef(true);   // only redraw when camera actually changed
//   const [activeView, setActiveView] = useState("3D");

//   // ── MANUAL OVERRIDE STATE ─────────────────────────────────────────────────
//   const [isManualOverride, setIsManualOverride] = useState(false);
//   const [manualBoxes, setManualBoxes] = useState(null); // loaded from localStorage in useEffect below
//   const [moView, setMoView] = useState("Top"); // 2D view plane for manual override
//   const moCanvasRef = useRef(null);
//   const moDragRef = useRef({ active: false, boxIndex: -1, startMouseX: 0, startMouseY: 0, startBoxX: 0, startBoxZ: 0, startBoxY: 0 });
//   const moScaleRef = useRef(0.09);
//   const moOffsetRef = useRef({ x: 0, y: 0 });
//   const moIsDirtyRef = useRef(true);
//   const moAnimRef = useRef(null);

// const state = injectedState || location.state || {};
//   const navigationTs = state.navigationTs || 0;
//   const isSharedView =
//     state.isSharedView === true ||
//     location.pathname.includes("/share/") ||
//     Boolean(injectedState);
//   const result = state.result || {};
//   const cont = result.container || state.selectedContainer || null;
//   const placements = result.placements || state.placements || [];
//   const odc = Boolean(result.odc);
//   const overWidthMm = Number(result.overWidthMm || 0);
//   const overHeightMm = Number(result.overHeightMm || 0);
//   const overweight = Boolean(result.overweight);
//   const overweightKg = Number(result.overweightKg || 0);

//   const L = Number(cont?.internal_length_mm || cont?.length_mm || 0);
//   const W = Number(cont?.internal_width_mm || cont?.width_mm || 0);
//   const H = Number(cont?.internal_height_mm || cont?.height_mm || 0);

//   const cargoItems = state.cargoItems || [];

//   const enrichedPlacements = placements.map((p) => {
//     const match = (state.cargoItems || []).find((ci) => ci.product_name === p.product_name);
//     return match ? { ...match, ...p } : p;
//   });

//   const rawBoxes = normalizePlacements(enrichedPlacements);

// const EPS_BOX = 2; // 2mm tolerance for floating point edge cases
//   const autoBoxes = rawBoxes.filter((box) => {
//     const inside =
//       box.x >= -EPS_BOX && box.y >= -EPS_BOX && box.z >= -EPS_BOX &&
//       box.x + box.w <= L + EPS_BOX &&
//       box.y + box.h <= H + EPS_BOX &&
//       box.z + box.d <= W + EPS_BOX;
//     if (!inside) console.warn("❌ Item outside container:", box);
//     return inside;
//   });

//   // Use manualBoxes if it exists (even after exiting override), otherwise autoBoxes
//   // This ensures 3D reflects all manual edits after "Apply & Back to 3D"
//   const boxes = manualBoxes !== null ? manualBoxes : autoBoxes;

//   // Rejected items from packing engine
//   // const rejectedItems = result.rejected || [];
//   // const [fitLoading, setFitLoading] = useState(false);
//   // const [fitError, setFitError] = useState("");

//   // Rejected items from packing engine — tracked in state so count updates after fitting
// const savedRejected = localStorage.getItem("rejectedItemsCleared");

// const [rejectedItems, setRejectedItems] = useState(
//   savedRejected === "true" ? [] : (state.rejectedFromCostAnalysis ?? result.rejected ?? [])
// );
// const [fitLoading, setFitLoading] = useState(false);
//   const [fitError, setFitError] = useState("");
//   const [manualPackedItems, setManualPackedItems] = useState([]);
// const [layoutWarnings, setLayoutWarnings] = useState([]);
// const [showLayoutWarning, setShowLayoutWarning] = useState(false);

// // show warning only once when entering 3D viewer
// const entryWarningShownRef = useRef(false);

//   // ── FIT REJECTED ITEMS INTO MANUAL LAYOUT ─────────────────────────────────
//   const handleFitRejected = async () => {
//     if (!manualBoxes || rejectedItems.length === 0) return;
//     setFitLoading(true); setFitError("");
//     try {
//       const prePlaced = manualBoxes.map(b => ({
//         product_name: b.product_name,
//         cargo_type: b.cargo_type || "Cartons",
//         color: b.color,
//         x: Math.round(b.x), y: Math.round(b.y), z: Math.round(b.z),
//         length_mm: Math.round(b.w), height_mm: Math.round(b.h), width_mm: Math.round(b.d),
//         weight_kg: b._original?.weight_kg || 0,
//         pre_placed: true,
//       }));
//       const toFit = rejectedItems.map(r => ({
//         product_name: r.product_name,
//         cargo_type: r.cargo_type || "Cartons",
//         color: r.color || "#22c55e",
//         length_mm: r.length_mm || 0, width_mm: r.width_mm || 0, height_mm: r.height_mm || 0,
//         weight_kg: r.weight_kg || 0, quantity: 1, shipment_name: shipmentName || "",
//       }));
// const res = await fetch("http://localhost:5000/api/fit-into-layout", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ 
//           container: cont, 
//           pre_placed: prePlaced, 
//           items_to_fit: toFit,
//           allow_stacking: true,
//           stack_on_pre_placed: true,
//         }),
//       });
//       const data = await res.json();
//       if (!res.ok) throw new Error(data.message || "Failed");
//       // const newBoxes = normalizePlacements(data.new_placements || []);
//       // setManualBoxes([...manualBoxes, ...newBoxes]);
//       // isDirtyRef.current = true;
//       // if (data.still_rejected?.length > 0) {
//       //   setFitError(`⚠️ ${data.still_rejected.length} item(s) still couldn't fit.`);
//       // } else {
//       //   setFitError("✅ All items fitted!");
//       // }

// const newBoxes = normalizePlacements(data.new_placements || []);
// setManualBoxes([...manualBoxes, ...newBoxes]);
// isDirtyRef.current = true;
// // Update remaining rejected items so the button count reflects reality
// setRejectedItems(data.still_rejected || []);
// const fittedNames = newBoxes
//   .map(b => b.product_name || b.label)
//   .filter(Boolean);

// setManualPackedItems(fittedNames);

// const oldSaved = JSON.parse(
//   localStorage.getItem("latest_manual_override_packed") || "[]"
// );

// const mergedNames = Array.from(new Set([...oldSaved, ...fittedNames]));

// localStorage.setItem(
//   "latest_manual_override_packed",
//   JSON.stringify(mergedNames)
// );

// localStorage.setItem(
//   `manual_override_packed_${shipmentName}`,
//   JSON.stringify(mergedNames)
// );

// if (data.still_rejected?.length > 0) {
//   const fittedCount = toFit.length - data.still_rejected.length;
//   setFitError(
//     fittedCount > 0
//       ? `✅ ${fittedCount} item(s) fitted! ⚠️ ${data.still_rejected.length} still can't fit.`
//       : `⚠️ ${data.still_rejected.length} item(s) still couldn't fit.`
//   );
// } else {
//   setFitError("✅ All items fitted successfully!");
//   localStorage.setItem("rejectedItemsCleared", "true");
//   setRejectedItems([]);
// }
//     } catch(err) {
//       setFitError(err.message || "Error connecting to backend.");
//     } finally {
//       setFitLoading(false);
//     }
//   };

// const shipmentName =
//     cargoItems.find((item) => item.shipment_name && String(item.shipment_name).trim())?.shipment_name ||
//     placements.find((p) => p.shipment_name && String(p.shipment_name).trim())?.shipment_name ||
//     state.shipmentName ||
//     state.viewShipmentName ||
//     "";

// const cargoVersionKey = cargoItems
//   .map((item) => `${item.product_name}-${item.quantity || item.qty}-${item.length_mm || item.length_cm}-${item.width_mm || item.width_cm}-${item.height_mm || item.height_cm}-${item.weight_kg}`)
//   .join("|");

// const manualBoxesKey = shipmentName
//   ? `cargoset_manual_${shipmentName}_${cargoVersionKey}`
//   : null;

// // Stable key — does NOT change when cargo quantities change — used for "Save Layout"
// const savedLayoutKey = shipmentName ? `cargoset_saved_layout_${shipmentName}` : null;

// // ── SAVE LAYOUT: persist current manual positions so Recalculate keeps them ──
// const [layoutSaved, setLayoutSaved] = useState(false);

// useEffect(() => {
//   if (!shipmentName) return;
//   fetch('http://localhost:5000/api/shipments')
//     .then(r => r.json())
//     .then(data => {
//       if (Array.isArray(data)) {
//         const match = data.find(
//           s => (s.name || '').toLowerCase().trim() === shipmentName.toLowerCase().trim()
//         );
//         if (match && match.status === 'completed') setLayoutSaved(true);
//       }
//     })
//     .catch(() => {});
// }, [shipmentName]);

// // ✅ Reset to blue when cargo items change (user edited something)
// useEffect(() => {
//   setLayoutSaved(false);
// }, [cargoVersionKey]);

//   const [toast, setToast] = useState(null);
//   const showToast = (message, type = "success") => {
//     setToast({ message, type });
//     setTimeout(() => setToast(null), 3000);
//   };

// const handleSaveLayout = async () => {
//   try {
//     const toSave = manualBoxes?.length ? manualBoxes : autoBoxes;

//     if (!shipmentName) {
//       alert("Shipment name missing. Cannot save layout.");
//       return;
//     }

//     // 1. Save placements to DB (new API endpoint)
//     const saveRes = await fetch(`http://localhost:5000/api/shipments/layout/${encodeURIComponent(shipmentName)}`, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({
//         placements: toSave.map(b => ({
//           product_name: b.product_name || b.label || '',
//           cargo_type: b.cargo_type || 'Cartons',
//           color: b.color || '#1565c0',
//           x: Math.round(b.x), y: Math.round(b.y), z: Math.round(b.z),
//           length_mm: Math.round(b.w),
//           height_mm: Math.round(b.h),
//           width_mm: Math.round(b.d),
//           weight_kg: b._original?.weight_kg || 0,
//         })),
//         container: cont,
//       }),
//     });

//     if (!saveRes.ok) throw new Error('Failed to save layout to server');

// // 2. Mark shipment as completed (update existing, never insert duplicate)
//     await fetch('http://localhost:5000/api/shipments/complete', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({
//         name: shipmentName,
//         item_count: cargoItems.length,
//         container_count: 1,
//         calc_time_s: 0.01,
//       }),
//     });

//    // 3. Deduplicate rejected items by product_name and sum quantities
// const rejectedGrouped = Object.values(
//   rejectedItems.reduce((acc, r) => {
//     const name = r.product_name || r.name || '';
//     if (!acc[name]) {
//       acc[name] = { product_name: name, quantity: 0 };
//     }
//     acc[name].quantity += 1; // each entry in rejected[] = 1 unit
//     return acc;
//   }, {})
// );

// await fetch(
//   `http://localhost:5000/api/shipments/rejected/${encodeURIComponent(shipmentName)}`,
//   {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify({ rejected: rejectedGrouped }),
//   }
// );
// setManualBoxes([...toSave]);
//     setLayoutSaved(true);
//     showToast('✅ Layout saved permanently.', 'success');
//   } catch (err) {
//     console.error('Save layout failed:', err);
//     showToast('❌ Save failed: ' + err.message, 'error');
//   }
// };

// useEffect(() => {
//   if (!shipmentName) {
//     setManualBoxes(null);
//     return;
//   }

//   let cancelled = false;

//   const forceFresh = localStorage.getItem("FORCE_FRESH_PACKING");
//   if (forceFresh === "true") {
//     localStorage.removeItem("FORCE_FRESH_PACKING");
//     setManualBoxes(null);
//     return;
//   }

//   fetch(`http://localhost:5000/api/shipments/layout/${encodeURIComponent(shipmentName)}`)
//     .then(r => r.ok ? r.json() : null)
//     .then(data => {
//       if (cancelled) return;
//       if (data && Array.isArray(data.placements) && data.placements.length > 0) {
//         setManualBoxes(
//           normalizePlacements(data.placements.filter(box => !box.rejected))
//         );
//       } else {
//         setManualBoxes(null);
//       }
//     })
//     .catch(() => {
//       if (!cancelled) setManualBoxes(null);
//     });

//   return () => { cancelled = true; };

// }, [shipmentName, navigationTs]); // ← navigationTs triggers re-fetch on every fresh navigation
// useEffect(() => {
//   // DO NOT reset manualBoxes here — the layout-load effect above handles
//   // loading the correct saved layout whenever shipmentName changes.
//   // Resetting here causes the race condition where old auto-pack flashes
//   // before the fetch completes.

//   // Refresh rejected items (don't rely on stale localStorage savedLayout)
//   const remainingRejected = result.rejected || [];
//   setRejectedItems(remainingRejected);

//   if (remainingRejected.length === 0 && (result.rejected || []).length > 0) {
//     setFitError("✅ All items fitted successfully!");
//     localStorage.setItem("rejectedItemsCleared", "true");
//   }

//   // Reset warning popup state
//   entryWarningShownRef.current = false;

//   // Trigger redraws
//   isDirtyRef.current = true;
//   moIsDirtyRef.current = true;
// }, [cargoVersionKey, navigationTs]);


//   useEffect(() => {
//     document.body.style.margin = "0";
//     document.body.style.padding = "0";
//     document.body.style.overflow = "hidden";
//     document.documentElement.style.margin = "0";
//     document.documentElement.style.padding = "0";
//     document.documentElement.style.overflow = "hidden";
//     return () => {
//       document.body.style.margin = "";
//       document.body.style.padding = "";
//       document.body.style.overflow = "";
//       document.documentElement.style.margin = "";
//       document.documentElement.style.padding = "";
//       document.documentElement.style.overflow = "";
//     };
//   }, []);

//   useEffect(() => {
//     if (!cont) return;
//     const canvas = canvasRef.current;
//     const ctx = canvas.getContext("2d");
//     const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; isDirtyRef.current = true; };
//     resize();
//     window.addEventListener("resize", resize);

//     const gridSize = 200000, gridStep = 500;
//     const gridMin = -gridSize / 2, gridMax = gridSize / 2;

//     const draw = () => {
//       const { angleY, angleX, scale } = camRef.current;
//       const [cx, cy] = computeOrigin(L, W, H, angleY, angleX, scale, canvas.width, canvas.height, activeView);
//       ctx.clearRect(0, 0, canvas.width, canvas.height);
//       ctx.fillStyle = "#f0f3fa";
//       ctx.fillRect(0, 0, canvas.width, canvas.height);

//       ctx.lineWidth = 1;
//       for (let i = gridMin; i <= gridMax; i += gridStep) {
//         const isMajor = i % (gridStep * 5) === 0;
//         ctx.strokeStyle = isMajor ? "rgba(0,0,0,0.18)" : "rgba(0,0,0,0.07)";
//         const [ax, ay] = project(...to3D(i, 0, gridMin, angleY, angleX), scale, cx, cy);
//         const [bx, by] = project(...to3D(i, 0, gridMax, angleY, angleX), scale, cx, cy);
//         ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
//         const [ax2, ay2] = project(...to3D(gridMin, 0, i, angleY, angleX), scale, cx, cy);
//         const [bx2, by2] = project(...to3D(gridMax, 0, i, angleY, angleX), scale, cx, cy);
//         ctx.beginPath(); ctx.moveTo(ax2, ay2); ctx.lineTo(bx2, by2); ctx.stroke();
//       }

//       drawContainer(ctx, L, W, H, angleY, angleX, scale, cx, cy, cont.container_name || cont.name || "");

//       // ── Camera-aware sort, computed once per draw call ────────────────────
//       // Sort items back-to-front using current camera angles so that:
//       //   1. Items far from camera draw first (painter's algorithm)
//       //   2. Items physically behind others (in world space) always draw first
//       //   3. Sort is re-computed each draw() call but draw() only fires when
//       //      isDirtyRef=true (on mouse move/zoom) — NOT every RAF frame.
//       //      So there is NO flicker between frames because we only draw once
//       //      per user input event, not continuously.
//       //
//       // The "changing shape" bug was caused by requestAnimationFrame running
//       // draw() 60x/sec even when nothing moved. Now draw() runs only on input.

// const sortedBoxes = [...boxes]
//   .map((box, index) => {
//     const cx0 = box.x;
//     const cy0 = box.y;
//     const cz0 = box.z;

//     const cx1 = box.x + box.w;
//     const cy1 = box.y + box.h;
//     const cz1 = box.z + box.d;

//     const corners = [
//       [cx0, cy0, cz0],
//       [cx1, cy0, cz0],
//       [cx1, cy1, cz0],
//       [cx0, cy1, cz0],
//       [cx0, cy0, cz1],
//       [cx1, cy0, cz1],
//       [cx1, cy1, cz1],
//       [cx0, cy1, cz1],
//     ];

//     const depths = corners.map(([px, py, pz]) =>
//       to3D(px, py, pz, angleY, angleX)[2]
//     );

//     const minDepth = Math.min(...depths);
//     const maxDepth = Math.max(...depths);
//     const avgDepth = depths.reduce((s, d) => s + d, 0) / 8;

//     return {
//       ...box,
//       minDepth,
//       maxDepth,
//       avgDepth,
//       stableIndex: index,
//     };
//   })
//   .sort((a, b) => {
//     const d = a.minDepth - b.minDepth;
//     if (Math.abs(d) > 1.0) return d;

//     const da = a.avgDepth - b.avgDepth;
//     if (Math.abs(da) > 1.0) return da;

//     const dm = a.maxDepth - b.maxDepth;
//     if (Math.abs(dm) > 1.0) return dm;

//     const dy = a.y - b.y;
//     if (Math.abs(dy) > 1.0) return dy;

//     return a.stableIndex - b.stableIndex;
//   });

//       sortedBoxes.forEach(({ x, y, z, w, h, d, color, cargo_type, tilted, stableIndex }) => {
//         const rgb       = hexToRgb(color);
//         const shapeType = getShapeType(cargo_type);
//         if (shapeType === "sack") {
//           if (activeView === "Side" || activeView === "Front" || activeView === "Top") {
//             drawSackFlat(ctx, { x, y, z, w, h, d }, rgb, activeView, scale, cx, cy);
//           } else {
//             drawSack(ctx, x, y, z, w, h, d, rgb, angleY, angleX, scale, cx, cy);
//           }
//         } else if (shapeType === "cylinder") {
//           if (activeView === "Side" || activeView === "Front" || activeView === "Top") {
//             drawCylinderFlat(ctx, { x, y, z, w, h, d }, rgb, activeView, scale, cx, cy);
//           } else {
//             // Pick axis based on which dimension is longest
//             if (h >= w && h >= d) {
//               // Upright — axis along Y
//               drawCylinderUpright(ctx, x, y, z, w, h, d, rgb, angleY, angleX, scale, cx, cy);
//             } else if (d >= w && d >= h) {
//               // Along Z axis
//               drawCylinderZ(ctx, x, y, z, w, h, d, rgb, angleY, angleX, scale, cx, cy);
//             } else {
//               // Along X axis (w is longest)
//               drawCylinder(ctx, x, y, z, w, h, d, rgb, angleY, angleX, scale, cx, cy);
//             }
//           }
//         } else {
//           drawCuboid(ctx, x, y, z, w, h, d, rgb, angleY, angleX, scale, cx, cy, 1, stableIndex);
//         }
//       });

//             isDirtyRef.current = false;
//     };

//     // Only redraw when something changed — stops ghost-movement illusion
//     const loop = () => {
//       if (isDirtyRef.current) draw();
//       animRef.current = requestAnimationFrame(loop);
//     };
//     isDirtyRef.current = true;
//     loop();

//     const onDown = (e) => { dragRef.current = { active: true, lastX: e.clientX, lastY: e.clientY }; canvas.style.cursor = "grabbing"; isDirtyRef.current = true; };
//     const onMove = (e) => {
//       if (!dragRef.current.active) return;
//       // Accumulate rotation delta — items stay locked in world space
//       camRef.current.angleY += (e.clientX - dragRef.current.lastX) * 0.006;
//       camRef.current.angleX += (e.clientY - dragRef.current.lastY) * 0.004;
//       camRef.current.angleX = Math.max(-1.4, Math.min(1.4, camRef.current.angleX));
//       dragRef.current.lastX = e.clientX;
//       dragRef.current.lastY = e.clientY;
//       isDirtyRef.current = true;   // mark for redraw — prevents ghost-drop illusion
//     };
//     const onUp = () => { dragRef.current.active = false; canvas.style.cursor = "grab"; isDirtyRef.current = true; };
//     const onWheel = (e) => {
//       e.preventDefault();
//       camRef.current.scale = Math.max(0.04, Math.min(1.5, camRef.current.scale - e.deltaY * 0.0003));
//       isDirtyRef.current = true;
//     };
//     const onTouchStart = (e) => {
//       if (e.touches.length === 1) {
//         const t = e.touches[0];
//         dragRef.current = { active: true, lastX: t.clientX, lastY: t.clientY, pinchDist: null };
//       } else if (e.touches.length === 2) {
//         // Pinch-to-zoom start
//         const dx = e.touches[0].clientX - e.touches[1].clientX;
//         const dy = e.touches[0].clientY - e.touches[1].clientY;
//         dragRef.current.pinchDist = Math.sqrt(dx*dx + dy*dy);
//         dragRef.current.active = false;
//       }
//     };
//     const onTouchMove = (e) => {
//       if (e.touches.length === 2) {
//         // Pinch-to-zoom
//         const dx = e.touches[0].clientX - e.touches[1].clientX;
//         const dy = e.touches[0].clientY - e.touches[1].clientY;
//         const dist = Math.sqrt(dx*dx + dy*dy);
//         if (dragRef.current.pinchDist) {
//           const delta = (dist - dragRef.current.pinchDist) * 0.0003;
//           camRef.current.scale = Math.max(0.04, Math.min(1.5, camRef.current.scale + delta));
//           isDirtyRef.current = true;
//         }
//         dragRef.current.pinchDist = dist;
//         return;
//       }
//       if (!dragRef.current.active || e.touches.length !== 1) return;
//       const t = e.touches[0];
//       camRef.current.angleY += (t.clientX - dragRef.current.lastX) * 0.006;
//       camRef.current.angleX += (t.clientY - dragRef.current.lastY) * 0.004;
//       camRef.current.angleX = Math.max(-1.4, Math.min(1.4, camRef.current.angleX));
//       dragRef.current.lastX = t.clientX;
//       dragRef.current.lastY = t.clientY;
//       isDirtyRef.current = true;   // mark for redraw
//     };

//     canvas.addEventListener("mousedown", onDown);
//     canvas.addEventListener("touchstart", onTouchStart, { passive: true });
//     canvas.addEventListener("touchmove", onTouchMove, { passive: true });
//     window.addEventListener("mousemove", onMove);
//     window.addEventListener("mouseup", onUp);
//     canvas.addEventListener("wheel", onWheel, { passive: false });

//     return () => {
//       cancelAnimationFrame(animRef.current);
//       window.removeEventListener("resize", resize);
//       window.removeEventListener("mousemove", onMove);
//       window.removeEventListener("mouseup", onUp);
//       canvas.removeEventListener("mousedown", onDown);
//       canvas.removeEventListener("touchstart", onTouchStart);
//       canvas.removeEventListener("touchmove", onTouchMove);
//       canvas.removeEventListener("wheel", onWheel);
//     };
//   }, [cont, boxes, L, W, H, activeView, isManualOverride]);

//   // ── MANUAL OVERRIDE: stable refs so canvas callbacks never go stale ─────────
//   const manualBoxesRef  = useRef(null);
//   const moViewRef       = useRef(moView);
//   const moLRef          = useRef(L);
//   const moWRef          = useRef(W);
//   const moHRef          = useRef(H);
//   // Keep ALL refs in sync on every render — this is cheap and critical
//   manualBoxesRef.current = manualBoxes;
//   moViewRef.current      = moView;
//   moLRef.current         = L;
//   moWRef.current         = W;
//   moHRef.current         = H;

//   // ── 2D canvas draw — called directly from rAF loop, reads only refs ───────
//   const moDrawRef = useRef(null); // holds latest draw fn so loop always calls fresh version

//   useEffect(() => {
//     if (!isManualOverride || !moCanvasRef.current || !cont) return;
//     const canvas = moCanvasRef.current;
//     const ctx    = canvas.getContext("2d");

//     const resize = () => {
//       canvas.width  = canvas.offsetWidth  || 800;
//       canvas.height = canvas.offsetHeight || 500;
//       const cW = moViewRef.current === "Side" ? moWRef.current : moLRef.current;
//       const cH = moViewRef.current === "Top"  ? moWRef.current : moHRef.current;
//       moScaleRef.current  = Math.min((canvas.width * 0.72) / cW, (canvas.height * 0.72) / cH, 0.25);
//       moOffsetRef.current = { x: canvas.width * 0.14, y: canvas.height * 0.14 };
//     };
//     resize();
//     window.addEventListener("resize", resize);

//     // ── pure helpers (read from refs, no closures over state) ────────────────
//     const boxToScreen = (box) => {
//       const s = moScaleRef.current, { x: ox, y: oy } = moOffsetRef.current;
//       const v = moViewRef.current, CH = moHRef.current;
//       if (v === "Side")  return { sx: ox + box.z*s, sy: oy + (CH-box.y-box.h)*s, sw: box.d*s, sh: box.h*s };
//       if (v === "Front") return { sx: ox + box.x*s, sy: oy + (CH-box.y-box.h)*s, sw: box.w*s, sh: box.h*s };
//       return { sx: ox + box.x*s, sy: oy + box.z*s, sw: box.w*s, sh: box.d*s }; // Top
//     };

//     const rotIconRect = (sx, sy, sw) => ({ rx: sx + sw - 22, ry: sy + 3 });

//     // ── draw (reads manualBoxesRef.current fresh each frame) ─────────────────
//     const draw = () => {
//       const activeBoxes = manualBoxesRef.current || autoBoxes;
//       const s  = moScaleRef.current, { x: ox, y: oy } = moOffsetRef.current;
//       const v  = moViewRef.current;
//       const CL = moLRef.current, CW = moWRef.current, CH = moHRef.current;

//       ctx.clearRect(0, 0, canvas.width, canvas.height);
//       ctx.fillStyle = "#f0f3fa"; ctx.fillRect(0, 0, canvas.width, canvas.height);

//       // Grid
//       const step = 500 * s;
//       ctx.strokeStyle = "rgba(0,0,0,0.07)"; ctx.lineWidth = 0.5;
//       for (let i = -5; i < 100; i++) {
//         ctx.beginPath(); ctx.moveTo(ox + i*step, 0);          ctx.lineTo(ox + i*step, canvas.height); ctx.stroke();
//         ctx.beginPath(); ctx.moveTo(0, oy + i*step);           ctx.lineTo(canvas.width, oy + i*step);  ctx.stroke();
//       }

//       // Container rect
//       let cw, ch;
//       if      (v === "Side")  { cw = CW*s; ch = CH*s; }
//       else if (v === "Front") { cw = CL*s; ch = CH*s; }
//       else                     { cw = CL*s; ch = CW*s; }
//       ctx.fillStyle = "rgba(37,99,235,0.04)"; ctx.fillRect(ox, oy, cw, ch);
//       ctx.strokeStyle = "rgba(20,20,20,0.8)"; ctx.lineWidth = 2.5; ctx.strokeRect(ox, oy, cw, ch);

//       // Dim labels
//       ctx.fillStyle = "#64748b"; ctx.font = "11px 'DM Sans',sans-serif"; ctx.textAlign = "center";
//       ctx.fillText(`${v==="Side"?CW:CL} mm`, ox + cw/2, oy - 8);
//       ctx.save(); ctx.translate(ox - 12, oy + ch/2); ctx.rotate(-Math.PI/2);
//       ctx.fillText(`${v==="Top"?CW:CH} mm`, 0, 0); ctx.restore();
//       ctx.textAlign = "left";

//       // Boxes
//       activeBoxes.forEach((box, i) => {
//         const rgb = hexToRgb(box.color);
//         const { sx, sy, sw, sh } = boxToScreen(box);
//         if (sw < 3 || sh < 3) return;

//         // Fill
//         const grd = ctx.createLinearGradient(sx, sy, sx, sy+sh);
//         grd.addColorStop(0, `rgba(${Math.min(255,rgb.r+30)},${Math.min(255,rgb.g+30)},${Math.min(255,rgb.b+30)},0.93)`);
//         grd.addColorStop(1, `rgba(${rgb.r},${rgb.g},${rgb.b},0.87)`);
//         ctx.fillStyle = grd;
//         ctx.beginPath(); ctx.roundRect(sx, sy, sw, sh, 4); ctx.fill();

//         // Border
//         ctx.strokeStyle = `rgba(${Math.max(0,rgb.r-60)},${Math.max(0,rgb.g-60)},${Math.max(0,rgb.b-60)},1)`;
//         ctx.lineWidth = 1.8;
//         ctx.beginPath(); ctx.roundRect(sx, sy, sw, sh, 4); ctx.stroke();

//         // Labels inside box
//         if (sw > 30 && sh > 24) {
//           ctx.textAlign = "center";
//           const fs = Math.max(7, Math.min(11, sw/8));
//           ctx.font = `bold ${fs}px 'DM Sans',sans-serif`;
//           ctx.fillStyle = "rgba(255,255,255,0.96)";
//           const name = (box.label || box.product_name || `#${i+1}`);
//           const maxC = Math.max(3, Math.floor(sw / (fs*0.6)));
//           const dName = name.length > maxC ? name.slice(0, maxC-1)+"…" : name;
//           const line1Y = sh > 46 ? sy + sh/2 - fs/2 - 1 : sy + sh/2 + fs/3;
//           ctx.fillText(dName, sx + sw/2, line1Y);

//           if (sh > 46) {
//             const dfs = Math.max(6, Math.min(9, sw/10));
//             ctx.font = `${dfs}px 'DM Sans',sans-serif`;
//             ctx.fillStyle = "rgba(255,255,255,0.78)";
//             ctx.fillText(`${Math.round(box.w)}×${Math.round(box.d)}×${Math.round(box.h)}`, sx+sw/2, line1Y+fs+4);
//           }
//           ctx.textAlign = "left";
//         }

//         // Rotate button (top-right)
//         if (sw > 30 && sh > 22) {
//           const { rx, ry } = rotIconRect(sx, sy, sw);
//           ctx.save();
//           ctx.fillStyle   = "rgba(255,255,255,0.92)";
//           ctx.strokeStyle = "rgba(0,0,0,0.15)";
//           ctx.lineWidth   = 0.7;
//           ctx.beginPath(); ctx.roundRect(rx, ry, 18, 18, 4); ctx.fill(); ctx.stroke();
//           ctx.strokeStyle = "#1e40af"; ctx.lineWidth = 1.8;
//           ctx.beginPath(); ctx.arc(rx+9, ry+9, 5, 0.4, Math.PI*1.7); ctx.stroke();
//           ctx.beginPath(); ctx.moveTo(rx+13, ry+4); ctx.lineTo(rx+14.5, ry+8); ctx.lineTo(rx+10.5, ry+7); ctx.stroke();
//           ctx.restore();
//         }
//       });

//       // Footer
//       ctx.fillStyle = "#94a3b8"; ctx.font = "11px 'DM Sans',sans-serif"; ctx.textAlign = "left";
//       ctx.fillText(`📐 ${v} View  •  Drag box = move  •  🔄 = rotate box 90°  •  Scroll = zoom`, 14, canvas.height - 10);
//     };
//     moDrawRef.current = draw;

//     // ── rAF loop — always redraws (no dirty flag needed) ────────────────────
//     let running = true;
//     const loop = () => {
//       if (!running) return;
//       if (moDrawRef.current) moDrawRef.current();
//       moAnimRef.current = requestAnimationFrame(loop);
//     };
//     loop();

//     // ── hit helpers (read from refs) ─────────────────────────────────────────
//     const hitRotate = (mx, my) => {
//       const bs = manualBoxesRef.current || autoBoxes;
//       for (let i = bs.length-1; i >= 0; i--) {
//         const { sx, sy, sw, sh } = boxToScreen(bs[i]);
//         if (sw <= 30 || sh <= 22) continue;
//         const { rx, ry } = rotIconRect(sx, sy, sw);
//         if (mx >= rx && mx <= rx+18 && my >= ry && my <= ry+18) return i;
//       }
//       return -1;
//     };
//     const hitBox = (mx, my) => {
//       const bs = manualBoxesRef.current || autoBoxes;
//       for (let i = bs.length-1; i >= 0; i--) {
//         const { sx, sy, sw, sh } = boxToScreen(bs[i]);
//         if (mx >= sx && mx <= sx+sw && my >= sy && my <= sy+sh) return i;
//       }
//       return -1;
//     };

//     // ── rotate: swap dims for the clicked box only ───────────────────────────
//     const rotateOne = (b, v, CL, CW, CH) => {
//       const nb = { ...b };
//       if (v === "Top") {
//         // In top view we see w×d. We want to cycle through all 3 orientations:
//         // Find which dimension is longest and bring it into the floor plane (w or d).
//         // If h is the longest (box is upright/tall), lay it down along w axis.
//         // If w is the longest (box is lying along x), rotate to lie along z (swap w↔d).
//         // If d is the longest (box is lying along z), stand it upright (swap d↔h).
//         const longest = Math.max(nb.w, nb.h, nb.d);
//         if (nb.h === longest) {
//           // Upright tall → lay flat along X (swap w↔h)
//           const tmp = nb.w; nb.w = nb.h; nb.h = tmp;
//         } else if (nb.w === longest) {
//           // Lying along X → rotate to lie along Z (swap w↔d)
//           const tmp = nb.w; nb.w = nb.d; nb.d = tmp;
//         } else {
//           // Lying along Z → stand upright (swap d↔h)
//           const tmp = nb.d; nb.d = nb.h; nb.h = tmp;
//         }
//         nb.x = Math.max(0, Math.min(CL - nb.w, nb.x));
//         nb.z = Math.max(0, Math.min(CW - nb.d, nb.z));
//         nb.y = Math.max(0, Math.min(CH - nb.h, nb.y));
//       } else if (v === "Front") {
//         const tmp = nb.w; nb.w = nb.h; nb.h = tmp;
//         nb.x = Math.max(0, Math.min(CL - nb.w, nb.x));
//         nb.y = Math.max(0, Math.min(CH - nb.h, nb.y));
//       } else { // Side
//         const tmp = nb.d; nb.d = nb.h; nb.h = tmp;
//         nb.z = Math.max(0, Math.min(CW - nb.d, nb.z));
//         nb.y = Math.max(0, Math.min(CH - nb.h, nb.y));
//       }
//       return nb;
//     };

//     const doRotate = (idx) => {
//       const v  = moViewRef.current;
//       const CL = moLRef.current, CW = moWRef.current, CH = moHRef.current;
//       setManualBoxes(prev => {
//         const base = [...(prev || autoBoxes)];
//         base[idx] = rotateOne(base[idx], v, CL, CW, CH);
//         return base;
//       });
//       isDirtyRef.current = true;
//     };

//     // ── drag ─────────────────────────────────────────────────────────────────
//     const onDown = (e) => {
//       const rect = canvas.getBoundingClientRect();
//       const mx = e.clientX - rect.left, my = e.clientY - rect.top;
//       const ri = hitRotate(mx, my);
//       if (ri !== -1) { doRotate(ri); return; }
//       const bi = hitBox(mx, my);
//       if (bi !== -1) {
//         const b = (manualBoxesRef.current || autoBoxes)[bi];
//         moDragRef.current = { active:true, boxIndex:bi, startMouseX:mx, startMouseY:my, startBoxX:b.x, startBoxY:b.y, startBoxZ:b.z };
//         canvas.style.cursor = "grabbing";
//       }
//     };

//     // ── collision helpers ─────────────────────────────────────────────────────
//     const EPS = 2;
//     const overlaps1d = (a1, a2, b1, b2) => a1 < b2 - EPS && a2 > b1 + EPS;
//     const collides3d = (b, allBoxes, skipIdx) => {
//       for (let i = 0; i < allBoxes.length; i++) {
//         if (i === skipIdx) continue;
//         const o = allBoxes[i];
//         if (
//           overlaps1d(b.x, b.x+b.w, o.x, o.x+o.w) &&
//           overlaps1d(b.y, b.y+b.h, o.y, o.y+o.h) &&
//           overlaps1d(b.z, b.z+b.d, o.z, o.z+o.d)
//         ) return true;
//       }
//       return false;
//     };
//     // Auto-stack: find the highest surface at b's x/z footprint
//     // Returns y=0 (floor) if nothing is below, or top surface of highest supporting box
//     const snapToStack = (b, allBoxes, skipIdx, CH) => {
//       if (b.h >= CH - EPS) return 0;
//       let highestY = 0;
//       for (let i = 0; i < allBoxes.length; i++) {
//         if (i === skipIdx) continue;
//         const o = allBoxes[i];
//         // Only consider boxes that are BELOW or AT floor level as supporters
//         // A box at same y level is a neighbor, not a supporter
//         if (overlaps1d(b.x, b.x+b.w, o.x, o.x+o.w) &&
//             overlaps1d(b.z, b.z+b.d, o.z, o.z+o.d)) {
//           // Only stack on top if the other box top surface is above floor
//           // and won't cause the moved box to exceed container
//           const topSurface = o.y + o.h;
//           if (topSurface + b.h <= CH + EPS) {
//             highestY = Math.max(highestY, topSurface);
//           }
//         }
//       }
//       return Math.max(0, Math.min(CH - b.h, highestY));
//     };

//     const onMove = (e) => {
//       const dr = moDragRef.current;
//       if (!dr.active) return;
//       const rect = canvas.getBoundingClientRect();
//       const mx = e.clientX - rect.left, my = e.clientY - rect.top;
//       const s  = moScaleRef.current;
//       const dx = (mx - dr.startMouseX) / s;
//       const dy = (my - dr.startMouseY) / s;
//       const v  = moViewRef.current;
//       const CL = moLRef.current, CW = moWRef.current, CH = moHRef.current;
//       setManualBoxes(prev => {
//         const base = [...(prev || autoBoxes)];
//         const b    = { ...base[dr.boxIndex] };
//         if (v === "Side") {
//           b.z = Math.max(0, Math.min(CW-b.d, dr.startBoxZ + dx));
//           b.y = Math.max(0, Math.min(CH-b.h, dr.startBoxY - dy));
//         } else if (v === "Front") {
//           b.x = Math.max(0, Math.min(CL-b.w, dr.startBoxX + dx));
//           b.y = Math.max(0, Math.min(CH-b.h, dr.startBoxY - dy));
//         } else {
//           // Top view: move x/z only
//           b.x = Math.max(0, Math.min(CL-b.w, dr.startBoxX + dx));
//           b.z = Math.max(0, Math.min(CW-b.d, dr.startBoxZ + dy));
//           // Always calculate correct y by finding what's below at this x/z position
//           // snapToStack returns 0 (floor) if nothing is below, or top of highest box
//           b.y = snapToStack(b, base, dr.boxIndex, CH);
//         }
//         if (collides3d(b, base, dr.boxIndex)) return prev;
//         base[dr.boxIndex] = b;
//         return base;
//       });
//       isDirtyRef.current = true;
//     };

//     const onUp = () => { moDragRef.current.active = false; canvas.style.cursor = "grab"; isDirtyRef.current = true; };
//     const onWheel = (e) => { e.preventDefault(); moScaleRef.current = Math.max(0.02, Math.min(0.5, moScaleRef.current * (e.deltaY < 0 ? 1.1 : 0.9))); };

//     canvas.addEventListener("mousedown", onDown);
//     window.addEventListener("mousemove", onMove);
//     window.addEventListener("mouseup",   onUp);
//     canvas.addEventListener("wheel",     onWheel, { passive: false });

//     return () => {
//       running = false;
//       cancelAnimationFrame(moAnimRef.current);
//       window.removeEventListener("resize",    resize);
//       window.removeEventListener("mousemove", onMove);
//       window.removeEventListener("mouseup",   onUp);
//       canvas.removeEventListener("mousedown", onDown);
//       canvas.removeEventListener("wheel",     onWheel);
//       moDrawRef.current = null;
//     };
//   }, [isManualOverride, cont]); // minimal deps — everything else read from refs

// // Force 3D canvas to redraw whenever manual positions change + persist to localStorage
//   useEffect(() => {
//     if (manualBoxes !== null) {
//       isDirtyRef.current = true;
//       if (manualBoxesKey) {
//         try {
//           localStorage.setItem(manualBoxesKey, JSON.stringify(manualBoxes));
//         } catch {}
//       }
//     }
//   }, [manualBoxes]);

//   // ── ADD ITEM & REPACK STATE ───────────────────────────────────────────────
//   const [showAddItem, setShowAddItem] = useState(false);
//   const [addItemForm, setAddItemForm] = useState({
//     product_name: "", cargo_type: "Cartons", color: "#22c55e",
//     length_mm: "", width_mm: "", height_mm: "", weight_kg: "", quantity: "1"
//   });
//   const [addItemLoading, setAddItemLoading] = useState(false);
//   const [addItemError, setAddItemError] = useState("");

//   const handleAddItemRepack = async () => {
//     const f = addItemForm;
//     if (!f.product_name || !f.length_mm || !f.width_mm || !f.height_mm || !f.weight_kg) {
//       setAddItemError("Please fill in all fields."); return;
//     }
//     setAddItemLoading(true); setAddItemError("");
//     try {
//       const newItem = {
//         product_name: f.product_name,
//         cargo_type: f.cargo_type,
//         type: f.cargo_type,
//         color: f.color,
//         length_mm: Number(f.length_mm),
//         width_mm: Number(f.width_mm),
//         height_mm: Number(f.height_mm),
//         weight_kg: Number(f.weight_kg),
//         quantity: Number(f.quantity) || 1,
//         shipment_name: shipmentName || "",
//         layers_count: 1, max_height_mm: 0, max_mass_kg: 0,
//         tilt_length: false, tilt_width: false, no_stack: false, rotate: true,
//       };
//       const allItems = [...cargoItems.map(ci => ({
//         ...ci,
//         length_mm: Number(ci.length_mm||0), width_mm: Number(ci.width_mm||0),
//         height_mm: Number(ci.height_mm||0), weight_kg: Number(ci.weight_kg||0),
//         quantity: Number(ci.quantity||0),
//       })), newItem];

//       const res = await fetch("http://localhost:5000/api/calculate-packing", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ container: cont, cargoItems: allItems }),
//       });
//       const data = await res.json();
//       if (!res.ok) throw new Error(data.message || "Packing failed");

//       // Navigate to fresh 3D view with new result
//       navigate("/3d-viewer", {
//         state: {
//           result: data,
//           selectedContainer: cont,
//           cargoItems: allItems,
//           placements: data.placements,
//         },
//         replace: true,
//       });
//     } catch (err) {
//       setAddItemError(err.message || "Failed. Check backend is running.");
//     } finally {
//       setAddItemLoading(false);
//     }
//   };

//   // ── SPACE OPTIMISATION: compact boxes when entering override ──────────────
// const compactBoxes = (srcBoxes) => {
//     const GAP = 1; // 1mm separation to prevent touching faces from z-fighting
//     const sorted = [...srcBoxes].map((b, i) => ({ ...b, _i: i }))
//       .sort((a, b) => a.x - b.x || a.z - b.z || a.y - b.y);
//     const placed = [];
//     for (const box of sorted) {
//       const xCandidates = [0, ...placed.map(o => o.x + o.w + GAP)].filter(x => x + box.w <= L + 1);
//       const zCandidates = [0, ...placed.map(o => o.z + o.d + GAP)].filter(z => z + box.d <= W + 1);
//       let bestX = box.x, bestY = box.y, bestZ = box.z, bestScore = Infinity;
//       for (const tx of xCandidates) {
//         for (const tz of zCandidates) {
//           if (tx + box.w > L + 1 || tz + box.d > W + 1) continue;
//           let ty = 0;
//           for (const o of placed) {
//             const xOver = tx < o.x + o.w - GAP && tx + box.w > o.x + GAP;
//             const zOver = tz < o.z + o.d - GAP && tz + box.d > o.z + GAP;
//             if (xOver && zOver) ty = Math.max(ty, o.y + o.h + GAP);
//           }
//           if (ty + box.h > H + 1) continue;
//           const collides = placed.some(o =>
//             tx < o.x + o.w - GAP && tx + box.w > o.x + GAP &&
//             tz < o.z + o.d - GAP && tz + box.d > o.z + GAP &&
//             ty < o.y + o.h - GAP && ty + box.h > o.y + GAP
//           );
//           if (collides) continue;
//           const score = ty * 100000 + tx * 1000 + tz;
//           if (score < bestScore) { bestScore = score; bestX = tx; bestY = ty; bestZ = tz; }
//         }
//       }
//       placed.push({ ...box, x: bestX, y: bestY, z: bestZ });
//     }
//     const result = new Array(srcBoxes.length);
//     placed.forEach(b => { result[b._i] = b; });
//     return result;
//   };

// const validateManualLayout = (items) => {
//     const EPS = 2;
//     const warnings = [];
//     // Detect floating / unsupported boxes
// // Floating check: warn ONLY when more than 50% of box base is unsupported
// boxes.forEach((box, index) => {
//   const boxY = Number(box.y || 0);

//   // Box touching container floor is NOT floating
//   if (boxY <= 5) return;

//   const boxArea = Number(box.w || box.width || 0) * Number(box.d || box.depth || 0);
//   if (boxArea <= 0) return;

//   let supportedArea = 0;

//   boxes.forEach((below, belowIndex) => {
//     if (belowIndex === index) return;

//     const belowTop =
//       Number(below.y || 0) + Number(below.h || below.height || 0);

//     // Only consider boxes directly under this box
//     const isDirectlyBelow = Math.abs(belowTop - boxY) <= 10;
//     if (!isDirectlyBelow) return;

//     const boxLeft = Number(box.x || 0);
//     const boxRight = boxLeft + Number(box.w || box.width || 0);
//     const boxFront = Number(box.z || 0);
//     const boxBack = boxFront + Number(box.d || box.depth || 0);

//     const belowLeft = Number(below.x || 0);
//     const belowRight = belowLeft + Number(below.w || below.width || 0);
//     const belowFront = Number(below.z || 0);
//     const belowBack = belowFront + Number(below.d || below.depth || 0);

//     const overlapW = Math.max(
//       0,
//       Math.min(boxRight, belowRight) - Math.max(boxLeft, belowLeft)
//     );

//     const overlapD = Math.max(
//       0,
//       Math.min(boxBack, belowBack) - Math.max(boxFront, belowFront)
//     );

//     supportedArea += overlapW * overlapD;
//   });

//   const supportedPercent = supportedArea / boxArea;

//   // Warning only when more than 50% is floating
//   if (supportedPercent < 0.5) {
//     warnings.push({
//       type: "Floating",
//       message: `${box.label || box.product_name || `Box ${index + 1}`} is more than 50% floating. Please align it properly.`
//     });
//   }
// });

//     const overlaps1d = (a1, a2, b1, b2) =>
//       a1 < b2 - EPS && a2 > b1 + EPS;

//     const getName = (box, index) =>
//       box.product_name || box.label || `Box ${index + 1}`;

//     items.forEach((box, i) => {
//       const name = getName(box, i);

//       // 1) Outside container check
//       if (
//         box.x < -EPS ||
//         box.y < -EPS ||
//         box.z < -EPS ||
//         box.x + box.w > L + EPS ||
//         box.y + box.h > H + EPS ||
//         box.z + box.d > W + EPS
//       ) {
//         warnings.push({
//           type: "outside",
//           name,
//           message: `"${name}" is outside the container boundary.`,
//         });
//       }

//       // 2) Floating check: if y > 0, there must be another box exactly below
//       if (box.y > EPS) {
//         const hasSupport = items.some((base, j) => {
//           if (i === j) return false;

//           const baseTop = base.y + base.h;
//           const isTouchingTop = Math.abs(baseTop - box.y) <= EPS;

//           const hasXSupport = overlaps1d(
//             box.x,
//             box.x + box.w,
//             base.x,
//             base.x + base.w
//           );

//           const hasZSupport = overlaps1d(
//             box.z,
//             box.z + box.d,
//             base.z,
//             base.z + base.d
//           );

//           return isTouchingTop && hasXSupport && hasZSupport;
//         });

//         if (!hasSupport) {
//           warnings.push({
//             type: "floating",
//             name,
//             message: `"${name}" is floating. It has no proper support below it.`,
//           });
//         }
//       }

//       // 3) Overlap check with other boxes
//       for (let j = i + 1; j < items.length; j++) {
//         const other = items[j];
//         const otherName = getName(other, j);

//         const isOverlapping =
//           overlaps1d(box.x, box.x + box.w, other.x, other.x + other.w) &&
//           overlaps1d(box.y, box.y + box.h, other.y, other.y + other.h) &&
//           overlaps1d(box.z, box.z + box.d, other.z, other.z + other.d);

//         if (isOverlapping) {
//           warnings.push({
//             type: "overlap",
//             name,
//             message: `"${name}" overlaps with "${otherName}".`,
//           });
//         }
//       }
//     });

//     return warnings;
//   };
//   // Show popup automatically when entering 3D Viewer if boxes are floating / overlapping / outside
// useEffect(() => {
//   // DO NOT show warning while inside manual override
//   if (isManualOverride) return;

//   // show only once after returning to 3D
//   if (!cont) return;
//   if (entryWarningShownRef.current) return;

//   // only validate manual arrangement after Apply & Back to 3D
//   if (!manualBoxes || manualBoxes.length === 0) return;

//   const warnings = validateManualLayout(manualBoxes);

//   if (warnings.length > 0) {
//     entryWarningShownRef.current = true;

//     setLayoutWarnings(warnings);

//     // small delay feels natural after returning to 3D
//     setTimeout(() => {
//       setShowLayoutWarning(true);
//     }, 300);
//   }
// }, [isManualOverride, manualBoxes, cont]);

// const handleManualOverrideToggle = () => {
//     if (!isManualOverride) {
//       if (manualBoxes === null) {
//         // Use autoBoxes directly — do NOT compact/rearrange them
//         // compactBoxes changes positions which confuses users
//         setManualBoxes([...autoBoxes]);
//       }
//       setShowLayoutWarning(false);
//       setIsManualOverride(true);
//     } else {
//       // Validate manual layout before returning to 3D
//     const current = manualBoxesRef.current || manualBoxes || autoBoxes;
//   const warnings = validateManualLayout(current);

//   setManualBoxes(current);      // ← this is correct, keep it
//   setIsManualOverride(false);
//   setActiveView("3D");
//   isDirtyRef.current = true;


//       if (warnings.length > 0) {
//         setLayoutWarnings(warnings);
//         setShowLayoutWarning(true);
//       }

//       // Write orientation changes back to the database
//       current.forEach((mb) => {
//         const id = mb._original?.item_id;
//         if (!id) return;
//         const orig = autoBoxes.find((ab) => ab._original?.item_id === id);
//         if (!orig) return;
//         const dimChanged =
//           Math.round(mb.w) !== Math.round(orig.w) ||
//           Math.round(mb.h) !== Math.round(orig.h) ||
//           Math.round(mb.d) !== Math.round(orig.d);
//         if (!dimChanged) return;
//         const wasTilted =
//           Math.round(mb.h) === Math.round(orig.w) ||
//           Math.round(mb.h) === Math.round(orig.d);
//         const wasRotated =
//           Math.round(mb.w) === Math.round(orig.d) ||
//           Math.round(mb.d) === Math.round(orig.w);
//         const o = mb._original || {};
//         fetch(`http://localhost:5000/api/cargo/${id}`, {
//           method: "PUT",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({
//             shipment_name: o.shipment_name || "",
//             product_name:  o.product_name  || mb.label || "",
//             cargo_type:    o.cargo_type    || mb.cargo_type || "Cartons",
//             color:         mb.color        || o.color || "#1565c0",
//             length_mm:     Math.round(mb.w),
//             height_mm:     Math.round(mb.h),
//             width_mm:      Math.round(mb.d),
//             weight_kg:     o.weight_kg     || 0,
//             quantity:      o.quantity      || 1,
//             layers_count:  o.layers_count  || 1,
//             max_height_mm: o.max_height_mm || 0,
//             max_mass_kg:   o.max_mass_kg   || 0,
//             tilt_length:   wasTilted  ? 1 : 0,
//             tilt_width:    0,
//             no_stack:      o.no_stack || false,
//             rotate:        wasRotated ? 1 : 0,
//           }),
//         }).catch(() => {});
//       });
//     }
//   };

// const handleResetOverride = () => {
//   // Reset restores fresh auto-packing positions and clears ALL saved data
//   setManualBoxes([...autoBoxes]);
//   localStorage.removeItem("rejectedItemsCleared");

//   // clear old fitted success message
//   setFitError("");

//   // bring rejected item button back
//   setRejectedItems(result.rejected || []);

//   // remove saved fitted layout, because user reset positions
//   if (savedLayoutKey) {
//     localStorage.removeItem(savedLayoutKey);
//   }
//   if (manualBoxesKey) {
//     localStorage.removeItem(manualBoxesKey);
//   }

//   isDirtyRef.current = true;
//   moIsDirtyRef.current = true;
// };

//   const setView = (v) => {
//     setActiveView(v);
//     const cam = camRef.current;
//     if (v === "3D")    { cam.angleY = -0.55; cam.angleX = 0.32;  cam.scale = 0.12; }
//     if (v === "Front") { cam.angleY = 0;     cam.angleX = 0;     cam.scale = 0.09; }
//     if (v === "Top")   { cam.angleY = 0;     cam.angleX = 1.4;   cam.scale = 0.09; }
//     if (v === "Side")  { cam.angleY = 1.57;  cam.angleX = 0;     cam.scale = 0.11; }
//     isDirtyRef.current = true;
//   };

//   const packedCount = placements.length;
//   const packedWeight = cargoItems.reduce(
//     (sum, item) => sum + Number(item.weight_kg || 0) * Number(item.quantity || 0), 0
//   );

//   const handlePrintImage = () => {
//     const canvas = canvasRef.current;
//     if (!canvas || !cont) return;
//     const PANEL_W = 320, PADDING = 24;
//     const canvasH = canvas.height, canvasW = canvas.width;
//     const out = document.createElement("canvas");
//     out.width = PANEL_W + canvasW; out.height = canvasH;
//     const ctx = out.getContext("2d");
//     ctx.fillStyle = "#f0f3fa"; ctx.fillRect(0, 0, out.width, out.height);
//     ctx.drawImage(canvas, PANEL_W, 0, canvasW, canvasH);
//     ctx.fillStyle = "#1a2744"; ctx.fillRect(0, 0, PANEL_W, canvasH);
//     const text = (str, x, y, size, color, bold = false) => {
//       ctx.font = `${bold ? "700" : "400"} ${size}px 'DM Sans','Segoe UI',sans-serif`;
//       ctx.fillStyle = color; ctx.fillText(String(str ?? ""), x, y);
//     };
//     const line = (x1, y1, x2, y2, color, width = 1) => {
//       ctx.strokeStyle = color; ctx.lineWidth = width; ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
//     };
//     const accentBar = (y) => { ctx.fillStyle = "#e67e22"; ctx.fillRect(PADDING, y - 12, 3, 14); };
//     let cy2 = PADDING + 20;
//     text("⬡ CargoSet", PADDING + 8, cy2, 18, "#e67e22", true); cy2 += 10;
//     line(PADDING, cy2, PANEL_W - PADDING, cy2, "rgba(255,255,255,0.1)"); cy2 += 20;
//     if (shipmentName) {
//       ctx.fillStyle = "rgba(249,115,22,0.15)"; ctx.beginPath(); ctx.roundRect(PADDING, cy2-14, PANEL_W-PADDING*2, 26, 6); ctx.fill();
//       text(String(shipmentName).toUpperCase(), PADDING+8, cy2+6, 13, "#f97316", true); cy2 += 38;
//     }
//     accentBar(cy2); text("CONTAINER", PADDING+8, cy2, 10, "#8899bb", true); cy2 += 18;
//     [
//       ["Name", cont.container_name || cont.name || ""],
//       ["Length", `${cont.internal_length_mm || cont.length_mm || ""} mm`],
//       ["Width",  `${cont.internal_width_mm  || cont.width_mm  || ""} mm`],
//       ["Height", `${cont.internal_height_mm || cont.height_mm || ""} mm`],
//       ["Max Payload", `${cont.max_payload_kg || ""} kg`],
//     ].forEach(([label, val]) => {
//       text(label, PADDING+4, cy2, 11, "#8899bb");
//       text(val, PANEL_W-PADDING-ctx.measureText(String(val)).width-4, cy2, 11, "#ffffff", true);
//       cy2 += 18; line(PADDING, cy2-4, PANEL_W-PADDING, cy2-4, "rgba(255,255,255,0.06)");
//     });
//     cy2 += 22; accentBar(cy2); text("RESULTS", PADDING+10, cy2, 10, "#8899bb"); cy2 += 20;
//     [
//       ["Packed Boxes", packedCount],
//       ["Total Placements", placements.length],
//       ["Total Weight", `${packedWeight.toLocaleString()} kg`],
//       ["Container Type", getShortContainerName(cont.container_name || cont.name || "")],
//     ].forEach(([label, val]) => {
//       ctx.fillStyle = "rgba(255,255,255,0.06)"; ctx.beginPath(); ctx.roundRect(PADDING, cy2-2, PANEL_W-PADDING*2, 28, 5); ctx.fill();
//       text(label, PADDING+8, cy2+13, 10, "#8899bb");
//       text(val, PANEL_W-PADDING-ctx.measureText(String(val)).width-18, cy2+13, 12, "#e67e22", true);
//       cy2 += 34;
//     });
//     if (odc || overweight) {
//       cy2 += 4; accentBar(cy2); text("WARNINGS", PADDING+8, cy2, 10, "#8899bb", true); cy2 += 18;
//       if (odc && overWidthMm > 0) {
//         ctx.fillStyle = "rgba(239,68,68,0.15)"; ctx.beginPath(); ctx.roundRect(PADDING, cy2-2, PANEL_W-PADDING*2, 22, 4); ctx.fill();
//         text(`Over Width: +${(overWidthMm/10).toFixed(0)} cm`, PADDING+8, cy2+13, 11, "#f87171", true); cy2 += 28;
//       }
//       if (odc && overHeightMm > 0) {
//         ctx.fillStyle = "rgba(59,130,246,0.15)"; ctx.beginPath(); ctx.roundRect(PADDING, cy2-2, PANEL_W-PADDING*2, 22, 4); ctx.fill();
//         text(`Over Height: +${(overHeightMm/10).toFixed(0)} cm`, PADDING+8, cy2+13, 11, "#93c5fd", true); cy2 += 28;
//       }
//       if (overweight && overweightKg > 0) {
//         ctx.fillStyle = "rgba(245,158,11,0.15)"; ctx.beginPath(); ctx.roundRect(PADDING, cy2-2, PANEL_W-PADDING*2, 22, 4); ctx.fill();
//         text(`Over Weight: +${overweightKg.toFixed(0)} kg`, PADDING+8, cy2+13, 11, "#fbbf24", true); cy2 += 28;
//       }
//     }
//     cy2 += 22; accentBar(cy2); text("LEGEND", PADDING+10, cy2, 10, "#8899bb"); cy2 += 20;
// Object.values(
//       boxes.reduce((acc, item) => {
//         const key = item.product_name || item.label || "Item";
//         if (!acc[key]) acc[key] = { product_name: key, color: item.color || "#1565c0", count: 0 };
//         acc[key].count += 1;
//         return acc;
//       }, {})
//     ).forEach(({ product_name, color, count }) => {
//       if (cy2 > canvasH - 40) return;
//       ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(PADDING+4, cy2-9, 12, 12, 3); ctx.fill();
//       text(product_name, PADDING+22, cy2, 11, "#dde");
//       text(`×${count}`, PANEL_W-PADDING-28, cy2, 11, "#8899bb", true);
//       line(PADDING, cy2+6, PANEL_W-PADDING, cy2+6, "rgba(255,255,255,0.06)"); cy2 += 22;
//     });
//     text(
//       new Date().toLocaleString("en-US", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" }),
//       PADDING+4, canvasH-14, 10, "rgba(136,153,187,0.7)"
//     );
//     line(PANEL_W, 0, PANEL_W, canvasH, "rgba(255,255,255,0.15)", 1);
//     const link = document.createElement("a");
//     link.href = out.toDataURL("image/png");
//     link.download = `${shipmentName || "container_packing"}.png`;
//     link.click();
//   };

//   if (!cont) {
//     return (
//       <div style={styles.noData}>
//         <p>No result data found.</p>
//         <button style={styles.backBtn} onClick={() => navigate("/cargo-list", { state: { viewShipmentName: shipmentName || null } })}>
//           ← Back to Cargo List
//         </button>
//       </div>
//     );
//   }

// return (
//   <div style={styles.root}>

// <nav style={styles.nav}>
//   <div style={styles.navLogo}>
//     <span style={styles.navLogoIcon}>⬡</span>
//     <span>CargoSet</span>
//   </div>

//   {!isSharedView && (
//     <div style={styles.navTabs}>
//       {["Dashboard", "Cargo Items", "CostAnalysis", "3D Viewer"].map((t) => (
//         <button
//           key={t}
//           style={{ ...styles.navTab, ...(t === "3D Viewer" ? styles.navTabActive : {}) }}
//           onClick={() => {
//             if (t === "Cargo Items") navigate("/cargo-list", { state: { viewShipmentName: shipmentName || null } });
//             if (t === "Dashboard") navigate("/dashboard");
//             if (t === "CostAnalysis") navigate("/CostAnalysis", { state: { cargoItems, selectedContainer: cont, shipmentName } });
//           }}
//         >
//           {t}
//         </button>
//       ))}
//     </div>
//   )}

//   <div style={{ marginLeft: "auto" }}>
//     <button style={styles.printBtn} onClick={handlePrintImage}>
//       ↓ Export PNG
//     </button>
//   </div>
// {(rejectedItems.length > 0 && manualBoxes && isManualOverride) && (
//   <div style={{display:"flex",alignItems:"center",gap:6}}>
// <button
//       onClick={handleFitRejected}
//       disabled={fitLoading || fitError.startsWith("✅") || rejectedItems.length === 0}
//       style={{
//         ...styles.printBtn,
//         background: fitError.startsWith("✅")
//           ? "linear-gradient(135deg,#16a34a,#22c55e)"
//           : fitError.startsWith("⚠️")
//             ? "linear-gradient(135deg,#d97706,#f59e0b)"
//             : fitLoading
//               ? "#86efac"
//               : "linear-gradient(135deg,#16a34a,#22c55e)",
//         color:"#fff",
//         border:"none",
//         fontWeight:700,
//         padding:"6px 16px",
//         boxShadow:"0 2px 8px rgba(22,163,74,0.35)",
//         cursor: fitLoading || fitError.startsWith("✅") || rejectedItems.length === 0 ? "not-allowed" : "pointer"
//       }}
//     >
// {fitLoading
//         ? "⏳ Fitting..."
//         : rejectedItems.length === 0
//           ? "✅ All Items Fitted"
//           : fitError.includes("Still Can't Fit") || fitError.includes("still couldn't fit") || fitError.includes("still can't fit")
//             ? `⚠️ ${rejectedItems.length} Still Can't Fit`
//             : `🔧 Fit ${rejectedItems.length} Rejected Item${rejectedItems.length>1?"s":""}`}
//     </button>

// {fitError && (
//       <span
//         style={{
//           fontSize:11,
//           color:fitError.startsWith("✅") ? "#16a34a" : "#d97706",
//           maxWidth:300,
//           whiteSpace:"nowrap"
//         }}
//       >
//         {fitError.includes("still can't fit") || fitError.includes("still couldn't fit")
//           ? `⚠️ ${rejectedItems.length} item(s) couldn't fit — rearrange boxes & try again`
//           : fitError}
//       </span>
//     )}
//   </div>
// )}
//         {/* Save Layout button — only visible in 3D view (not during Manual Override) */}
//         {!isSharedView && !isManualOverride && (
          
//           <button
//             onClick={layoutSaved ? undefined : handleSaveLayout}
//             style={{
//               ...styles.printBtn,
//               background: layoutSaved
//                 ? "linear-gradient(135deg,#16a34a,#22c55e)"
//                 : "linear-gradient(135deg,#2563eb,#1d4ed8)",
//               color: "#fff",
//               border: "none",
//               fontWeight: 700,
//               padding: "6px 16px",
//               boxShadow: layoutSaved
//                 ? "0 2px 8px rgba(22,163,74,0.35)"
//                 : "0 2px 8px rgba(37,99,235,0.35)",
//               transition: "all 0.3s",
//               minWidth: 110,
//             }}
//           >
//             {layoutSaved ? "✅ Completed!" : "💾 Completed"}
//           </button>
//         )}
//         {/* {!isSharedView && (
//         <button
        
//           onClick={handleManualOverrideToggle}
//           style={{
//             ...styles.printBtn,
//             background: isManualOverride ? "linear-gradient(135deg,#dc2626,#ef4444)" : "linear-gradient(135deg,#f59e0b,#f97316)",
//             color: "#fff",
//             border: "none",
//             fontWeight: 700,
//             padding: "6px 16px",
//             boxShadow: isManualOverride ? "0 2px 8px rgba(220,38,38,0.35)" : "0 2px 8px rgba(245,158,11,0.35)",
//           }}
//         >
//           {isManualOverride ? "✅ Apply & Back to 3D" : "✏️ Manual Override"}
//         </button>
//         )} */}
//       </nav>

//       <div style={styles.body}>
// <aside style={styles.panel}>
//           <Section title="Container">
//             <Field label="Name" unit="" value={cont.container_name || cont.name || ""} />
//             <Field label="Length" unit="mm" value={cont.internal_length_mm || cont.length_mm || ""} />
//             <Field label="Width"  unit="mm" value={cont.internal_width_mm  || cont.width_mm  || ""} />
//             <Field label="Height" unit="mm" value={cont.internal_height_mm || cont.height_mm || ""} />
//             <Field label="Max Payload" unit="kg" value={cont.max_payload_kg || ""} />
//           </Section>
//           {!isSharedView && (
//           <button style={styles.calcBtn} onClick={() => navigate("/cargo-list", { state: { viewShipmentName: shipmentName || null } })}>
//             ⚡ Recalculate Packing
//           </button>
//           )}
// <Section title="View Presets">
//   <div style={styles.viewGrid}>
//     {["3D"].map((v) => (
//       <button
//         key={v}
//         style={{
//           ...styles.viewBtn,
//           ...(activeView === v ? styles.viewBtnActive : {}),
//         }}
//         onClick={() => setView(v)}
//       >
//         {v}
//       </button>
//     ))}
//   </div>
// </Section>
//           <Section title="Results">
//             <div style={styles.statsGrid}>
//               <Stat val={packedCount} label="Packed Boxes" />
//               <Stat val={placements.length} label="Placements" />
//               <Stat val={packedWeight.toLocaleString()} label="Weight kg" />
//               <Stat val={getShortContainerName(cont.container_name || cont.name || "")} label="Container" />
//             </div>
//           </Section>
//           <Section title="Legend">
// {boxes.length === 0 ? (
//               <div style={{ color: "#94a3b8", fontSize: 12 }}>No packed items</div>
//             ) : (
//               Object.values(
//                 boxes.reduce((acc, item) => {
//                   const key = item.product_name || item.label || "Item";
//                   if (!acc[key]) acc[key] = { product_name: key, color: item.color || "#1565c0", count: 0 };
//                   acc[key].count += 1;
//                   return acc;
//                 }, {})
//               ).map((d, i) => (
//                 <div key={i} style={styles.legendRow}>
//                   <div style={{ ...styles.legendDot, background: d.color }} />
//                   <span style={styles.legendName}>{d.product_name}</span>
//                   <span style={styles.legendCount}>×{d.count}</span>
//                 </div>
//               ))
//             )}
//           </Section>
//           </aside>


//         {/* canvasWrap holds BOTH canvases stacked; we show/hide via visibility so
//             the 3D canvas always has real pixel dimensions and never loses its loop */}
//         <div style={{ ...styles.canvasWrap, position: "relative" }}>

//           {/* ── 3D canvas — always in DOM, just invisible during override ── */}
//           <canvas
//             ref={canvasRef}
//             style={{
//               ...styles.canvas,
//               position: "absolute", inset: 0,
//               visibility: isManualOverride ? "hidden" : "visible",
//               pointerEvents: isManualOverride ? "none" : "auto",
//             }}
//           />

//           {/* 3D overlays — only when NOT in override */}
//           {!isManualOverride && (
//             <>
//               <div style={{ ...styles.overlayTL, position: "absolute", zIndex: 5 }}>
//                 <Pill>📦 {(cont.internal_length_mm || cont.length_mm || 0)} × {(cont.internal_width_mm || cont.width_mm || 0)} × {(cont.internal_height_mm || cont.height_mm || 0)} mm</Pill>
//                 <Pill accent>{cont.container_name || cont.name || ""}</Pill>
//                 {shipmentName && <Pill shipment>{String(shipmentName).toUpperCase()}</Pill>}
//                 {odc && overWidthMm > 0  && <Pill warning>OW +{(overWidthMm/10).toFixed(0)} cm</Pill>}
//                 {odc && overHeightMm > 0 && <Pill info>OH +{(overHeightMm/10).toFixed(0)} cm</Pill>}
//                 {overweight && overweightKg > 0 && <Pill danger>OWT +{overweightKg.toFixed(0)} kg</Pill>}
//               </div>
//               <div style={{ ...styles.hint, position: "absolute", zIndex: 5 }}>🖱 Drag to rotate · Scroll to zoom</div>
//               <div style={{ ...styles.zoomBtns, position: "absolute", zIndex: 5 }}>
//                 {[
//                   { icon: "+", action: () => { camRef.current.scale = Math.min(1.5, camRef.current.scale + 0.06); isDirtyRef.current = true; } },
//                   { icon: "−", action: () => { camRef.current.scale = Math.max(0.04, camRef.current.scale - 0.06); isDirtyRef.current = true; } },
//                   { icon: "↺", action: () => setView("3D") },
//                 ].map(({ icon, action }) => (
//                   <button key={icon} style={styles.zoomBtn} onClick={action}>{icon}</button>
//                 ))}
//               </div>
//             </>
//           )}

//           {/* ── 2D Manual Override canvas — overlaid on top ── */}
//           {isManualOverride && (
//             <div style={{ position: "absolute", inset: 0, zIndex: 10 }}>
//               {/* View selector tabs */}
//               <div style={{
//                 position: "absolute", top: 14, right: 14, zIndex: 20,
//                 display: "flex", gap: 6, background: "rgba(255,255,255,0.95)",
//                 border: "1px solid rgba(0,0,0,0.1)", borderRadius: 10, padding: "5px 8px",
//                 boxShadow: "0 2px 12px rgba(0,0,0,0.12)", backdropFilter: "blur(8px)",
//               }}>
//                 {["Top", "Front", "Side"].map(v => (
//                   <button key={v} onClick={() => setMoView(v)} style={{
//                     padding: "5px 14px", borderRadius: 7, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 12,
//                     background: moView === v ? "linear-gradient(135deg,#f59e0b,#f97316)" : "#f1f5f9",
//                     color: moView === v ? "#fff" : "#64748b",
//                     boxShadow: moView === v ? "0 2px 6px rgba(245,158,11,0.3)" : "none",
//                     transition: "all 0.15s",
//                   }}>{v}</button>
//                 ))}
//               </div>

//               {/* Reset button */}
//               <button onClick={handleResetOverride} style={{
//                 position: "absolute", top: 14, left: 14, zIndex: 20,
//                 padding: "6px 14px", background: "rgba(255,255,255,0.95)", border: "1px solid rgba(0,0,0,0.1)",
//                 borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 12, color: "#64748b",
//                 boxShadow: "0 2px 8px rgba(0,0,0,0.1)", backdropFilter: "blur(8px)",
//               }}>↺ Reset Positions</button>

//               {/* Info banner */}
//               <div style={{
//                 position: "absolute", top: 14, left: "50%", transform: "translateX(-50%)", zIndex: 20,
//                 background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.4)",
//                 borderRadius: 20, padding: "5px 16px", fontSize: 12, fontWeight: 600, color: "#b45309",
//                 backdropFilter: "blur(8px)", whiteSpace: "nowrap",
//               }}>
//                 ✏️ Manual Override Mode — drag boxes to reposition · scroll to zoom
//               </div>

//               <canvas
//                 ref={moCanvasRef}
//                 style={{ width: "100%", height: "100%", display: "block", cursor: "grab" }}
//               />
//             </div>
//           )}
//         </div>
//       </div>

// {toast && (
//         <div style={{
//           position:"fixed", bottom:32, left:"50%", transform:"translateX(-50%)",
//           zIndex:9999, background: toast.type === "success" ? "#16a34a" : "#dc2626",
//           color:"#fff", padding:"12px 28px", borderRadius:12, fontSize:14,
//           fontWeight:600, boxShadow:"0 4px 20px rgba(0,0,0,0.18)",
//           display:"flex", alignItems:"center", gap:10, whiteSpace:"nowrap",
//         }}>
//           {toast.message}
//         </div>
//       )}

//       {/* ── ADD ITEM & REPACK MODAL ── */}
// {/* ── LAYOUT WARNING MODAL ── */}
//       {showLayoutWarning && (
//         <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center"}}>
//           <div style={{background:"#fff",borderRadius:16,padding:"28px 32px",width:460,maxWidth:"95vw",boxShadow:"0 8px 40px rgba(0,0,0,0.22)",position:"relative",fontFamily:"'DM Sans','Segoe UI',sans-serif"}}>
//             <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
//               <div style={{width:44,height:44,borderRadius:10,background:"#FEF3C7",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>⚠️</div>
//               <div>
//                 <div style={{fontSize:16,fontWeight:700,color:"#0f172a"}}>Box Placement Warning</div>
//                 <div style={{fontSize:12,color:"#64748b",marginTop:2}}>{layoutWarnings.length} issue{layoutWarnings.length > 1 ? "s" : ""} found: overlapped, floating, or outside container</div>
//               </div>
//             </div>

//             <div style={{maxHeight:280,overflowY:"auto",display:"flex",flexDirection:"column",gap:8,marginBottom:20}}>
//               {layoutWarnings.map((w, i) => (
//                 <div key={i} style={{
//                   padding:"12px 14px",
//                   borderRadius:8,
//                   background: w.type === "overlap" ? "#FEF2F2" : w.type === "outside" ? "#F0F9FF" : "#FFFBEB",
//                   border: `1px solid ${w.type === "overlap" ? "#FECACA" : w.type === "outside" ? "#BAE6FD" : "#FDE68A"}`,
//                   display:"flex",gap:10,alignItems:"flex-start"
//                 }}>
//                   <span style={{fontSize:18,flexShrink:0}}>{w.type === "overlap" ? "🔴" : w.type === "outside" ? "🔵" : "🟡"}</span>
//                   <div>
//                     <div style={{fontSize:12,fontWeight:700,color: w.type === "overlap" ? "#991B1B" : w.type === "outside" ? "#075985" : "#92400E",marginBottom:2}}>
//                       {w.type === "overlap" ? "Overlap" : w.type === "outside" ? "Outside Container" : "Floating"}
//                     </div>
//                     <div style={{fontSize:12,color: w.type === "overlap" ? "#B91C1C" : w.type === "outside" ? "#0369A1" : "#B45309"}}>{w.message}</div>
//                   </div>
//                 </div>
//               ))}
//             </div>

//             <div style={{fontSize:12,color:"#64748b",background:"#f8fafc",borderRadius:8,padding:"10px 12px",marginBottom:20}}>
//               💡 Go back to Manual Override to fix these issues, or dismiss to keep the current layout as-is.
//             </div>

//             <div style={{display:"flex",gap:10}}>
//               <button
//                 onClick={() => { setShowLayoutWarning(false); setIsManualOverride(true); }}
//                 style={{flex:1,padding:"9px 0",background:"linear-gradient(135deg,#f59e0b,#f97316)",border:"none",borderRadius:8,cursor:"pointer",fontSize:13,fontWeight:700,color:"#fff"}}>
//                 ✏️ Fix in Override
//               </button>
//               <button
//                 onClick={() => setShowLayoutWarning(false)}
//                 style={{flex:1,padding:"9px 0",background:"#f1f5f9",border:"1px solid rgba(0,0,0,0.1)",borderRadius:8,cursor:"pointer",fontSize:13,fontWeight:600,color:"#64748b"}}>
//                 Dismiss
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* ── ADD ITEM & REPACK MODAL ── */}
//       {showAddItem && (        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center"}}>
//           <div style={{background:"#fff",borderRadius:16,padding:"28px 32px",width:400,boxShadow:"0 8px 40px rgba(0,0,0,0.18)",position:"relative"}}>
//             <button onClick={()=>setShowAddItem(false)} style={{position:"absolute",top:14,right:16,background:"none",border:"none",fontSize:20,cursor:"pointer",color:"#64748b"}}>✕</button>
//             <div style={{fontWeight:700,fontSize:16,marginBottom:4,color:"#0f172a"}}>+ Add Item & Repack</div>
//             <div style={{fontSize:12,color:"#64748b",marginBottom:16}}>The packing engine will re-optimize all items including this new one.</div>
//             {[
//               {label:"Product Name",key:"product_name",type:"text",ph:"e.g. Green Cargo Box"},
//               {label:"Length (mm)", key:"length_mm",   type:"number",ph:"e.g. 1000"},
//               {label:"Width (mm)",  key:"width_mm",    type:"number",ph:"e.g. 500"},
//               {label:"Height (mm)", key:"height_mm",   type:"number",ph:"e.g. 800"},
//               {label:"Weight (kg)", key:"weight_kg",   type:"number",ph:"e.g. 200"},
//               {label:"Quantity",    key:"quantity",    type:"number",ph:"1"},
//             ].map(({label,key,type,ph})=>(
//               <div key={key} style={{marginBottom:10}}>
//                 <label style={{fontSize:11,color:"#64748b",display:"block",marginBottom:2}}>{label}</label>
//                 <input type={type} placeholder={ph} value={addItemForm[key]}
//                   onChange={e=>setAddItemForm(p=>({...p,[key]:e.target.value}))}
//                   style={{width:"100%",padding:"7px 10px",border:"1px solid rgba(0,0,0,0.15)",borderRadius:7,fontSize:13,outline:"none",boxSizing:"border-box"}}/>
//               </div>
//             ))}
//             <div style={{marginBottom:10}}>
//               <label style={{fontSize:11,color:"#64748b",display:"block",marginBottom:2}}>Cargo Type</label>
//               <select value={addItemForm.cargo_type} onChange={e=>setAddItemForm(p=>({...p,cargo_type:e.target.value}))}
//                 style={{width:"100%",padding:"7px 10px",border:"1px solid rgba(0,0,0,0.15)",borderRadius:7,fontSize:13,outline:"none",boxSizing:"border-box"}}>
//                 {["Cartons","Sacks","Jumbo Bags","Barrels","Drums","Pipes"].map(t=><option key={t}>{t}</option>)}
//               </select>
//             </div>
//             <div style={{marginBottom:16,display:"flex",alignItems:"center",gap:8}}>
//               <label style={{fontSize:11,color:"#64748b"}}>Color</label>
//               <input type="color" value={addItemForm.color} onChange={e=>setAddItemForm(p=>({...p,color:e.target.value}))}
//                 style={{width:34,height:30,border:"1px solid rgba(0,0,0,0.15)",borderRadius:6,cursor:"pointer",padding:2}}/>
//             </div>
//             {addItemError && <div style={{fontSize:12,color:"#dc2626",background:"#fef2f2",border:"1px solid #fecaca",borderRadius:6,padding:"7px 10px",marginBottom:12}}>{addItemError}</div>}
//             <div style={{display:"flex",gap:10}}>
//               <button onClick={()=>setShowAddItem(false)} style={{flex:1,padding:"9px 0",background:"#f1f5f9",border:"1px solid rgba(0,0,0,0.1)",borderRadius:8,cursor:"pointer",fontSize:13,fontWeight:600,color:"#64748b"}}>Cancel</button>
//               <button onClick={handleAddItemRepack} disabled={addItemLoading}
//                 style={{flex:2,padding:"9px 0",background:addItemLoading?"#86efac":"linear-gradient(135deg,#16a34a,#22c55e)",border:"none",borderRadius:8,cursor:addItemLoading?"not-allowed":"pointer",fontSize:13,fontWeight:700,color:"#fff"}}>
//                 {addItemLoading?"⏳ Repacking...":"✓ Add & Repack"}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// const Section = ({ title, children }) => (
//   <div style={styles.section}><div style={styles.sectionTitle}>{title}</div>{children}</div>
// );

// const Field = ({ label, unit, value }) => (
//   <div style={styles.field}>
//     <label style={styles.fieldLabel}>{label}<span style={styles.fieldUnit}>{unit}</span></label>
//     <input readOnly value={value || ""} style={styles.fieldInput} />
//   </div>
// );

// const Stat = ({ val, label }) => (
//   <div style={styles.stat}>
//     <div style={styles.statVal}>{val}</div>
//     <div style={styles.statLabel}>{label}</div>
//   </div>
// );

// const Pill = ({ children, accent, shipment, warning, info, danger }) => (
//   <div style={{ ...styles.pill, ...(accent ? styles.pillAccent : {}), ...(shipment ? styles.pillShipment : {}), ...(warning ? styles.pillWarning : {}), ...(info ? styles.pillInfo : {}), ...(danger ? styles.pillDanger : {}) }}>
//     {children}
//   </div>
// );

// const C = {
//   bg: "#ffffff", surface: "#ffffff", surfaceHigh: "#f1f5f9",
//   border: "rgba(0,0,0,0.1)", borderHigh: "rgba(37,99,235,0.4)",
//   text: "#0f172a", textMuted: "#64748b", accent: "#2563eb", accentGlow: "rgba(37,99,235,0.08)",
// };

// const styles = {
//   sharedNav: {
//   height: 48,
//   display: "flex",
//   alignItems: "center",
//   justifyContent: "flex-end",
//   padding: "0 18px",
//   background: "#fff",
//   borderBottom: "1px solid #e5e7eb",
// },
//   root: { display:"flex", flexDirection:"column", height:"100vh", width:"100%", background:C.bg, fontFamily:"'DM Sans','Segoe UI',sans-serif", color:C.text, overflow:"hidden", margin:0, padding:0, boxSizing:"border-box" },
//   noData: { display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100vh", background:C.bg, color:C.text, gap:16 },
//   backBtn: { padding:"10px 20px", background:C.accent, color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontWeight:600 },
//   nav: { display:"flex", alignItems:"center", padding:"0 20px", height:52, background:C.surface, borderBottom:`1px solid ${C.border}`, flexShrink:0, gap:8 },
//   navLogo: { display:"flex", alignItems:"center", gap:8, fontWeight:700, fontSize:16, color:C.accent, letterSpacing:"0.05em", marginRight:20 },
//   navLogoIcon: { fontSize:20 },
//   navTabs: { display:"flex", gap:4, flex:1 },
//   navTab: { padding:"6px 14px", background:"transparent", border:"none", color:C.textMuted, cursor:"pointer", borderRadius:6, fontSize:13, fontWeight:500, transition:"all 0.15s" },
//   navTabActive: { background:C.accentGlow, color:C.accent, border:`1px solid ${C.borderHigh}` },
//   printBtn: { padding:"6px 14px", background:"transparent", border:`1px solid ${C.border}`, color:C.textMuted, cursor:"pointer", borderRadius:6, fontSize:12, fontWeight:500 },
//   body: { display:"flex", flex:1, overflow:"hidden", minWidth:0, minHeight:0 },
//   panel: { width:240, background:C.surface, borderRight:`1px solid ${C.border}`, display:"flex", flexDirection:"column", gap:0, overflowY:"auto", overflowX:"hidden", padding:"12px 0", flexShrink:0, scrollbarWidth:"thin", boxSizing:"border-box" },
//   section: { padding:"0 14px 12px" },
//   sectionTitle: { fontSize:10, fontWeight:700, letterSpacing:"0.12em", color:C.textMuted, textTransform:"uppercase", padding:"10px 0 8px", borderBottom:`1px solid ${C.border}`, marginBottom:10 },
//   field: { marginBottom:8 },
//   fieldLabel: { fontSize:11, color:C.textMuted, display:"flex", justifyContent:"space-between", marginBottom:3 },
//   fieldUnit: { color:"rgba(100,116,139,0.6)", fontSize:10 },
//   fieldInput: { width:"100%", background:C.surfaceHigh, border:`1px solid ${C.border}`, borderRadius:6, padding:"5px 8px", color:C.text, fontSize:13, fontWeight:600, outline:"none", boxSizing:"border-box" },
//   calcBtn: { margin:"4px 14px 14px", padding:"9px 0", background:"linear-gradient(135deg,#1d4ed8,#2563eb)", border:"none", borderRadius:8, color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer", letterSpacing:"0.02em", boxShadow:"0 4px 12px rgba(37,99,235,0.3)" },
//  viewGrid: {
//   display: "grid",
//   gridTemplateColumns: "1fr",
//   gap: 8,
//   width: "100%",
// },
//   viewBtn: {
//   width: "100%",
//   height: 44,
//   borderRadius: 8,
//   border: "1px solid #cbd5e1",
//   background: "#f8fafc",
//   color: "#334155",
//   fontWeight: 600,
//   cursor: "pointer",
// },
//   viewBtnActive: { background:C.accentGlow, border:`1px solid ${C.accent}`, color:C.accent },
//   statsGrid: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 },
//   stat: { background:C.surfaceHigh, border:`1px solid ${C.border}`, borderRadius:8, padding:"10px 10px 8px", display:"flex", flexDirection:"column", gap:4, minWidth:0, overflow:"hidden" },
//   statVal: { fontSize:18, fontWeight:800, color:C.accent, lineHeight:1, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" },
//   statLabel: { fontSize:9, fontWeight:600, color:C.textMuted, textTransform:"uppercase", letterSpacing:"0.08em", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", marginTop:2 },
//   legendRow: { display:"flex", alignItems:"center", gap:8, padding:"4px 0", borderBottom:`1px solid ${C.border}` },
//   legendDot: { width:10, height:10, borderRadius:3, flexShrink:0 },
//   legendName: { flex:1, fontSize:12, color:C.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" },
//   legendCount: { fontSize:12, fontWeight:700, color:C.textMuted },
//   canvasWrap: { flex:1, position:"relative", overflow:"hidden", minWidth:0, minHeight:0 },
//   canvas: { width:"100%", height:"100%", display:"block", cursor:"grab" },
//   overlayTL: { position:"absolute", top:14, left:14, display:"flex", gap:8, flexWrap:"wrap" },
//   pill: { padding:"5px 12px", background:"rgba(255,255,255,0.85)", border:`1px solid ${C.border}`, borderRadius:20, fontSize:12, color:C.textMuted, backdropFilter:"blur(8px)", boxShadow:"0 1px 4px rgba(0,0,0,0.08)" },
//   pillAccent: { background:"rgba(37,99,235,0.08)", border:`1px solid ${C.borderHigh}`, color:C.accent },
//   pillShipment: { background:"rgba(249,115,22,0.10)", border:"1px solid rgba(249,115,22,0.35)", color:"#c2410c", fontWeight:700 },
//   pillWarning: { background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.25)", color:"#dc2626", fontWeight:700 },
//   pillInfo: { background:"rgba(37,99,235,0.08)", border:"1px solid rgba(37,99,235,0.25)", color:"#2563eb", fontWeight:700 },
//   pillDanger: { background:"rgba(245,158,11,0.10)", border:"1px solid rgba(245,158,11,0.35)", color:"#b45309", fontWeight:700 },
//   hint: { position:"absolute", bottom:14, left:"50%", transform:"translateX(-50%)", padding:"5px 14px", background:"rgba(255,255,255,0.85)", border:`1px solid ${C.border}`, borderRadius:20, fontSize:11, color:C.textMuted, backdropFilter:"blur(6px)", whiteSpace:"nowrap", boxShadow:"0 1px 4px rgba(0,0,0,0.08)" },
//   zoomBtns: { position:"absolute", right:14, bottom:14, display:"flex", flexDirection:"column", gap:6 },
//   zoomBtn: { width:34, height:34, background:"rgba(255,255,255,0.9)", border:`1px solid ${C.border}`, borderRadius:8, color:C.text, fontSize:16, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(6px)", transition:"all 0.15s", boxShadow:"0 1px 4px rgba(0,0,0,0.1)" },
// };

// export default ThreeDViewer;

import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";


function hexToRgb(hex) {
  if (!hex || typeof hex !== "string" || !hex.startsWith("#")) {
    return { r: 21, g: 101, b: 192 };
  }
  const h = hex.replace("#", "");
  if (h.length !== 6) return { r: 21, g: 101, b: 192 };
  return {
    r: parseInt(h.slice(0, 2), 16) || 21,
    g: parseInt(h.slice(2, 4), 16) || 101,
    b: parseInt(h.slice(4, 6), 16) || 192,
  };
}

function to3D(x, y, z, angleY, angleX) {
  const x1 = x * Math.cos(angleY) + z * Math.sin(angleY);
  const z1 = -x * Math.sin(angleY) + z * Math.cos(angleY);
  const y2 = y * Math.cos(angleX) - z1 * Math.sin(angleX);
  const z2 = y * Math.sin(angleX) + z1 * Math.cos(angleX);
  return [x1, y2, z2];
}

function project(tx, ty, tz, scale, cx, cy) {
  return [cx + tx * scale, cy - ty * scale];
}

function faceCenterDepth(pts3D, indices) {
  let z = 0;
  indices.forEach((i) => { z += pts3D[i][2]; });
  return z / indices.length;
}

function getShapeType(cargoType) {
  const t = (cargoType || "").toLowerCase();
  if (t === "sacks" || t === "jumbo bags" || t === "rice sack" || t === "rice sacks") return "sack";
  if (t === "barrels" || t === "drums" || t === "pipes") return "cylinder";
  return "box";
}

// ── CUBOID ────────────────────────────────────────────────────────────────────
function drawCuboid(ctx, x, y, z, w, h, d, rgb, angleY, angleX, scale, cx, cy, alpha = 1, boxIndex = 0) {
  const rawCorners = [
    [x, y, z], [x + w, y, z], [x + w, y + h, z], [x, y + h, z],
    [x, y, z + d], [x + w, y, z + d], [x + w, y + h, z + d], [x, y + h, z + d],
  ];
  const pts3D = rawCorners.map(([px, py, pz]) => to3D(px, py, pz, angleY, angleX));
  const pts2D = pts3D.map(([tx, ty, tz]) => project(tx, ty, tz, scale, cx, cy));
  const boxDepth = pts3D.reduce((sum, p) => sum + p[2], 0) / pts3D.length;
  const faces = [
    { pts: [0, 1, 2, 3], bright: 0.65, faceIndex: 0 },
    { pts: [4, 5, 6, 7], bright: 0.85, faceIndex: 1 },
    { pts: [0, 4, 7, 3], bright: 0.7, faceIndex: 2 },
    { pts: [1, 5, 6, 2], bright: 0.8, faceIndex: 3 },
    { pts: [0, 1, 5, 4], bright: 0.55, faceIndex: 4 },
    { pts: [3, 2, 6, 7], bright: 1.0, faceIndex: 5 },
  ];
  const sorted = faces
    .map((f) => ({ ...f, depth: faceCenterDepth(pts3D, f.pts), boxDepth, boxIndex }))
    .sort((a, b) => {
      const dz = a.depth - b.depth;
      if (Math.abs(dz) > 0.1) return dz;
      const db = a.boxDepth - b.boxDepth;
      if (Math.abs(db) > 0.1) return db;
      const di = a.boxIndex - b.boxIndex;
      if (di !== 0) return di;
      return a.faceIndex - b.faceIndex;
    });
  sorted.forEach(({ pts, bright }) => {
    const r = Math.min(255, Math.round(rgb.r * bright));
    const g = Math.min(255, Math.round(rgb.g * bright));
    const b2 = Math.min(255, Math.round(rgb.b * bright));
    ctx.beginPath();
    ctx.moveTo(pts2D[pts[0]][0], pts2D[pts[0]][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts2D[pts[i]][0], pts2D[pts[i]][1]);
    ctx.closePath();
    ctx.fillStyle = alpha < 1 ? `rgba(${r},${g},${b2},${alpha})` : `rgb(${r},${g},${b2})`;
    ctx.fill();
    const er = Math.max(0, r - 25), eg = Math.max(0, g - 25), eb = Math.max(0, b2 - 25);
    ctx.strokeStyle = alpha < 1 ? `rgba(${er},${eg},${eb},${alpha})` : `rgb(${er},${eg},${eb})`;
    ctx.lineWidth = 1;
    ctx.stroke();
  });
}

// ── SACK — realistic burlap sack look with bulgy pillow body and tied top ─────
function drawSack(ctx, x, y, z, w, h, d, rgb, angleY, angleX, scale, cx, cy) {
  const { r, g, b } = rgb;

  // Shrink the bounding box slightly inward so the sack sits ON the floor
  // instead of floating — the bulge visually lifts it otherwise
  const inset = Math.min(w, d) * 0.04;
  const sx = x + inset, sz = z + inset;
  const sw = w - inset * 2, sd = d - inset * 2;

  const rawCorners = [
    [sx,      y,     sz    ], [sx + sw, y,     sz    ],
    [sx + sw, y + h, sz    ], [sx,      y + h, sz    ],
    [sx,      y,     sz + sd], [sx + sw, y,     sz + sd],
    [sx + sw, y + h, sz + sd], [sx,      y + h, sz + sd],
  ];
  const pts3D = rawCorners.map(([px, py, pz]) => to3D(px, py, pz, angleY, angleX));
  const pts2D = pts3D.map(([tx, ty, tz]) => project(tx, ty, tz, scale, cx, cy));

  const faceDefs = [
    { indices: [4, 5, 6, 7], bright: 0.85 }, // front
    { indices: [1, 5, 6, 2], bright: 0.75 }, // right
    { indices: [3, 2, 6, 7], bright: 1.0  }, // top
    { indices: [0, 1, 2, 3], bright: 0.6  }, // back
    { indices: [0, 4, 7, 3], bright: 0.7  }, // left
    { indices: [0, 1, 5, 4], bright: 0.5  }, // bottom
  ];

  const sorted = faceDefs
    .map((f) => ({ ...f, depth: faceCenterDepth(pts3D, f.indices) }))
    .sort((a, b) => a.depth - b.depth);

  sorted.forEach(({ indices, bright }) => {
    const [p0, p1, p2, p3] = indices.map((i) => pts2D[i]);
    const lR = Math.min(255, Math.round(r * bright));
    const lG = Math.min(255, Math.round(g * bright));
    const lB = Math.min(255, Math.round(b * bright));

    const fcx = (p0[0] + p1[0] + p2[0] + p3[0]) / 4;
    const fcy = (p0[1] + p1[1] + p2[1] + p3[1]) / 4;

    // Compute face dimensions for bulge amount
    const faceW = Math.sqrt((p1[0]-p0[0])**2 + (p1[1]-p0[1])**2);
    const faceH = Math.sqrt((p3[0]-p0[0])**2 + (p3[1]-p0[1])**2);
    // Large bulge — 22% of the smaller face dimension — pushed outward
    const bulgeAmt = Math.min(faceW, faceH) * 0.22;

    // Outward control point: mid-edge pushed away from face center
    const outCtrl = (pa, pb) => {
      const mx = (pa[0] + pb[0]) / 2;
      const my = (pa[1] + pb[1]) / 2;
      const dx = mx - fcx;
      const dy = my - fcy;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      return [mx + (dx / len) * bulgeAmt, my + (dy / len) * bulgeAmt];
    };

    // Draw bulged quad using quadratic bezier on each edge
    ctx.beginPath();
    ctx.moveTo(p0[0], p0[1]);
    ctx.quadraticCurveTo(...outCtrl(p0, p1), p1[0], p1[1]);
    ctx.quadraticCurveTo(...outCtrl(p1, p2), p2[0], p2[1]);
    ctx.quadraticCurveTo(...outCtrl(p2, p3), p3[0], p3[1]);
    ctx.quadraticCurveTo(...outCtrl(p3, p0), p0[0], p0[1]);
    ctx.closePath();

    // Radial gradient for fabric lighting
    const grd = ctx.createRadialGradient(
      fcx - bulgeAmt * 0.4, fcy - bulgeAmt * 0.4, bulgeAmt * 0.1,
      fcx, fcy, Math.max(faceW, faceH) * 0.75
    );
    grd.addColorStop(0,   `rgb(${Math.min(255, lR + 55)},${Math.min(255, lG + 55)},${Math.min(255, lB + 55)})`);
    grd.addColorStop(0.5, `rgb(${lR},${lG},${lB})`);
    grd.addColorStop(1,   `rgb(${Math.max(0, lR - 45)},${Math.max(0, lG - 45)},${Math.max(0, lB - 45)})`);

    ctx.fillStyle = grd;
    ctx.fill();

    // Fabric texture: stitching lines
    ctx.save();
    ctx.clip(); // clip to sack face shape

    // Cross-stitch seam lines
    ctx.globalAlpha = 0.18;
    ctx.strokeStyle = `rgb(${Math.max(0, lR - 60)},${Math.max(0, lG - 60)},${Math.max(0, lB - 60)})`;
    ctx.lineWidth = 1.0;
    ctx.setLineDash([3, 4]);

    // Vertical seam
    ctx.beginPath();
    ctx.moveTo((p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2);
    ctx.lineTo((p3[0] + p2[0]) / 2, (p3[1] + p2[1]) / 2);
    ctx.stroke();

    // Horizontal seam
    ctx.beginPath();
    ctx.moveTo((p0[0] + p3[0]) / 2, (p0[1] + p3[1]) / 2);
    ctx.lineTo((p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2);
    ctx.stroke();

    ctx.setLineDash([]);
    ctx.restore();

    // Outline
    ctx.beginPath();
    ctx.moveTo(p0[0], p0[1]);
    ctx.quadraticCurveTo(...outCtrl(p0, p1), p1[0], p1[1]);
    ctx.quadraticCurveTo(...outCtrl(p1, p2), p2[0], p2[1]);
    ctx.quadraticCurveTo(...outCtrl(p2, p3), p3[0], p3[1]);
    ctx.quadraticCurveTo(...outCtrl(p3, p0), p0[0], p0[1]);
    ctx.closePath();
    ctx.strokeStyle = `rgb(${Math.max(0, lR - 35)},${Math.max(0, lG - 35)},${Math.max(0, lB - 35)})`;
    ctx.lineWidth = 1.0;
    ctx.stroke();

    // // Tied top knot on the top face (brightest face)
    // if (bright >= 1.0) {
    //   // Draw a small knot/tie at the top center of the top face
    //   const kx = fcx;
    //   const ky = fcy - faceH * 0.25;
    //   const kr = Math.min(faceW, faceH) * 0.08;

    //   ctx.save();
    //   ctx.globalAlpha = 0.55;

    //   // Knot circle
    //   const kGrd = ctx.createRadialGradient(kx - kr*0.3, ky - kr*0.3, kr*0.1, kx, ky, kr);
    //   kGrd.addColorStop(0, `rgb(${Math.min(255, lR + 40)},${Math.min(255, lG + 40)},${Math.min(255, lB + 40)})`);
    //   kGrd.addColorStop(1, `rgb(${Math.max(0, lR - 50)},${Math.max(0, lG - 50)},${Math.max(0, lB - 50)})`);
    //   ctx.beginPath();
    //   ctx.arc(kx, ky, kr, 0, Math.PI * 2);
    //   ctx.fillStyle = kGrd;
    //   ctx.fill();
    //   ctx.strokeStyle = `rgb(${Math.max(0, lR - 60)},${Math.max(0, lG - 60)},${Math.max(0, lB - 60)})`;
    //   ctx.lineWidth = 0.8;
    //   ctx.stroke();

    //   // Two bunny-ear loops above knot
    //   ctx.strokeStyle = `rgb(${Math.max(0, lR - 40)},${Math.max(0, lG - 40)},${Math.max(0, lB - 40)})`;
    //   ctx.lineWidth = 1.5;
    //   ctx.beginPath();
    //   ctx.ellipse(kx - kr * 0.8, ky - kr * 1.2, kr * 0.5, kr * 1.0, -0.4, 0, Math.PI * 2);
    //   ctx.stroke();
    //   ctx.beginPath();
    //   ctx.ellipse(kx + kr * 0.8, ky - kr * 1.2, kr * 0.5, kr * 1.0, 0.4, 0, Math.PI * 2);
    //   ctx.stroke();

    //   ctx.restore();
    // }
  });
}

function drawSackFlat(ctx, box, rgb, view, scale, cx, cy) {
  const { x, y, z, w, h, d } = box;
  const { r, g, b } = rgb;
  let left = 0, top = 0, width = 0, height = 0;
  if (view === "Side") { left = z; top = y; width = d; height = h; }
  else if (view === "Front") { left = x; top = y; width = w; height = h; }
  else if (view === "Top") { left = x; top = z; width = w; height = d; }
  const inset = 10;
  left += inset; top += inset;
  width = Math.max(6, width - inset * 2);
  height = Math.max(6, height - inset * 2);
  const [x1, y1] = project(left, top, 0, scale, cx, cy);
  const [x2, y2] = project(left + width, top + height, 0, scale, cx, cy);
  const drawX = Math.min(x1, x2), drawY = Math.min(y1, y2);
  const drawW = Math.abs(x2 - x1), drawH = Math.abs(y2 - y1);

  // Draw as a rounded rectangle with bulge (sack silhouette)
  const bulge = Math.min(drawW, drawH) * 0.18;
  const fcx2 = drawX + drawW / 2;
  const fcy2 = drawY + drawH / 2;

  const p0 = [drawX, drawY];
  const p1 = [drawX + drawW, drawY];
  const p2 = [drawX + drawW, drawY + drawH];
  const p3 = [drawX, drawY + drawH];

  const outCtrl = (pa, pb) => {
    const mx = (pa[0] + pb[0]) / 2;
    const my = (pa[1] + pb[1]) / 2;
    const dx = mx - fcx2; const dy = my - fcy2;
    const len = Math.sqrt(dx*dx + dy*dy) || 1;
    return [mx + (dx/len)*bulge, my + (dy/len)*bulge];
  };

  const grd = ctx.createRadialGradient(fcx2 - drawW*0.2, fcy2 - drawH*0.2, Math.min(drawW, drawH)*0.05, fcx2, fcy2, Math.max(drawW, drawH)*0.7);
  grd.addColorStop(0, `rgb(${Math.min(255, r + 55)},${Math.min(255, g + 55)},${Math.min(255, b + 55)})`);
  grd.addColorStop(0.55, `rgb(${r},${g},${b})`);
  grd.addColorStop(1, `rgb(${Math.max(0, r - 45)},${Math.max(0, g - 45)},${Math.max(0, b - 45)})`);

  ctx.beginPath();
  ctx.moveTo(p0[0], p0[1]);
  ctx.quadraticCurveTo(...outCtrl(p0, p1), p1[0], p1[1]);
  ctx.quadraticCurveTo(...outCtrl(p1, p2), p2[0], p2[1]);
  ctx.quadraticCurveTo(...outCtrl(p2, p3), p3[0], p3[1]);
  ctx.quadraticCurveTo(...outCtrl(p3, p0), p0[0], p0[1]);
  ctx.closePath();
  ctx.fillStyle = grd;
  ctx.fill();
  ctx.strokeStyle = `rgb(${Math.max(0, r - 30)},${Math.max(0, g - 30)},${Math.max(0, b - 30)})`;
  ctx.lineWidth = 1;
  ctx.stroke();
}

// ── CYLINDER — proper circular cross-section pipes ────────────────────────────
// Strategy: use equal radius = min(h,d)/2 for the circular cross-section
// but generate points in 3D world-space so projection is consistent.
// The cylinder axis runs along X (length w). Each ring has uniform radius.
function drawCylinder(ctx, x, y, z, w, h, d, rgb, angleY, angleX, scale, cx, cy) {
  const { r, g, b } = rgb;
  const segments = 32;

  // Use equal radius so it's a true circle, not an ellipse
  // The cross-section circle has radius = min(h,d)/2 centered in the h×d bounding box
  const radius = Math.min(h, d) / 2;
  const centerY = y + h / 2;
  const centerZ = z + d / 2;

  // Generate ring points for left cap (x) and right cap (x+w)
  const leftPts3D = [];
  const rightPts3D = [];

  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    // IMPORTANT: use equal radius for both Y and Z to get circles, not ellipses
    const py = centerY + Math.cos(angle) * radius;
    const pz = centerZ + Math.sin(angle) * radius;
    leftPts3D.push(to3D(x,     py, pz, angleY, angleX));
    rightPts3D.push(to3D(x + w, py, pz, angleY, angleX));
  }

  const leftPts2D  = leftPts3D.map((p)  => project(...p, scale, cx, cy));
  const rightPts2D = rightPts3D.map((p) => project(...p, scale, cx, cy));
  const leftDepth  = leftPts3D.reduce((sum, p)  => sum + p[2], 0) / segments;
  const rightDepth = rightPts3D.reduce((sum, p) => sum + p[2], 0) / segments;

  // Center points in 3D for cap gradients
  const leftCenter3D  = to3D(x,     centerY, centerZ, angleY, angleX);
  const rightCenter3D = to3D(x + w, centerY, centerZ, angleY, angleX);
  const leftCenter2D  = project(...leftCenter3D,  scale, cx, cy);
  const rightCenter2D = project(...rightCenter3D, scale, cx, cy);

  // Lateral surface: draw quads between consecutive ring segments
  // Sort by depth for correct overlap
  const quads = [];
  for (let i = 0; i < segments; i++) {
    const ni = (i + 1) % segments;
    // Normal direction: outward from axis
    const angle = ((i + 0.5) / segments) * Math.PI * 2;
    // Lighting: simulate light from upper-left
    const nx = 0;
    const ny = Math.cos(angle);
    const nz = Math.sin(angle);
    // Rotate normal same as geometry
    const [rnx, rny] = [
      nx * Math.cos(angleY) + nz * Math.sin(angleY),
      ny * Math.cos(angleX) - nz * Math.sin(angleX),
    ];
    const bright = Math.max(0.30, Math.min(1.1, 0.65 + 0.5 * rny + 0.2 * rnx));

    const avgDepth = (
      leftPts3D[i][2] + leftPts3D[ni][2] +
      rightPts3D[i][2] + rightPts3D[ni][2]
    ) / 4;

    quads.push({ i, ni, bright, depth: avgDepth });
  }

  // Draw back-to-front
  quads.sort((a, b) => a.depth - b.depth);

  quads.forEach(({ i, ni, bright }) => {
    const lR = Math.min(255, Math.round(r * bright));
    const lG = Math.min(255, Math.round(g * bright));
    const lB = Math.min(255, Math.round(b * bright));
    ctx.beginPath();
    ctx.moveTo(leftPts2D[i][0],   leftPts2D[i][1]);
    ctx.lineTo(leftPts2D[ni][0],  leftPts2D[ni][1]);
    ctx.lineTo(rightPts2D[ni][0], rightPts2D[ni][1]);
    ctx.lineTo(rightPts2D[i][0],  rightPts2D[i][1]);
    ctx.closePath();
    ctx.fillStyle = `rgb(${lR},${lG},${lB})`;
    ctx.fill();
    ctx.strokeStyle = `rgba(${Math.max(0, lR - 15)},${Math.max(0, lG - 15)},${Math.max(0, lB - 15)},0.25)`;
    ctx.lineWidth = 0.3;
    ctx.stroke();
  });

  // Draw cap that faces the viewer (higher depth = closer)
  const drawCap = (pts2D, center2D, isRight) => {
    const screenRadius = radius * scale;
    const grd = ctx.createRadialGradient(
      center2D[0] - screenRadius * 0.35,
      center2D[1] - screenRadius * 0.35,
      screenRadius * 0.05,
      center2D[0], center2D[1],
      screenRadius * 1.05
    );
    const highlight = isRight ? 80 : 35;
    const shadow    = isRight ? 15 : 50;
    grd.addColorStop(0, `rgb(${Math.min(255, r + highlight)},${Math.min(255, g + highlight)},${Math.min(255, b + highlight)})`);
    grd.addColorStop(0.6, `rgb(${r},${g},${b})`);
    grd.addColorStop(1, `rgb(${Math.max(0, r - shadow)},${Math.max(0, g - shadow)},${Math.max(0, b - shadow)})`);
    ctx.beginPath();
    pts2D.forEach(([px, py], idx) => idx === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py));
    ctx.closePath();
    ctx.fillStyle = grd;
    ctx.fill();
    ctx.strokeStyle = `rgba(${Math.max(0, r - 40)},${Math.max(0, g - 40)},${Math.max(0, b - 40)},0.6)`;
    ctx.lineWidth = 0.9;
    ctx.stroke();

    // Concentric ring detail on cap for pipe look
    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.strokeStyle = `rgb(${Math.max(0, r - 30)},${Math.max(0, g - 30)},${Math.max(0, b - 30)})`;
    ctx.lineWidth = 1;
    for (const frac of [0.45, 0.75]) {
      ctx.beginPath();
      pts2D.forEach(([px, py], idx) => {
        const ipx = center2D[0] + (px - center2D[0]) * frac;
        const ipy = center2D[1] + (py - center2D[1]) * frac;
        idx === 0 ? ctx.moveTo(ipx, ipy) : ctx.lineTo(ipx, ipy);
      });
      ctx.closePath();
      ctx.stroke();
    }
    ctx.restore();
  };

  // Draw the farther cap first, then the closer one on top
  if (leftDepth < rightDepth) {
    drawCap(leftPts2D,  leftCenter2D,  false);
    drawCap(rightPts2D, rightCenter2D, true);
  } else {
    drawCap(rightPts2D, rightCenter2D, true);
    drawCap(leftPts2D,  leftCenter2D,  false);
  }
}

function drawCylinderFlat(ctx, box, rgb, view, scale, cx, cy) {
  const { x, y, z, w, h, d } = box;
  const { r, g, b } = rgb;
  let centerA = 0, centerB = 0, radius = 0;
  if (view === "Side") { radius = Math.min(h, d) / 2; centerA = z + d / 2; centerB = y + h / 2; }
  else if (view === "Front") { radius = Math.min(w, h) / 2; centerA = x + w / 2; centerB = y + h / 2; }
  else if (view === "Top") { radius = Math.min(w, d) / 2; centerA = x + w / 2; centerB = z + d / 2; }
  radius = Math.max(4, radius);
  const [px, py] = project(centerA, centerB, 0, scale, cx, cy);
  const screenRadius = Math.max(3, radius * scale);
  const grd = ctx.createRadialGradient(px - screenRadius * 0.35, py - screenRadius * 0.35, screenRadius * 0.12, px, py, screenRadius);
  grd.addColorStop(0, `rgb(${Math.min(255, r + 70)},${Math.min(255, g + 70)},${Math.min(255, b + 70)})`);
  grd.addColorStop(0.55, `rgb(${r},${g},${b})`);
  grd.addColorStop(1, `rgb(${Math.max(0, r - 45)},${Math.max(0, g - 45)},${Math.max(0, b - 45)})`);
  ctx.beginPath();
  ctx.arc(px, py, screenRadius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fillStyle = grd;
  ctx.fill();
  ctx.strokeStyle = `rgb(${Math.max(0, r - 35)},${Math.max(0, g - 35)},${Math.max(0, b - 35)})`;
  ctx.lineWidth = 1.2;
  ctx.stroke();
}

// Upright cylinder: axis runs along Y (height h). Circular cross-section in X-Z plane.
function drawCylinderUpright(ctx, x, y, z, w, h, d, rgb, angleY, angleX, scale, cx, cy) {
  const { r, g, b } = rgb;
  const segments = 32;
  const radius = Math.min(w, d) / 2;
  const centerX = x + w / 2;
  const centerZ = z + d / 2;

  const bottomPts3D = [], topPts3D = [];
  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const px = centerX + Math.cos(angle) * radius;
    const pz = centerZ + Math.sin(angle) * radius;
    bottomPts3D.push(to3D(px, y,     pz, angleY, angleX));
    topPts3D.push(   to3D(px, y + h, pz, angleY, angleX));
  }
  const bottomPts2D = bottomPts3D.map(p => project(...p, scale, cx, cy));
  const topPts2D    = topPts3D.map(p    => project(...p, scale, cx, cy));
  const topCenter3D = to3D(centerX, y + h, centerZ, angleY, angleX);
  const topCenter2D = project(...topCenter3D, scale, cx, cy);

  // Lateral quads — sorted back-to-front
  const quads = [];
  for (let i = 0; i < segments; i++) {
    const ni = (i + 1) % segments;
    const angle = ((i + 0.5) / segments) * Math.PI * 2;
    const nx = Math.cos(angle), nz = Math.sin(angle);
    const rnx = nx * Math.cos(angleY) + nz * Math.sin(angleY);
    const bright = Math.max(0.30, Math.min(1.1, 0.65 + 0.55 * rnx));
    const avgDepth = (bottomPts3D[i][2] + bottomPts3D[ni][2] + topPts3D[i][2] + topPts3D[ni][2]) / 4;
    quads.push({ i, ni, bright, depth: avgDepth });
  }
  quads.sort((a, b) => a.depth - b.depth);
  quads.forEach(({ i, ni, bright }) => {
    const lR = Math.min(255, Math.round(r * bright));
    const lG = Math.min(255, Math.round(g * bright));
    const lB = Math.min(255, Math.round(b * bright));
    ctx.beginPath();
    ctx.moveTo(bottomPts2D[i][0],  bottomPts2D[i][1]);
    ctx.lineTo(bottomPts2D[ni][0], bottomPts2D[ni][1]);
    ctx.lineTo(topPts2D[ni][0],    topPts2D[ni][1]);
    ctx.lineTo(topPts2D[i][0],     topPts2D[i][1]);
    ctx.closePath();
    ctx.fillStyle = `rgb(${lR},${lG},${lB})`;
    ctx.fill();
    ctx.strokeStyle = `rgba(${Math.max(0,lR-15)},${Math.max(0,lG-15)},${Math.max(0,lB-15)},0.25)`;
    ctx.lineWidth = 0.3;
    ctx.stroke();
  });

  // Top cap with gradient
  const screenRadius = radius * scale;
  const grd = ctx.createRadialGradient(
    topCenter2D[0] - screenRadius * 0.35, topCenter2D[1] - screenRadius * 0.35, screenRadius * 0.05,
    topCenter2D[0], topCenter2D[1], screenRadius * 1.05
  );
  grd.addColorStop(0,   `rgb(${Math.min(255,r+80)},${Math.min(255,g+80)},${Math.min(255,b+80)})`);
  grd.addColorStop(0.6, `rgb(${r},${g},${b})`);
  grd.addColorStop(1,   `rgb(${Math.max(0,r-30)},${Math.max(0,g-30)},${Math.max(0,b-30)})`);
  ctx.beginPath();
  topPts2D.forEach(([px, py], idx) => idx === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py));
  ctx.closePath();
  ctx.fillStyle = grd;
  ctx.fill();
  ctx.strokeStyle = `rgba(${Math.max(0,r-40)},${Math.max(0,g-40)},${Math.max(0,b-40)},0.6)`;
  ctx.lineWidth = 0.9;
  ctx.stroke();

  // Concentric ring detail on top cap
  ctx.save();
  ctx.globalAlpha = 0.12;
  ctx.strokeStyle = `rgb(${Math.max(0,r-30)},${Math.max(0,g-30)},${Math.max(0,b-30)})`;
  ctx.lineWidth = 1;
  for (const frac of [0.45, 0.75]) {
    ctx.beginPath();
    topPts2D.forEach(([px, py], idx) => {
      const ipx = topCenter2D[0] + (px - topCenter2D[0]) * frac;
      const ipy = topCenter2D[1] + (py - topCenter2D[1]) * frac;
      idx === 0 ? ctx.moveTo(ipx, ipy) : ctx.lineTo(ipx, ipy);
    });
    ctx.closePath();
    ctx.stroke();
  }
  ctx.restore();
}

// ── CYLINDER along Z axis (d is the longest dimension) ───────────────────────
function drawCylinderZ(ctx, x, y, z, w, h, d, rgb, angleY, angleX, scale, cx, cy) {
  const { r, g, b } = rgb;
  const segments = 32;
  const radius = Math.min(w, h) / 2;
  const centerX = x + w / 2;
  const centerY = y + h / 2;

  const frontPts3D = [], backPts3D = [];
  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const px = centerX + Math.cos(angle) * radius;
    const py = centerY + Math.sin(angle) * radius;
    frontPts3D.push(to3D(px, py, z,     angleY, angleX));
    backPts3D.push( to3D(px, py, z + d, angleY, angleX));
  }
  const frontPts2D   = frontPts3D.map(p => project(...p, scale, cx, cy));
  const backPts2D    = backPts3D.map(p  => project(...p, scale, cx, cy));
  const frontDepth   = frontPts3D.reduce((s, p) => s + p[2], 0) / segments;
  const backDepth    = backPts3D.reduce((s, p)  => s + p[2], 0) / segments;
  const frontCenter3D = to3D(centerX, centerY, z,     angleY, angleX);
  const backCenter3D  = to3D(centerX, centerY, z + d, angleY, angleX);
  const frontCenter2D = project(...frontCenter3D, scale, cx, cy);
  const backCenter2D  = project(...backCenter3D,  scale, cx, cy);

  // Lateral quads
  const quads = [];
  for (let i = 0; i < segments; i++) {
    const ni = (i + 1) % segments;
    const angle = ((i + 0.5) / segments) * Math.PI * 2;
    const nx = Math.cos(angle), ny = Math.sin(angle);
    const rnx = nx * Math.cos(angleY);
    const rny = ny * Math.cos(angleX);
    const bright = Math.max(0.30, Math.min(1.1, 0.65 + 0.5 * rny + 0.2 * rnx));
    const avgDepth = (frontPts3D[i][2] + frontPts3D[ni][2] + backPts3D[i][2] + backPts3D[ni][2]) / 4;
    quads.push({ i, ni, bright, depth: avgDepth });
  }
  quads.sort((a, b) => a.depth - b.depth);
  quads.forEach(({ i, ni, bright }) => {
    const lR = Math.min(255, Math.round(r * bright));
    const lG = Math.min(255, Math.round(g * bright));
    const lB = Math.min(255, Math.round(b * bright));
    ctx.beginPath();
    ctx.moveTo(frontPts2D[i][0],  frontPts2D[i][1]);
    ctx.lineTo(frontPts2D[ni][0], frontPts2D[ni][1]);
    ctx.lineTo(backPts2D[ni][0],  backPts2D[ni][1]);
    ctx.lineTo(backPts2D[i][0],   backPts2D[i][1]);
    ctx.closePath();
    ctx.fillStyle = `rgb(${lR},${lG},${lB})`;
    ctx.fill();
    ctx.strokeStyle = `rgba(${Math.max(0,lR-15)},${Math.max(0,lG-15)},${Math.max(0,lB-15)},0.25)`;
    ctx.lineWidth = 0.3;
    ctx.stroke();
  });

  const drawCap = (pts2D, center2D, isFront) => {
    const screenRadius = radius * scale;
    const grd = ctx.createRadialGradient(
      center2D[0] - screenRadius * 0.35, center2D[1] - screenRadius * 0.35, screenRadius * 0.05,
      center2D[0], center2D[1], screenRadius * 1.05
    );
    const hl = isFront ? 80 : 35, sh = isFront ? 15 : 50;
    grd.addColorStop(0,   `rgb(${Math.min(255,r+hl)},${Math.min(255,g+hl)},${Math.min(255,b+hl)})`);
    grd.addColorStop(0.6, `rgb(${r},${g},${b})`);
    grd.addColorStop(1,   `rgb(${Math.max(0,r-sh)},${Math.max(0,g-sh)},${Math.max(0,b-sh)})`);
    ctx.beginPath();
    pts2D.forEach(([px, py], idx) => idx === 0 ? ctx.moveTo(px,py) : ctx.lineTo(px,py));
    ctx.closePath();
    ctx.fillStyle = grd; ctx.fill();
    ctx.strokeStyle = `rgba(${Math.max(0,r-40)},${Math.max(0,g-40)},${Math.max(0,b-40)},0.6)`;
    ctx.lineWidth = 0.9; ctx.stroke();
  };
  if (frontDepth < backDepth) { drawCap(frontPts2D, frontCenter2D, true);  drawCap(backPts2D, backCenter2D, false); }
  else                         { drawCap(backPts2D,  backCenter2D,  false); drawCap(frontPts2D, frontCenter2D, true); }
}

function drawContainer(ctx, L, W, H, angleY, angleX, scale, cx, cy, containerName) {
  const name = (containerName || "").toLowerCase();
  const isFlatRack = name.includes("flat rack");
  const isOpenTop = name.includes("open top") || name.includes("ot");
  const FLOOR_THICKNESS = 120;
  const rawCorners = [
    [0, 0, 0], [L, 0, 0], [L, H, 0], [0, H, 0],
    [0, 0, W], [L, 0, W], [L, H, W], [0, H, W],
  ];
  const pts3D = rawCorners.map(([px, py, pz]) => to3D(px, py, pz, angleY, angleX));
  const pts2D = pts3D.map(([tx, ty, tz]) => project(tx, ty, tz, scale, cx, cy));
  const allFaces = [
    { pts: [0, 1, 2, 3] }, { pts: [4, 5, 6, 7] }, { pts: [0, 4, 7, 3] },
    { pts: [1, 5, 6, 2] }, { pts: [0, 1, 5, 4] }, { pts: [3, 2, 6, 7] },
  ];
  let facesToDraw = [];
  if (isFlatRack) facesToDraw = [];
  else if (isOpenTop) facesToDraw = [allFaces[0], allFaces[2], allFaces[3], allFaces[4]];
  else facesToDraw = allFaces;
  facesToDraw.forEach((face) => {
    ctx.beginPath();
    ctx.moveTo(pts2D[face.pts[0]][0], pts2D[face.pts[0]][1]);
    for (let i = 1; i < face.pts.length; i++) ctx.lineTo(pts2D[face.pts[i]][0], pts2D[face.pts[i]][1]);
    ctx.closePath();
    ctx.fillStyle = "rgba(0,0,0,0.03)";
    ctx.fill();
  });
  ctx.strokeStyle = "rgba(30,30,30,0.7)";
  ctx.lineWidth = 2;
  let edgesToDraw = [];
  if (isFlatRack) edgesToDraw = [[0,1],[1,5],[5,4],[4,0]];
  else if (isOpenTop) edgesToDraw = [[0,1],[1,5],[5,4],[4,0],[0,3],[1,2],[4,7],[5,6]];
  else edgesToDraw = [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];
  edgesToDraw.forEach(([a, b]) => {
    ctx.beginPath(); ctx.moveTo(pts2D[a][0], pts2D[a][1]); ctx.lineTo(pts2D[b][0], pts2D[b][1]); ctx.stroke();
  });
  const floorCorners = [
    [0,0,0],[L,0,0],[L,0,W],[0,0,W],[0,-FLOOR_THICKNESS,0],[L,-FLOOR_THICKNESS,0],[L,-FLOOR_THICKNESS,W],[0,-FLOOR_THICKNESS,W],
  ];
  const floorPts3D = floorCorners.map(([px, py, pz]) => to3D(px, py, pz, angleY, angleX));
  const floorPts2D = floorPts3D.map(([tx, ty, tz]) => project(tx, ty, tz, scale, cx, cy));
  const floorFaces = [
    { pts: [0,1,2,3], bright: 1.0 }, { pts: [4,5,6,7], bright: 0.35 },
    { pts: [0,4,7,3], bright: 0.55 }, { pts: [1,5,6,2], bright: 0.65 },
    { pts: [0,1,5,4], bright: 0.45 }, { pts: [3,2,6,7], bright: 0.75 },
  ];
  floorFaces
    .map((f) => ({ ...f, depth: faceCenterDepth(floorPts3D, f.pts) }))
    .sort((a, b) => a.depth - b.depth)
    .forEach(({ pts, bright }) => {
      const base = Math.round(55 * bright);
      ctx.beginPath();
      ctx.moveTo(floorPts2D[pts[0]][0], floorPts2D[pts[0]][1]);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(floorPts2D[pts[i]][0], floorPts2D[pts[i]][1]);
      ctx.closePath();
      ctx.fillStyle = `rgb(${base},${base},${base})`;
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.4)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });
}

function normalizePlacements(placements) {
  return (placements || []).map((item) => {
    // The packing engine already outputs the correct final dimensions
    // (length_mm, height_mm, width_mm) after applying tilt/rotate.
    // We must NOT re-apply any swaps here — just read the packed values directly.
    const w = Number(item.length_mm || item.length || item.w || 0);
    const h = Number(item.height_mm || item.height || item.h || 0);
    const d = Number(item.width_mm  || item.width  || item.d || 0);
    return {
      x: Number(item.x || 0), y: Number(item.y || 0), z: Number(item.z || 0),
      w, h, d,
      color: item.color || "#1565c0",
      label: item.product_name || "",
      product_name: item.product_name || "",
      cargo_type: item.cargo_type || item.type || "",
      tilted: Boolean(item.tilted),
      _original: item,
    };
  });
}

function getShortContainerName(name = "") {
  const n = String(name).toLowerCase();
  if (n.includes("40ft") && n.includes("general purpose")) return "40ftGP";
  if (n.includes("20ft") && n.includes("general purpose")) return "20ftGP";
  if (n.includes("40ft") && n.includes("open top")) return "40ftOT";
  if (n.includes("20ft") && n.includes("open top")) return "20ftOT";
  if (n.includes("40ft") && n.includes("flat rack")) return "40ftFR";
  if (n.includes("20ft") && n.includes("flat rack")) return "20ftFR";
  return name;
}

function getFlatViewRect(L, W, H, scale, cx, cy, activeView) {
  if (activeView === "Side") {
    const [x1, y1] = project(0, 0, 0, scale, cx, cy);
    const [x2, y2] = project(W, H, 0, scale, cx, cy);
    return { x: Math.min(x1,x2), y: Math.min(y1,y2), w: Math.abs(x2-x1), h: Math.abs(y2-y1) };
  }
  if (activeView === "Front") {
    const [x1, y1] = project(0, 0, 0, scale, cx, cy);
    const [x2, y2] = project(L, H, 0, scale, cx, cy);
    return { x: Math.min(x1,x2), y: Math.min(y1,y2), w: Math.abs(x2-x1), h: Math.abs(y2-y1) };
  }
  if (activeView === "Top") {
    const [x1, y1] = project(0, 0, 0, scale, cx, cy);
    const [x2, y2] = project(L, W, 0, scale, cx, cy);
    return { x: Math.min(x1,x2), y: Math.min(y1,y2), w: Math.abs(x2-x1), h: Math.abs(y2-y1) };
  }
  return null;
}

function computeOrigin(L, W, H, angleY, angleX, scale, canvasW, canvasH, activeView = "3D") {
  if (activeView === "Side") {
    const drawW = W * scale, drawH = H * scale;
    return [canvasW * 0.72 - drawW / 2, canvasH * 0.70 + drawH / 2];
  }
  if (activeView === "Front") {
    const drawW = L * scale, drawH = H * scale;
    return [canvasW * 0.62 - drawW / 2, canvasH * 0.70 + drawH / 2];
  }
  if (activeView === "Top") {
    const drawW = L * scale, drawH = W * scale;
    return [canvasW * 0.62 - drawW / 2, canvasH * 0.72 + drawH / 2];
  }
  const rawCorners = [
    [0,0,0],[L,0,0],[L,H,0],[0,H,0],[0,0,W],[L,0,W],[L,H,W],[0,H,W],
  ];
  const pts3D = rawCorners.map(([px, py, pz]) => to3D(px, py, pz, angleY, angleX));
  const xs = pts3D.map((p) => p[0]), ys = pts3D.map((p) => p[1]);
  const midX = (Math.min(...xs) + Math.max(...xs)) / 2;
  const midY = (Math.min(...ys) + Math.max(...ys)) / 2;
  return [canvasW * 0.5 - midX * scale, canvasH * 0.52 + midY * scale];
}

const ThreeDViewer = ({ injectedState } = {}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const animRef = useRef(null);
const camRef = useRef({ angleY: -0.55, angleX: 0.32, scale: 0.1 });
  const dragRef = useRef({ active: false, lastX: 0, lastY: 0, pinchDist: null });
  const isDirtyRef = useRef(true);   // only redraw when camera actually changed
const [activeView, setActiveView] = useState("3D");

  // ── MANUAL OVERRIDE STATE ─────────────────────────────────────────────────
  const [isManualOverride, setIsManualOverride] = useState(false);
  const [manualBoxes, setManualBoxes] = useState(null); // loaded from localStorage in useEffect below
  const [moView, setMoView] = useState("Top"); // 2D view plane for manual override
  const moCanvasRef = useRef(null);
  const moDragRef = useRef({ active: false, boxIndex: -1, startMouseX: 0, startMouseY: 0, startBoxX: 0, startBoxZ: 0, startBoxY: 0 });
  const moScaleRef = useRef(0.09);
  const moOffsetRef = useRef({ x: 0, y: 0 });
  const moIsDirtyRef = useRef(true);
  const moAnimRef = useRef(null);

const state = injectedState || location.state || {};
  const navigationTs = state.navigationTs || 0;
  const isSharedView =
    state.isSharedView === true ||
    location.pathname.includes("/share/") ||
    Boolean(injectedState);
  const result = state.result || {};
  const cont = result.container || state.selectedContainer || null;
  const placements = result.placements || state.placements || [];

// ── Secondary container (from cost-based dual plan) ──────────────────────
  const secondaryResult       = state.secondaryResult       || null;
  const secondaryContainerType = state.secondaryContainerType || null;
  const costBasedPlan         = state.costBasedPlan         || null;
  const allAdditionalResults  = state.allAdditionalResults  || (secondaryResult ? [secondaryResult] : []);
  const allAdditionalContainerTypes = state.allAdditionalContainerTypes || (secondaryContainerType ? [secondaryContainerType] : []);
const secCont   = secondaryResult?.container || null;
  const secPlacements = secondaryResult?.placements || [];

  useEffect(() => {
    if (allAdditionalResults.length > 0) {
      camRef.current.scale = Math.max(0.025, 0.055 - (allAdditionalResults.length - 1) * 0.008);
    }
  }, [allAdditionalResults.length]);
  const odc = Boolean(result.odc);
  const overWidthMm = Number(result.overWidthMm || 0);
  const overHeightMm = Number(result.overHeightMm || 0);
  const overweight = Boolean(result.overweight);
  const overweightKg = Number(result.overweightKg || 0);

  const L = Number(cont?.internal_length_mm || cont?.length_mm || 0);
  const W = Number(cont?.internal_width_mm || cont?.width_mm || 0);
  const H = Number(cont?.internal_height_mm || cont?.height_mm || 0);

  // Secondary container dims
  const L2 = Number(secCont?.internal_length_mm || secCont?.length_mm || 0);
  const W2 = Number(secCont?.internal_width_mm  || secCont?.width_mm  || 0);
  const H2 = Number(secCont?.internal_height_mm || secCont?.height_mm || 0);
  // Gap between the two containers in mm
const CONTAINER_GAP = 2000;

  const cargoItems = state.cargoItems || [];

  const enrichedPlacements = placements.map((p) => {
    const match = (state.cargoItems || []).find((ci) => ci.product_name === p.product_name);
    return match ? { ...match, ...p } : p;
  });

  // Secondary container placements — offset X by (L + gap) so they appear side by side
  const enrichedSecPlacements = secPlacements.map((p) => {
    const match = (state.cargoItems || []).find((ci) => ci.product_name === p.product_name);
    const base = match ? { ...match, ...p } : p;
return { ...base, z: Number(base.z || 0) + W + CONTAINER_GAP };
  });

  const rawBoxes = normalizePlacements(enrichedPlacements);
const rawSecBoxes = normalizePlacements(enrichedSecPlacements).filter(box => {
    const relZ = box.z - (W + CONTAINER_GAP);
    return (
      box.x >= -1 && box.y >= -1 && relZ >= -1 &&
      box.x + box.w <= L2 + 1 &&
      box.y + box.h <= H2 + 1 &&
      relZ + box.d <= W2 + 1
    );
  });

const EPS_BOX = 1; // strict 1mm tolerance only for floating point
  const autoBoxes = rawBoxes.filter((box) => {
    const inside =
      box.x >= -EPS_BOX && box.y >= -EPS_BOX && box.z >= -EPS_BOX &&
      box.x + box.w <= L + EPS_BOX &&
      box.y + box.h <= H + EPS_BOX &&
      box.z + box.d <= W + EPS_BOX;
    if (!inside) console.warn("❌ Item outside container:", box);
    return inside;
  });

// Use manualBoxes if it exists (even after exiting override), otherwise autoBoxes
  // This ensures 3D reflects all manual edits after "Apply & Back to 3D"
  const boxes = manualBoxes !== null ? manualBoxes : autoBoxes;

// Build boxes for ALL additional containers with cumulative Z offsets
  let _zOffset = W + CONTAINER_GAP;
  const allAdditionalBoxGroups = allAdditionalResults.map((addResult) => {
    const addCont = addResult?.container || null;
    const addPlacements = addResult?.placements || [];
    const addL = Number(addCont?.internal_length_mm || addCont?.length_mm || 0);
    const addW = Number(addCont?.internal_width_mm  || addCont?.width_mm  || 0);
    const addH = Number(addCont?.internal_height_mm || addCont?.height_mm || 0);
    const offsetZ = _zOffset;

    const enriched = addPlacements.map(p => {
      const match = (state.cargoItems || []).find(ci => ci.product_name === p.product_name);
      const base = match ? { ...match, ...p } : p;
      return { ...base, z: Number(base.z || 0) + offsetZ };
    });

    const normalized = normalizePlacements(enriched);
const filtered = normalized.filter(box => {
      const relZ = box.z - offsetZ;
      const inside =
        box.x >= -1 &&
        box.y >= -1 &&
        relZ >= -1 &&
        box.x + box.w <= addL + 1 &&
        box.y + box.h <= addH + 1 &&
        relZ + box.d <= addW + 1;
      if (!inside) console.warn("❌ Additional container item outside boundary:", box);
      return inside;
    });

    _zOffset += addW + CONTAINER_GAP;
    return { cont: addCont, boxes: filtered, addW, addL, addH };
  });

  const allAdditionalBoxes = allAdditionalBoxGroups.flatMap(g => g.boxes);
  // Combine primary + all additional boxes for rendering
  const allBoxes = [...boxes, ...allAdditionalBoxes];

  // Rejected items from packing engine
  // const rejectedItems = result.rejected || [];
  // const [fitLoading, setFitLoading] = useState(false);
  // const [fitError, setFitError] = useState("");

  // Rejected items from packing engine — tracked in state so count updates after fitting
const savedRejected = localStorage.getItem("rejectedItemsCleared");

const [rejectedItems, setRejectedItems] = useState(
  savedRejected === "true" ? [] : (state.rejectedFromCostAnalysis ?? result.rejected ?? [])
);
const [fitLoading, setFitLoading] = useState(false);
  const [fitError, setFitError] = useState("");
  const [manualPackedItems, setManualPackedItems] = useState([]);
const [layoutWarnings, setLayoutWarnings] = useState([]);
const [showLayoutWarning, setShowLayoutWarning] = useState(false);

// show warning only once when entering 3D viewer
const entryWarningShownRef = useRef(false);

  // ── FIT REJECTED ITEMS INTO MANUAL LAYOUT ─────────────────────────────────
  const handleFitRejected = async () => {
    if (!manualBoxes || rejectedItems.length === 0) return;
    setFitLoading(true); setFitError("");
    try {
      const prePlaced = manualBoxes.map(b => ({
        product_name: b.product_name,
        cargo_type: b.cargo_type || "Cartons",
        color: b.color,
        x: Math.round(b.x), y: Math.round(b.y), z: Math.round(b.z),
        length_mm: Math.round(b.w), height_mm: Math.round(b.h), width_mm: Math.round(b.d),
        weight_kg: b._original?.weight_kg || 0,
        pre_placed: true,
      }));
      const toFit = rejectedItems.map(r => ({
        product_name: r.product_name,
        cargo_type: r.cargo_type || "Cartons",
        color: r.color || "#22c55e",
        length_mm: r.length_mm || 0, width_mm: r.width_mm || 0, height_mm: r.height_mm || 0,
        weight_kg: r.weight_kg || 0, quantity: 1, shipment_name: shipmentName || "",
      }));
const res = await fetch("http://localhost:5000/api/fit-into-layout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          container: cont, 
          pre_placed: prePlaced, 
          items_to_fit: toFit,
          allow_stacking: true,
          stack_on_pre_placed: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed");
      // const newBoxes = normalizePlacements(data.new_placements || []);
      // setManualBoxes([...manualBoxes, ...newBoxes]);
      // isDirtyRef.current = true;
      // if (data.still_rejected?.length > 0) {
      //   setFitError(`⚠️ ${data.still_rejected.length} item(s) still couldn't fit.`);
      // } else {
      //   setFitError("✅ All items fitted!");
      // }

const newBoxes = normalizePlacements(data.new_placements || []);
setManualBoxes([...manualBoxes, ...newBoxes]);
isDirtyRef.current = true;
// Update remaining rejected items so the button count reflects reality
setRejectedItems(data.still_rejected || []);
const fittedNames = newBoxes
  .map(b => b.product_name || b.label)
  .filter(Boolean);

setManualPackedItems(fittedNames);

const oldSaved = JSON.parse(
  localStorage.getItem("latest_manual_override_packed") || "[]"
);

const mergedNames = Array.from(new Set([...oldSaved, ...fittedNames]));

localStorage.setItem(
  "latest_manual_override_packed",
  JSON.stringify(mergedNames)
);

localStorage.setItem(
  `manual_override_packed_${shipmentName}`,
  JSON.stringify(mergedNames)
);

if (data.still_rejected?.length > 0) {
  const fittedCount = toFit.length - data.still_rejected.length;
  setFitError(
    fittedCount > 0
      ? `✅ ${fittedCount} item(s) fitted! ⚠️ ${data.still_rejected.length} still can't fit.`
      : `⚠️ ${data.still_rejected.length} item(s) still couldn't fit.`
  );
} else {
  setFitError("✅ All items fitted successfully!");
  localStorage.setItem("rejectedItemsCleared", "true");
  setRejectedItems([]);
}
    } catch(err) {
      setFitError(err.message || "Error connecting to backend.");
    } finally {
      setFitLoading(false);
    }
  };

const shipmentName =
    cargoItems.find((item) => item.shipment_name && String(item.shipment_name).trim())?.shipment_name ||
    placements.find((p) => p.shipment_name && String(p.shipment_name).trim())?.shipment_name ||
    state.shipmentName ||
    state.viewShipmentName ||
    "";

const cargoVersionKey = cargoItems
  .map((item) => `${item.product_name}-${item.quantity || item.qty}-${item.length_mm || item.length_cm}-${item.width_mm || item.width_cm}-${item.height_mm || item.height_cm}-${item.weight_kg}`)
  .join("|");

const manualBoxesKey = shipmentName
  ? `cargoset_manual_${shipmentName}_${cargoVersionKey}`
  : null;

// Stable key — does NOT change when cargo quantities change — used for "Save Layout"
const savedLayoutKey = shipmentName ? `cargoset_saved_layout_${shipmentName}` : null;

// ── SAVE LAYOUT: persist current manual positions so Recalculate keeps them ──
const [layoutSaved, setLayoutSaved] = useState(false);

useEffect(() => {
  if (!shipmentName) return;
  fetch('http://localhost:5000/api/shipments')
    .then(r => r.json())
    .then(data => {
      if (Array.isArray(data)) {
        const match = data.find(
          s => (s.name || '').toLowerCase().trim() === shipmentName.toLowerCase().trim()
        );
        if (match && match.status === 'completed') setLayoutSaved(true);
      }
    })
    .catch(() => {});
}, [shipmentName]);

// ✅ Reset to blue when cargo items change (user edited something)
useEffect(() => {
  setLayoutSaved(false);
}, [cargoVersionKey]);

  const [toast, setToast] = useState(null);
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

const handleSaveLayout = async () => {
  try {
    const toSave = manualBoxes?.length ? manualBoxes : autoBoxes;

    if (!shipmentName) {
      alert("Shipment name missing. Cannot save layout.");
      return;
    }

    // 1. Save placements to DB (new API endpoint)
    const saveRes = await fetch(`http://localhost:5000/api/shipments/layout/${encodeURIComponent(shipmentName)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        placements: toSave.map(b => ({
          product_name: b.product_name || b.label || '',
          cargo_type: b.cargo_type || 'Cartons',
          color: b.color || '#1565c0',
          x: Math.round(b.x), y: Math.round(b.y), z: Math.round(b.z),
          length_mm: Math.round(b.w),
          height_mm: Math.round(b.h),
          width_mm: Math.round(b.d),
          weight_kg: b._original?.weight_kg || 0,
        })),
        container: cont,
      }),
    });

    if (!saveRes.ok) throw new Error('Failed to save layout to server');

// 2. Mark shipment as completed (update existing, never insert duplicate)
    await fetch('http://localhost:5000/api/shipments/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: shipmentName,
        item_count: cargoItems.length,
        container_count: 1,
        calc_time_s: 0.01,
      }),
    });

   // 3. Deduplicate rejected items by product_name and sum quantities
const rejectedGrouped = Object.values(
  rejectedItems.reduce((acc, r) => {
    const name = r.product_name || r.name || '';
    if (!acc[name]) {
      acc[name] = { product_name: name, quantity: 0 };
    }
    acc[name].quantity += 1; // each entry in rejected[] = 1 unit
    return acc;
  }, {})
);

await fetch(
  `http://localhost:5000/api/shipments/rejected/${encodeURIComponent(shipmentName)}`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rejected: rejectedGrouped }),
  }
);
setManualBoxes([...toSave]);
    setLayoutSaved(true);
    showToast('✅ Layout saved permanently.', 'success');
  } catch (err) {
    console.error('Save layout failed:', err);
    showToast('❌ Save failed: ' + err.message, 'error');
  }
};

useEffect(() => {
  if (!shipmentName) {
    setManualBoxes(null);
    return;
  }

  let cancelled = false;

  const forceFresh = localStorage.getItem("FORCE_FRESH_PACKING");
  if (forceFresh === "true") {
    localStorage.removeItem("FORCE_FRESH_PACKING");
    setManualBoxes(null);
    return;
  }

  fetch(`http://localhost:5000/api/shipments/layout/${encodeURIComponent(shipmentName)}`)
    .then(r => r.ok ? r.json() : null)
    .then(data => {
      if (cancelled) return;
      if (data && Array.isArray(data.placements) && data.placements.length > 0) {
        setManualBoxes(
          normalizePlacements(data.placements.filter(box => !box.rejected))
        );
      } else {
        setManualBoxes(null);
      }
    })
    .catch(() => {
      if (!cancelled) setManualBoxes(null);
    });

  return () => { cancelled = true; };

}, [shipmentName, navigationTs]); // ← navigationTs triggers re-fetch on every fresh navigation
useEffect(() => {
  // DO NOT reset manualBoxes here — the layout-load effect above handles
  // loading the correct saved layout whenever shipmentName changes.
  // Resetting here causes the race condition where old auto-pack flashes
  // before the fetch completes.

  // Refresh rejected items (don't rely on stale localStorage savedLayout)
  const remainingRejected = result.rejected || [];
  setRejectedItems(remainingRejected);

  if (remainingRejected.length === 0 && (result.rejected || []).length > 0) {
    setFitError("✅ All items fitted successfully!");
    localStorage.setItem("rejectedItemsCleared", "true");
  }

  // Reset warning popup state
  entryWarningShownRef.current = false;

  // Trigger redraws
  isDirtyRef.current = true;
  moIsDirtyRef.current = true;
}, [cargoVersionKey, navigationTs]);


  useEffect(() => {
    document.body.style.margin = "0";
    document.body.style.padding = "0";
    document.body.style.overflow = "hidden";
    document.documentElement.style.margin = "0";
    document.documentElement.style.padding = "0";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.margin = "";
      document.body.style.padding = "";
      document.body.style.overflow = "";
      document.documentElement.style.margin = "";
      document.documentElement.style.padding = "";
      document.documentElement.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    if (!cont) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; isDirtyRef.current = true; };
    resize();
    window.addEventListener("resize", resize);

    const gridSize = 200000, gridStep = 500;
    const gridMin = -gridSize / 2, gridMax = gridSize / 2;

    const draw = () => {
      const { angleY, angleX, scale } = camRef.current;
      const [cx, cy] = computeOrigin(L, W, H, angleY, angleX, scale, canvas.width, canvas.height, activeView);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#f0f3fa";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.lineWidth = 1;
      for (let i = gridMin; i <= gridMax; i += gridStep) {
        const isMajor = i % (gridStep * 5) === 0;
        ctx.strokeStyle = isMajor ? "rgba(0,0,0,0.18)" : "rgba(0,0,0,0.07)";
        const [ax, ay] = project(...to3D(i, 0, gridMin, angleY, angleX), scale, cx, cy);
        const [bx, by] = project(...to3D(i, 0, gridMax, angleY, angleX), scale, cx, cy);
        ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
        const [ax2, ay2] = project(...to3D(gridMin, 0, i, angleY, angleX), scale, cx, cy);
        const [bx2, by2] = project(...to3D(gridMax, 0, i, angleY, angleX), scale, cx, cy);
        ctx.beginPath(); ctx.moveTo(ax2, ay2); ctx.lineTo(bx2, by2); ctx.stroke();
      }

      drawContainer(ctx, L, W, H, angleY, angleX, scale, cx, cy, cont.container_name || cont.name || "");

      // ── Draw ALL additional containers in a loop ──────────────────────────
      const FLOOR_THICKNESS = 120;
      let drawZOffset = W + CONTAINER_GAP;
      allAdditionalResults.forEach((addResult, idx) => {
        const addCont = addResult?.container || null;
        if (!addCont) return;
        const addL = Number(addCont.internal_length_mm || addCont.length_mm || 0);
        const addW = Number(addCont.internal_width_mm  || addCont.width_mm  || 0);
        const addH = Number(addCont.internal_height_mm || addCont.height_mm || 0);
        if (addL <= 0) { drawZOffset += addW + CONTAINER_GAP; return; }

        const offsetZ3D = drawZOffset;
        const rawCorners2 = [
          [0,    0,    offsetZ3D],        [addL, 0,    offsetZ3D],        [addL, addH, offsetZ3D],        [0,    addH, offsetZ3D],
          [0,    0,    offsetZ3D+addW],   [addL, 0,    offsetZ3D+addW],   [addL, addH, offsetZ3D+addW],   [0,    addH, offsetZ3D+addW],
        ];
        const pts3D2 = rawCorners2.map(([px,py,pz]) => to3D(px,py,pz,angleY,angleX));
        const pts2D2 = pts3D2.map(([tx,ty,tz]) => project(tx,ty,tz,scale,cx,cy));

        [[0,1,2,3],[4,5,6,7],[0,4,7,3],[1,5,6,2],[0,1,5,4],[3,2,6,7]].forEach(f => {
          ctx.beginPath();
          ctx.moveTo(pts2D2[f[0]][0], pts2D2[f[0]][1]);
          for (let i=1;i<f.length;i++) ctx.lineTo(pts2D2[f[i]][0], pts2D2[f[i]][1]);
          ctx.closePath();
          ctx.fillStyle = "rgba(0,0,0,0.03)"; ctx.fill();
        });
        ctx.strokeStyle = "rgba(30,30,30,0.7)"; ctx.lineWidth = 2;
        [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]].forEach(([a,b]) => {
          ctx.beginPath(); ctx.moveTo(pts2D2[a][0],pts2D2[a][1]); ctx.lineTo(pts2D2[b][0],pts2D2[b][1]); ctx.stroke();
        });

        const floorC2 = [
          [0,    0,               offsetZ3D],      [addL, 0,               offsetZ3D],      [addL, 0,               offsetZ3D+addW], [0,    0,               offsetZ3D+addW],
          [0,   -FLOOR_THICKNESS, offsetZ3D],      [addL,-FLOOR_THICKNESS, offsetZ3D],      [addL,-FLOOR_THICKNESS, offsetZ3D+addW], [0,   -FLOOR_THICKNESS, offsetZ3D+addW],
        ];
        const fPts3D2 = floorC2.map(([px,py,pz]) => to3D(px,py,pz,angleY,angleX));
        const fPts2D2 = fPts3D2.map(([tx,ty,tz]) => project(tx,ty,tz,scale,cx,cy));
        [{pts:[0,1,2,3],bright:1.0},{pts:[4,5,6,7],bright:0.35},{pts:[0,4,7,3],bright:0.55},
         {pts:[1,5,6,2],bright:0.65},{pts:[0,1,5,4],bright:0.45},{pts:[3,2,6,7],bright:0.75}]
          .map(f => ({...f, depth: faceCenterDepth(fPts3D2, f.pts)}))
          .sort((a,b) => a.depth - b.depth)
          .forEach(({pts, bright}) => {
            const base = Math.round(55*bright);
            ctx.beginPath();
            ctx.moveTo(fPts2D2[pts[0]][0], fPts2D2[pts[0]][1]);
            for (let i=1;i<pts.length;i++) ctx.lineTo(fPts2D2[pts[i]][0], fPts2D2[pts[i]][1]);
            ctx.closePath();
            ctx.fillStyle = `rgb(${base},${base},${base})`; ctx.fill();
            ctx.strokeStyle = "rgba(0,0,0,0.4)"; ctx.lineWidth = 1.5; ctx.stroke();
          });

        const topMid3D = to3D(addL/2, addH + 400, offsetZ3D + addW/2, angleY, angleX);
        const [lx, ly] = project(...topMid3D, scale, cx, cy);
        ctx.font = "bold 13px 'DM Sans',sans-serif";
        ctx.fillStyle = "#1e3a8a";
        ctx.textAlign = "center";
        ctx.fillText(`Container ${idx+2}: ${addCont.container_name || addCont.name || allAdditionalContainerTypes[idx] || ""}`, lx, ly);
        ctx.textAlign = "left";

        drawZOffset += addW + CONTAINER_GAP;
      });

      // Label above first container (only when there are additional ones)
      if (allAdditionalResults.length > 0) {
        const topMid3D1 = to3D(L/2, H + 400, W/2, angleY, angleX);
        const [lx1, ly1] = project(...topMid3D1, scale, cx, cy);
        ctx.font = "bold 13px 'DM Sans',sans-serif";
        ctx.fillStyle = "#1e3a8a";
        ctx.textAlign = "center";
        ctx.fillText(`Container 1: ${cont.container_name || cont.name || ""}`, lx1, ly1);
        ctx.textAlign = "left";
      }

      // ── Camera-aware sort, computed once per draw call ────────────────────
      // Sort items back-to-front using current camera angles so that:
      //   1. Items far from camera draw first (painter's algorithm)
      //   2. Items physically behind others (in world space) always draw first
      //   3. Sort is re-computed each draw() call but draw() only fires when
      //      isDirtyRef=true (on mouse move/zoom) — NOT every RAF frame.
      //      So there is NO flicker between frames because we only draw once
      //      per user input event, not continuously.
      //
      // The "changing shape" bug was caused by requestAnimationFrame running
      // draw() 60x/sec even when nothing moved. Now draw() runs only on input.

const sortedBoxes = [...allBoxes]
  .map((box, index) => {
    const cx0 = box.x;
    const cy0 = box.y;
    const cz0 = box.z;

    const cx1 = box.x + box.w;
    const cy1 = box.y + box.h;
    const cz1 = box.z + box.d;

    const corners = [
      [cx0, cy0, cz0],
      [cx1, cy0, cz0],
      [cx1, cy1, cz0],
      [cx0, cy1, cz0],
      [cx0, cy0, cz1],
      [cx1, cy0, cz1],
      [cx1, cy1, cz1],
      [cx0, cy1, cz1],
    ];

    const depths = corners.map(([px, py, pz]) =>
      to3D(px, py, pz, angleY, angleX)[2]
    );

    const minDepth = Math.min(...depths);
    const maxDepth = Math.max(...depths);
    const avgDepth = depths.reduce((s, d) => s + d, 0) / 8;

    return {
      ...box,
      minDepth,
      maxDepth,
      avgDepth,
      stableIndex: index,
    };
  })
  .sort((a, b) => {
    const d = a.minDepth - b.minDepth;
    if (Math.abs(d) > 1.0) return d;

    const da = a.avgDepth - b.avgDepth;
    if (Math.abs(da) > 1.0) return da;

    const dm = a.maxDepth - b.maxDepth;
    if (Math.abs(dm) > 1.0) return dm;

    const dy = a.y - b.y;
    if (Math.abs(dy) > 1.0) return dy;

    return a.stableIndex - b.stableIndex;
  });

      sortedBoxes.forEach(({ x, y, z, w, h, d, color, cargo_type, tilted, stableIndex }) => {
        const rgb       = hexToRgb(color);
        const shapeType = getShapeType(cargo_type);
        if (shapeType === "sack") {
          if (activeView === "Side" || activeView === "Front" || activeView === "Top") {
            drawSackFlat(ctx, { x, y, z, w, h, d }, rgb, activeView, scale, cx, cy);
          } else {
            drawSack(ctx, x, y, z, w, h, d, rgb, angleY, angleX, scale, cx, cy);
          }
        } else if (shapeType === "cylinder") {
          if (activeView === "Side" || activeView === "Front" || activeView === "Top") {
            drawCylinderFlat(ctx, { x, y, z, w, h, d }, rgb, activeView, scale, cx, cy);
          } else {
            // Pick axis based on which dimension is longest
            if (h >= w && h >= d) {
              // Upright — axis along Y
              drawCylinderUpright(ctx, x, y, z, w, h, d, rgb, angleY, angleX, scale, cx, cy);
            } else if (d >= w && d >= h) {
              // Along Z axis
              drawCylinderZ(ctx, x, y, z, w, h, d, rgb, angleY, angleX, scale, cx, cy);
            } else {
              // Along X axis (w is longest)
              drawCylinder(ctx, x, y, z, w, h, d, rgb, angleY, angleX, scale, cx, cy);
            }
          }
        } else {
          drawCuboid(ctx, x, y, z, w, h, d, rgb, angleY, angleX, scale, cx, cy, 1, stableIndex);
        }
      });

            isDirtyRef.current = false;
    };

    // Only redraw when something changed — stops ghost-movement illusion
    const loop = () => {
      if (isDirtyRef.current) draw();
      animRef.current = requestAnimationFrame(loop);
    };
    isDirtyRef.current = true;
    loop();

    const onDown = (e) => { dragRef.current = { active: true, lastX: e.clientX, lastY: e.clientY }; canvas.style.cursor = "grabbing"; isDirtyRef.current = true; };
    const onMove = (e) => {
      if (!dragRef.current.active) return;
      // Accumulate rotation delta — items stay locked in world space
      camRef.current.angleY += (e.clientX - dragRef.current.lastX) * 0.006;
      camRef.current.angleX += (e.clientY - dragRef.current.lastY) * 0.004;
      camRef.current.angleX = Math.max(-1.4, Math.min(1.4, camRef.current.angleX));
      dragRef.current.lastX = e.clientX;
      dragRef.current.lastY = e.clientY;
      isDirtyRef.current = true;   // mark for redraw — prevents ghost-drop illusion
    };
    const onUp = () => { dragRef.current.active = false; canvas.style.cursor = "grab"; isDirtyRef.current = true; };
    const onWheel = (e) => {
      e.preventDefault();
      camRef.current.scale = Math.max(0.04, Math.min(1.5, camRef.current.scale - e.deltaY * 0.0003));
      isDirtyRef.current = true;
    };
    const onTouchStart = (e) => {
      if (e.touches.length === 1) {
        const t = e.touches[0];
        dragRef.current = { active: true, lastX: t.clientX, lastY: t.clientY, pinchDist: null };
      } else if (e.touches.length === 2) {
        // Pinch-to-zoom start
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        dragRef.current.pinchDist = Math.sqrt(dx*dx + dy*dy);
        dragRef.current.active = false;
      }
    };
    const onTouchMove = (e) => {
      if (e.touches.length === 2) {
        // Pinch-to-zoom
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dragRef.current.pinchDist) {
          const delta = (dist - dragRef.current.pinchDist) * 0.0003;
          camRef.current.scale = Math.max(0.04, Math.min(1.5, camRef.current.scale + delta));
          isDirtyRef.current = true;
        }
        dragRef.current.pinchDist = dist;
        return;
      }
      if (!dragRef.current.active || e.touches.length !== 1) return;
      const t = e.touches[0];
      camRef.current.angleY += (t.clientX - dragRef.current.lastX) * 0.006;
      camRef.current.angleX += (t.clientY - dragRef.current.lastY) * 0.004;
      camRef.current.angleX = Math.max(-1.4, Math.min(1.4, camRef.current.angleX));
      dragRef.current.lastX = t.clientX;
      dragRef.current.lastY = t.clientY;
      isDirtyRef.current = true;   // mark for redraw
    };

    canvas.addEventListener("mousedown", onDown);
    canvas.addEventListener("touchstart", onTouchStart, { passive: true });
    canvas.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      canvas.removeEventListener("mousedown", onDown);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("wheel", onWheel);
    };
}, [cont, boxes, allBoxes, L, W, H, activeView, isManualOverride, allAdditionalResults.length]);

  // ── MANUAL OVERRIDE: stable refs so canvas callbacks never go stale ─────────
  const manualBoxesRef  = useRef(null);
  const moViewRef       = useRef(moView);
  const moLRef          = useRef(L);
  const moWRef          = useRef(W);
  const moHRef          = useRef(H);
  // Keep ALL refs in sync on every render — this is cheap and critical
  manualBoxesRef.current = manualBoxes;
  moViewRef.current      = moView;
  moLRef.current         = L;
  moWRef.current         = W;
  moHRef.current         = H;

  // ── 2D canvas draw — called directly from rAF loop, reads only refs ───────
  const moDrawRef = useRef(null); // holds latest draw fn so loop always calls fresh version

  useEffect(() => {
    if (!isManualOverride || !moCanvasRef.current || !cont) return;
    const canvas = moCanvasRef.current;
    const ctx    = canvas.getContext("2d");

    const resize = () => {
      canvas.width  = canvas.offsetWidth  || 800;
      canvas.height = canvas.offsetHeight || 500;
      const cW = moViewRef.current === "Side" ? moWRef.current : moLRef.current;
      const cH = moViewRef.current === "Top"  ? moWRef.current : moHRef.current;
      moScaleRef.current  = Math.min((canvas.width * 0.72) / cW, (canvas.height * 0.72) / cH, 0.25);
      moOffsetRef.current = { x: canvas.width * 0.14, y: canvas.height * 0.14 };
    };
    resize();
    window.addEventListener("resize", resize);

    // ── pure helpers (read from refs, no closures over state) ────────────────
    const boxToScreen = (box) => {
      const s = moScaleRef.current, { x: ox, y: oy } = moOffsetRef.current;
      const v = moViewRef.current, CH = moHRef.current;
      if (v === "Side")  return { sx: ox + box.z*s, sy: oy + (CH-box.y-box.h)*s, sw: box.d*s, sh: box.h*s };
      if (v === "Front") return { sx: ox + box.x*s, sy: oy + (CH-box.y-box.h)*s, sw: box.w*s, sh: box.h*s };
      return { sx: ox + box.x*s, sy: oy + box.z*s, sw: box.w*s, sh: box.d*s }; // Top
    };

    const rotIconRect = (sx, sy, sw) => ({ rx: sx + sw - 22, ry: sy + 3 });

    // ── draw (reads manualBoxesRef.current fresh each frame) ─────────────────
    const draw = () => {
      const activeBoxes = manualBoxesRef.current || autoBoxes;
      const s  = moScaleRef.current, { x: ox, y: oy } = moOffsetRef.current;
      const v  = moViewRef.current;
      const CL = moLRef.current, CW = moWRef.current, CH = moHRef.current;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#f0f3fa"; ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid
      const step = 500 * s;
      ctx.strokeStyle = "rgba(0,0,0,0.07)"; ctx.lineWidth = 0.5;
      for (let i = -5; i < 100; i++) {
        ctx.beginPath(); ctx.moveTo(ox + i*step, 0);          ctx.lineTo(ox + i*step, canvas.height); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, oy + i*step);           ctx.lineTo(canvas.width, oy + i*step);  ctx.stroke();
      }

      // Container rect
      let cw, ch;
      if      (v === "Side")  { cw = CW*s; ch = CH*s; }
      else if (v === "Front") { cw = CL*s; ch = CH*s; }
      else                     { cw = CL*s; ch = CW*s; }
      ctx.fillStyle = "rgba(37,99,235,0.04)"; ctx.fillRect(ox, oy, cw, ch);
      ctx.strokeStyle = "rgba(20,20,20,0.8)"; ctx.lineWidth = 2.5; ctx.strokeRect(ox, oy, cw, ch);

      // Dim labels
      ctx.fillStyle = "#64748b"; ctx.font = "11px 'DM Sans',sans-serif"; ctx.textAlign = "center";
      ctx.fillText(`${v==="Side"?CW:CL} mm`, ox + cw/2, oy - 8);
      ctx.save(); ctx.translate(ox - 12, oy + ch/2); ctx.rotate(-Math.PI/2);
      ctx.fillText(`${v==="Top"?CW:CH} mm`, 0, 0); ctx.restore();
      ctx.textAlign = "left";

      // Boxes
      activeBoxes.forEach((box, i) => {
        const rgb = hexToRgb(box.color);
        const { sx, sy, sw, sh } = boxToScreen(box);
        if (sw < 3 || sh < 3) return;

        // Fill
        const grd = ctx.createLinearGradient(sx, sy, sx, sy+sh);
        grd.addColorStop(0, `rgba(${Math.min(255,rgb.r+30)},${Math.min(255,rgb.g+30)},${Math.min(255,rgb.b+30)},0.93)`);
        grd.addColorStop(1, `rgba(${rgb.r},${rgb.g},${rgb.b},0.87)`);
        ctx.fillStyle = grd;
        ctx.beginPath(); ctx.roundRect(sx, sy, sw, sh, 4); ctx.fill();

        // Border
        ctx.strokeStyle = `rgba(${Math.max(0,rgb.r-60)},${Math.max(0,rgb.g-60)},${Math.max(0,rgb.b-60)},1)`;
        ctx.lineWidth = 1.8;
        ctx.beginPath(); ctx.roundRect(sx, sy, sw, sh, 4); ctx.stroke();

        // Labels inside box
        if (sw > 30 && sh > 24) {
          ctx.textAlign = "center";
          const fs = Math.max(7, Math.min(11, sw/8));
          ctx.font = `bold ${fs}px 'DM Sans',sans-serif`;
          ctx.fillStyle = "rgba(255,255,255,0.96)";
          const name = (box.label || box.product_name || `#${i+1}`);
          const maxC = Math.max(3, Math.floor(sw / (fs*0.6)));
          const dName = name.length > maxC ? name.slice(0, maxC-1)+"…" : name;
          const line1Y = sh > 46 ? sy + sh/2 - fs/2 - 1 : sy + sh/2 + fs/3;
          ctx.fillText(dName, sx + sw/2, line1Y);

          if (sh > 46) {
            const dfs = Math.max(6, Math.min(9, sw/10));
            ctx.font = `${dfs}px 'DM Sans',sans-serif`;
            ctx.fillStyle = "rgba(255,255,255,0.78)";
            ctx.fillText(`${Math.round(box.w)}×${Math.round(box.d)}×${Math.round(box.h)}`, sx+sw/2, line1Y+fs+4);
          }
          ctx.textAlign = "left";
        }

        // Rotate button (top-right)
        if (sw > 30 && sh > 22) {
          const { rx, ry } = rotIconRect(sx, sy, sw);
          ctx.save();
          ctx.fillStyle   = "rgba(255,255,255,0.92)";
          ctx.strokeStyle = "rgba(0,0,0,0.15)";
          ctx.lineWidth   = 0.7;
          ctx.beginPath(); ctx.roundRect(rx, ry, 18, 18, 4); ctx.fill(); ctx.stroke();
          ctx.strokeStyle = "#1e40af"; ctx.lineWidth = 1.8;
          ctx.beginPath(); ctx.arc(rx+9, ry+9, 5, 0.4, Math.PI*1.7); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(rx+13, ry+4); ctx.lineTo(rx+14.5, ry+8); ctx.lineTo(rx+10.5, ry+7); ctx.stroke();
          ctx.restore();
        }
      });

      // Footer
      ctx.fillStyle = "#94a3b8"; ctx.font = "11px 'DM Sans',sans-serif"; ctx.textAlign = "left";
      ctx.fillText(`📐 ${v} View  •  Drag box = move  •  🔄 = rotate box 90°  •  Scroll = zoom`, 14, canvas.height - 10);
    };
    moDrawRef.current = draw;

    // ── rAF loop — always redraws (no dirty flag needed) ────────────────────
    let running = true;
    const loop = () => {
      if (!running) return;
      if (moDrawRef.current) moDrawRef.current();
      moAnimRef.current = requestAnimationFrame(loop);
    };
    loop();

    // ── hit helpers (read from refs) ─────────────────────────────────────────
    const hitRotate = (mx, my) => {
      const bs = manualBoxesRef.current || autoBoxes;
      for (let i = bs.length-1; i >= 0; i--) {
        const { sx, sy, sw, sh } = boxToScreen(bs[i]);
        if (sw <= 30 || sh <= 22) continue;
        const { rx, ry } = rotIconRect(sx, sy, sw);
        if (mx >= rx && mx <= rx+18 && my >= ry && my <= ry+18) return i;
      }
      return -1;
    };
    const hitBox = (mx, my) => {
      const bs = manualBoxesRef.current || autoBoxes;
      for (let i = bs.length-1; i >= 0; i--) {
        const { sx, sy, sw, sh } = boxToScreen(bs[i]);
        if (mx >= sx && mx <= sx+sw && my >= sy && my <= sy+sh) return i;
      }
      return -1;
    };

    // ── rotate: swap dims for the clicked box only ───────────────────────────
    const rotateOne = (b, v, CL, CW, CH) => {
      const nb = { ...b };
      if (v === "Top") {
        // In top view we see w×d. We want to cycle through all 3 orientations:
        // Find which dimension is longest and bring it into the floor plane (w or d).
        // If h is the longest (box is upright/tall), lay it down along w axis.
        // If w is the longest (box is lying along x), rotate to lie along z (swap w↔d).
        // If d is the longest (box is lying along z), stand it upright (swap d↔h).
        const longest = Math.max(nb.w, nb.h, nb.d);
        if (nb.h === longest) {
          // Upright tall → lay flat along X (swap w↔h)
          const tmp = nb.w; nb.w = nb.h; nb.h = tmp;
        } else if (nb.w === longest) {
          // Lying along X → rotate to lie along Z (swap w↔d)
          const tmp = nb.w; nb.w = nb.d; nb.d = tmp;
        } else {
          // Lying along Z → stand upright (swap d↔h)
          const tmp = nb.d; nb.d = nb.h; nb.h = tmp;
        }
        nb.x = Math.max(0, Math.min(CL - nb.w, nb.x));
        nb.z = Math.max(0, Math.min(CW - nb.d, nb.z));
        nb.y = Math.max(0, Math.min(CH - nb.h, nb.y));
      } else if (v === "Front") {
        const tmp = nb.w; nb.w = nb.h; nb.h = tmp;
        nb.x = Math.max(0, Math.min(CL - nb.w, nb.x));
        nb.y = Math.max(0, Math.min(CH - nb.h, nb.y));
      } else { // Side
        const tmp = nb.d; nb.d = nb.h; nb.h = tmp;
        nb.z = Math.max(0, Math.min(CW - nb.d, nb.z));
        nb.y = Math.max(0, Math.min(CH - nb.h, nb.y));
      }
      return nb;
    };

    const doRotate = (idx) => {
      const v  = moViewRef.current;
      const CL = moLRef.current, CW = moWRef.current, CH = moHRef.current;
      setManualBoxes(prev => {
        const base = [...(prev || autoBoxes)];
        base[idx] = rotateOne(base[idx], v, CL, CW, CH);
        return base;
      });
      isDirtyRef.current = true;
    };

    // ── drag ─────────────────────────────────────────────────────────────────
    const onDown = (e) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left, my = e.clientY - rect.top;
      const ri = hitRotate(mx, my);
      if (ri !== -1) { doRotate(ri); return; }
      const bi = hitBox(mx, my);
      if (bi !== -1) {
        const b = (manualBoxesRef.current || autoBoxes)[bi];
        moDragRef.current = { active:true, boxIndex:bi, startMouseX:mx, startMouseY:my, startBoxX:b.x, startBoxY:b.y, startBoxZ:b.z };
        canvas.style.cursor = "grabbing";
      }
    };

    // ── collision helpers ─────────────────────────────────────────────────────
    const EPS = 2;
    const overlaps1d = (a1, a2, b1, b2) => a1 < b2 - EPS && a2 > b1 + EPS;
    const collides3d = (b, allBoxes, skipIdx) => {
      for (let i = 0; i < allBoxes.length; i++) {
        if (i === skipIdx) continue;
        const o = allBoxes[i];
        if (
          overlaps1d(b.x, b.x+b.w, o.x, o.x+o.w) &&
          overlaps1d(b.y, b.y+b.h, o.y, o.y+o.h) &&
          overlaps1d(b.z, b.z+b.d, o.z, o.z+o.d)
        ) return true;
      }
      return false;
    };
    // Auto-stack: find the highest surface at b's x/z footprint
    // Returns y=0 (floor) if nothing is below, or top surface of highest supporting box
    const snapToStack = (b, allBoxes, skipIdx, CH) => {
      if (b.h >= CH - EPS) return 0;
      let highestY = 0;
      for (let i = 0; i < allBoxes.length; i++) {
        if (i === skipIdx) continue;
        const o = allBoxes[i];
        // Only consider boxes that are BELOW or AT floor level as supporters
        // A box at same y level is a neighbor, not a supporter
        if (overlaps1d(b.x, b.x+b.w, o.x, o.x+o.w) &&
            overlaps1d(b.z, b.z+b.d, o.z, o.z+o.d)) {
          // Only stack on top if the other box top surface is above floor
          // and won't cause the moved box to exceed container
          const topSurface = o.y + o.h;
          if (topSurface + b.h <= CH + EPS) {
            highestY = Math.max(highestY, topSurface);
          }
        }
      }
      return Math.max(0, Math.min(CH - b.h, highestY));
    };

    const onMove = (e) => {
      const dr = moDragRef.current;
      if (!dr.active) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left, my = e.clientY - rect.top;
      const s  = moScaleRef.current;
      const dx = (mx - dr.startMouseX) / s;
      const dy = (my - dr.startMouseY) / s;
      const v  = moViewRef.current;
      const CL = moLRef.current, CW = moWRef.current, CH = moHRef.current;
      setManualBoxes(prev => {
        const base = [...(prev || autoBoxes)];
        const b    = { ...base[dr.boxIndex] };
        if (v === "Side") {
          b.z = Math.max(0, Math.min(CW-b.d, dr.startBoxZ + dx));
          b.y = Math.max(0, Math.min(CH-b.h, dr.startBoxY - dy));
        } else if (v === "Front") {
          b.x = Math.max(0, Math.min(CL-b.w, dr.startBoxX + dx));
          b.y = Math.max(0, Math.min(CH-b.h, dr.startBoxY - dy));
        } else {
          // Top view: move x/z only
          b.x = Math.max(0, Math.min(CL-b.w, dr.startBoxX + dx));
          b.z = Math.max(0, Math.min(CW-b.d, dr.startBoxZ + dy));
          // Always calculate correct y by finding what's below at this x/z position
          // snapToStack returns 0 (floor) if nothing is below, or top of highest box
          b.y = snapToStack(b, base, dr.boxIndex, CH);
        }
        if (collides3d(b, base, dr.boxIndex)) return prev;
        base[dr.boxIndex] = b;
        return base;
      });
      isDirtyRef.current = true;
    };

    const onUp = () => { moDragRef.current.active = false; canvas.style.cursor = "grab"; isDirtyRef.current = true; };
    const onWheel = (e) => { e.preventDefault(); moScaleRef.current = Math.max(0.02, Math.min(0.5, moScaleRef.current * (e.deltaY < 0 ? 1.1 : 0.9))); };

    canvas.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup",   onUp);
    canvas.addEventListener("wheel",     onWheel, { passive: false });

    return () => {
      running = false;
      cancelAnimationFrame(moAnimRef.current);
      window.removeEventListener("resize",    resize);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup",   onUp);
      canvas.removeEventListener("mousedown", onDown);
      canvas.removeEventListener("wheel",     onWheel);
      moDrawRef.current = null;
    };
  }, [isManualOverride, cont]); // minimal deps — everything else read from refs

// Force 3D canvas to redraw whenever manual positions change + persist to localStorage
  useEffect(() => {
    if (manualBoxes !== null) {
      isDirtyRef.current = true;
      if (manualBoxesKey) {
        try {
          localStorage.setItem(manualBoxesKey, JSON.stringify(manualBoxes));
        } catch {}
      }
    }
  }, [manualBoxes]);

  // ── ADD ITEM & REPACK STATE ───────────────────────────────────────────────
  const [showAddItem, setShowAddItem] = useState(false);
  const [addItemForm, setAddItemForm] = useState({
    product_name: "", cargo_type: "Cartons", color: "#22c55e",
    length_mm: "", width_mm: "", height_mm: "", weight_kg: "", quantity: "1"
  });
  const [addItemLoading, setAddItemLoading] = useState(false);
  const [addItemError, setAddItemError] = useState("");

  const handleAddItemRepack = async () => {
    const f = addItemForm;
    if (!f.product_name || !f.length_mm || !f.width_mm || !f.height_mm || !f.weight_kg) {
      setAddItemError("Please fill in all fields."); return;
    }
    setAddItemLoading(true); setAddItemError("");
    try {
      const newItem = {
        product_name: f.product_name,
        cargo_type: f.cargo_type,
        type: f.cargo_type,
        color: f.color,
        length_mm: Number(f.length_mm),
        width_mm: Number(f.width_mm),
        height_mm: Number(f.height_mm),
        weight_kg: Number(f.weight_kg),
        quantity: Number(f.quantity) || 1,
        shipment_name: shipmentName || "",
        layers_count: 1, max_height_mm: 0, max_mass_kg: 0,
        tilt_length: false, tilt_width: false, no_stack: false, rotate: true,
      };
      const allItems = [...cargoItems.map(ci => ({
        ...ci,
        length_mm: Number(ci.length_mm||0), width_mm: Number(ci.width_mm||0),
        height_mm: Number(ci.height_mm||0), weight_kg: Number(ci.weight_kg||0),
        quantity: Number(ci.quantity||0),
      })), newItem];

      const res = await fetch("http://localhost:5000/api/calculate-packing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ container: cont, cargoItems: allItems }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Packing failed");

      // Navigate to fresh 3D view with new result
      navigate("/3d-viewer", {
        state: {
          result: data,
          selectedContainer: cont,
          cargoItems: allItems,
          placements: data.placements,
        },
        replace: true,
      });
    } catch (err) {
      setAddItemError(err.message || "Failed. Check backend is running.");
    } finally {
      setAddItemLoading(false);
    }
  };

  // ── SPACE OPTIMISATION: compact boxes when entering override ──────────────
const compactBoxes = (srcBoxes) => {
    const GAP = 1; // 1mm separation to prevent touching faces from z-fighting
    const sorted = [...srcBoxes].map((b, i) => ({ ...b, _i: i }))
      .sort((a, b) => a.x - b.x || a.z - b.z || a.y - b.y);
    const placed = [];
    for (const box of sorted) {
      const xCandidates = [0, ...placed.map(o => o.x + o.w + GAP)].filter(x => x + box.w <= L + 1);
      const zCandidates = [0, ...placed.map(o => o.z + o.d + GAP)].filter(z => z + box.d <= W + 1);
      let bestX = box.x, bestY = box.y, bestZ = box.z, bestScore = Infinity;
      for (const tx of xCandidates) {
        for (const tz of zCandidates) {
          if (tx + box.w > L + 1 || tz + box.d > W + 1) continue;
          let ty = 0;
          for (const o of placed) {
            const xOver = tx < o.x + o.w - GAP && tx + box.w > o.x + GAP;
            const zOver = tz < o.z + o.d - GAP && tz + box.d > o.z + GAP;
            if (xOver && zOver) ty = Math.max(ty, o.y + o.h + GAP);
          }
          if (ty + box.h > H + 1) continue;
          const collides = placed.some(o =>
            tx < o.x + o.w - GAP && tx + box.w > o.x + GAP &&
            tz < o.z + o.d - GAP && tz + box.d > o.z + GAP &&
            ty < o.y + o.h - GAP && ty + box.h > o.y + GAP
          );
          if (collides) continue;
          const score = ty * 100000 + tx * 1000 + tz;
          if (score < bestScore) { bestScore = score; bestX = tx; bestY = ty; bestZ = tz; }
        }
      }
      placed.push({ ...box, x: bestX, y: bestY, z: bestZ });
    }
    const result = new Array(srcBoxes.length);
    placed.forEach(b => { result[b._i] = b; });
    return result;
  };

const validateManualLayout = (items) => {
    const EPS = 2;
    const warnings = [];
    // Detect floating / unsupported boxes
// Floating check: warn ONLY when more than 50% of box base is unsupported
boxes.forEach((box, index) => {
  const boxY = Number(box.y || 0);

  // Box touching container floor is NOT floating
  if (boxY <= 5) return;

  const boxArea = Number(box.w || box.width || 0) * Number(box.d || box.depth || 0);
  if (boxArea <= 0) return;

  let supportedArea = 0;

  boxes.forEach((below, belowIndex) => {
    if (belowIndex === index) return;

    const belowTop =
      Number(below.y || 0) + Number(below.h || below.height || 0);

    // Only consider boxes directly under this box
    const isDirectlyBelow = Math.abs(belowTop - boxY) <= 10;
    if (!isDirectlyBelow) return;

    const boxLeft = Number(box.x || 0);
    const boxRight = boxLeft + Number(box.w || box.width || 0);
    const boxFront = Number(box.z || 0);
    const boxBack = boxFront + Number(box.d || box.depth || 0);

    const belowLeft = Number(below.x || 0);
    const belowRight = belowLeft + Number(below.w || below.width || 0);
    const belowFront = Number(below.z || 0);
    const belowBack = belowFront + Number(below.d || below.depth || 0);

    const overlapW = Math.max(
      0,
      Math.min(boxRight, belowRight) - Math.max(boxLeft, belowLeft)
    );

    const overlapD = Math.max(
      0,
      Math.min(boxBack, belowBack) - Math.max(boxFront, belowFront)
    );

    supportedArea += overlapW * overlapD;
  });

  const supportedPercent = supportedArea / boxArea;

  // Warning only when more than 50% is floating
  if (supportedPercent < 0.5) {
    warnings.push({
      type: "Floating",
      message: `${box.label || box.product_name || `Box ${index + 1}`} is more than 50% floating. Please align it properly.`
    });
  }
});

    const overlaps1d = (a1, a2, b1, b2) =>
      a1 < b2 - EPS && a2 > b1 + EPS;

    const getName = (box, index) =>
      box.product_name || box.label || `Box ${index + 1}`;

    items.forEach((box, i) => {
      const name = getName(box, i);

      // 1) Outside container check
      if (
        box.x < -EPS ||
        box.y < -EPS ||
        box.z < -EPS ||
        box.x + box.w > L + EPS ||
        box.y + box.h > H + EPS ||
        box.z + box.d > W + EPS
      ) {
        warnings.push({
          type: "outside",
          name,
          message: `"${name}" is outside the container boundary.`,
        });
      }

      // 2) Floating check: if y > 0, there must be another box exactly below
      if (box.y > EPS) {
        const hasSupport = items.some((base, j) => {
          if (i === j) return false;

          const baseTop = base.y + base.h;
          const isTouchingTop = Math.abs(baseTop - box.y) <= EPS;

          const hasXSupport = overlaps1d(
            box.x,
            box.x + box.w,
            base.x,
            base.x + base.w
          );

          const hasZSupport = overlaps1d(
            box.z,
            box.z + box.d,
            base.z,
            base.z + base.d
          );

          return isTouchingTop && hasXSupport && hasZSupport;
        });

        if (!hasSupport) {
          warnings.push({
            type: "floating",
            name,
            message: `"${name}" is floating. It has no proper support below it.`,
          });
        }
      }

      // 3) Overlap check with other boxes
      for (let j = i + 1; j < items.length; j++) {
        const other = items[j];
        const otherName = getName(other, j);

        const isOverlapping =
          overlaps1d(box.x, box.x + box.w, other.x, other.x + other.w) &&
          overlaps1d(box.y, box.y + box.h, other.y, other.y + other.h) &&
          overlaps1d(box.z, box.z + box.d, other.z, other.z + other.d);

        if (isOverlapping) {
          warnings.push({
            type: "overlap",
            name,
            message: `"${name}" overlaps with "${otherName}".`,
          });
        }
      }
    });

    return warnings;
  };
  // Show popup automatically when entering 3D Viewer if boxes are floating / overlapping / outside
// useEffect(() => {
//   // DO NOT show warning while inside manual override
//   if (isManualOverride) return;

//   // show only once after returning to 3D
//   if (!cont) return;
//   if (entryWarningShownRef.current) return;

//   // only validate manual arrangement after Apply & Back to 3D
//   if (!manualBoxes || manualBoxes.length === 0) return;

//   const warnings = validateManualLayout(manualBoxes);

//   if (warnings.length > 0) {
//     entryWarningShownRef.current = true;

//     setLayoutWarnings(warnings);

//     // small delay feels natural after returning to 3D
//     setTimeout(() => {
//       setShowLayoutWarning(true);
//     }, 300);
//   }
// }, [isManualOverride, manualBoxes, cont]);

const handleManualOverrideToggle = () => {
    if (!isManualOverride) {
      if (manualBoxes === null) {
        // Use autoBoxes directly — do NOT compact/rearrange them
        // compactBoxes changes positions which confuses users
        setManualBoxes([...autoBoxes]);
      }
      setShowLayoutWarning(false);
      setIsManualOverride(true);
    } else {
      // Validate manual layout before returning to 3D
    const current = manualBoxesRef.current || manualBoxes || autoBoxes;
  const warnings = validateManualLayout(current);

  setManualBoxes(current);      // ← this is correct, keep it
  setIsManualOverride(false);
  setActiveView("3D");
  isDirtyRef.current = true;


      if (warnings.length > 0) {
        setLayoutWarnings(warnings);
        setShowLayoutWarning(true);
      }

      // Write orientation changes back to the database
      current.forEach((mb) => {
        const id = mb._original?.item_id;
        if (!id) return;
        const orig = autoBoxes.find((ab) => ab._original?.item_id === id);
        if (!orig) return;
        const dimChanged =
          Math.round(mb.w) !== Math.round(orig.w) ||
          Math.round(mb.h) !== Math.round(orig.h) ||
          Math.round(mb.d) !== Math.round(orig.d);
        if (!dimChanged) return;
        const wasTilted =
          Math.round(mb.h) === Math.round(orig.w) ||
          Math.round(mb.h) === Math.round(orig.d);
        const wasRotated =
          Math.round(mb.w) === Math.round(orig.d) ||
          Math.round(mb.d) === Math.round(orig.w);
        const o = mb._original || {};
        fetch(`http://localhost:5000/api/cargo/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            shipment_name: o.shipment_name || "",
            product_name:  o.product_name  || mb.label || "",
            cargo_type:    o.cargo_type    || mb.cargo_type || "Cartons",
            color:         mb.color        || o.color || "#1565c0",
            length_mm:     Math.round(mb.w),
            height_mm:     Math.round(mb.h),
            width_mm:      Math.round(mb.d),
            weight_kg:     o.weight_kg     || 0,
            quantity:      o.quantity      || 1,
            layers_count:  o.layers_count  || 1,
            max_height_mm: o.max_height_mm || 0,
            max_mass_kg:   o.max_mass_kg   || 0,
            tilt_length:   wasTilted  ? 1 : 0,
            tilt_width:    0,
            no_stack:      o.no_stack || false,
            rotate:        wasRotated ? 1 : 0,
          }),
        }).catch(() => {});
      });
    }
  };

const handleResetOverride = () => {
  // Reset restores fresh auto-packing positions and clears ALL saved data
  setManualBoxes([...autoBoxes]);
  localStorage.removeItem("rejectedItemsCleared");

  // clear old fitted success message
  setFitError("");

  // bring rejected item button back
  setRejectedItems(result.rejected || []);

  // remove saved fitted layout, because user reset positions
  if (savedLayoutKey) {
    localStorage.removeItem(savedLayoutKey);
  }
  if (manualBoxesKey) {
    localStorage.removeItem(manualBoxesKey);
  }

  isDirtyRef.current = true;
  moIsDirtyRef.current = true;
};

  const setView = (v) => {
    setActiveView(v);
    const cam = camRef.current;
if (v === "3D")    { cam.angleY = -0.55; cam.angleX = 0.32;  cam.scale = secCont ? 0.055 : 0.12; }
    if (v === "Front") { cam.angleY = 0;     cam.angleX = 0;     cam.scale = 0.09; }
    if (v === "Top")   { cam.angleY = 0;     cam.angleX = 1.4;   cam.scale = 0.09; }
    if (v === "Side")  { cam.angleY = 1.57;  cam.angleX = 0;     cam.scale = 0.11; }
    isDirtyRef.current = true;
  };

  const packedCount = placements.length;
  const packedWeight = cargoItems.reduce(
    (sum, item) => sum + Number(item.weight_kg || 0) * Number(item.quantity || 0), 0
  );

  const handlePrintImage = () => {
    const canvas = canvasRef.current;
    if (!canvas || !cont) return;
    const PANEL_W = 320, PADDING = 24;
    const canvasH = canvas.height, canvasW = canvas.width;
    const out = document.createElement("canvas");
    out.width = PANEL_W + canvasW; out.height = canvasH;
    const ctx = out.getContext("2d");
    ctx.fillStyle = "#f0f3fa"; ctx.fillRect(0, 0, out.width, out.height);
    ctx.drawImage(canvas, PANEL_W, 0, canvasW, canvasH);
    ctx.fillStyle = "#1a2744"; ctx.fillRect(0, 0, PANEL_W, canvasH);
    const text = (str, x, y, size, color, bold = false) => {
      ctx.font = `${bold ? "700" : "400"} ${size}px 'DM Sans','Segoe UI',sans-serif`;
      ctx.fillStyle = color; ctx.fillText(String(str ?? ""), x, y);
    };
    const line = (x1, y1, x2, y2, color, width = 1) => {
      ctx.strokeStyle = color; ctx.lineWidth = width; ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
    };
    const accentBar = (y) => { ctx.fillStyle = "#e67e22"; ctx.fillRect(PADDING, y - 12, 3, 14); };
    let cy2 = PADDING + 20;
    text("⬡ CargoSet", PADDING + 8, cy2, 18, "#e67e22", true); cy2 += 10;
    line(PADDING, cy2, PANEL_W - PADDING, cy2, "rgba(255,255,255,0.1)"); cy2 += 20;
    if (shipmentName) {
      ctx.fillStyle = "rgba(249,115,22,0.15)"; ctx.beginPath(); ctx.roundRect(PADDING, cy2-14, PANEL_W-PADDING*2, 26, 6); ctx.fill();
      text(String(shipmentName).toUpperCase(), PADDING+8, cy2+6, 13, "#f97316", true); cy2 += 38;
    }
    accentBar(cy2); text("CONTAINER", PADDING+8, cy2, 10, "#8899bb", true); cy2 += 18;
    [
      ["Name", cont.container_name || cont.name || ""],
      ["Length", `${cont.internal_length_mm || cont.length_mm || ""} mm`],
      ["Width",  `${cont.internal_width_mm  || cont.width_mm  || ""} mm`],
      ["Height", `${cont.internal_height_mm || cont.height_mm || ""} mm`],
      ["Max Payload", `${cont.max_payload_kg || ""} kg`],
    ].forEach(([label, val]) => {
      text(label, PADDING+4, cy2, 11, "#8899bb");
      text(val, PANEL_W-PADDING-ctx.measureText(String(val)).width-4, cy2, 11, "#ffffff", true);
      cy2 += 18; line(PADDING, cy2-4, PANEL_W-PADDING, cy2-4, "rgba(255,255,255,0.06)");
    });
    cy2 += 22; accentBar(cy2); text("RESULTS", PADDING+10, cy2, 10, "#8899bb"); cy2 += 20;
    [
      ["Packed Boxes", packedCount],
      ["Total Placements", placements.length],
      ["Total Weight", `${packedWeight.toLocaleString()} kg`],
      ["Container Type", getShortContainerName(cont.container_name || cont.name || "")],
    ].forEach(([label, val]) => {
      ctx.fillStyle = "rgba(255,255,255,0.06)"; ctx.beginPath(); ctx.roundRect(PADDING, cy2-2, PANEL_W-PADDING*2, 28, 5); ctx.fill();
      text(label, PADDING+8, cy2+13, 10, "#8899bb");
      text(val, PANEL_W-PADDING-ctx.measureText(String(val)).width-18, cy2+13, 12, "#e67e22", true);
      cy2 += 34;
    });
    if (odc || overweight) {
      cy2 += 4; accentBar(cy2); text("WARNINGS", PADDING+8, cy2, 10, "#8899bb", true); cy2 += 18;
      if (odc && overWidthMm > 0) {
        ctx.fillStyle = "rgba(239,68,68,0.15)"; ctx.beginPath(); ctx.roundRect(PADDING, cy2-2, PANEL_W-PADDING*2, 22, 4); ctx.fill();
        text(`Over Width: +${(overWidthMm/10).toFixed(0)} cm`, PADDING+8, cy2+13, 11, "#f87171", true); cy2 += 28;
      }
      if (odc && overHeightMm > 0) {
        ctx.fillStyle = "rgba(59,130,246,0.15)"; ctx.beginPath(); ctx.roundRect(PADDING, cy2-2, PANEL_W-PADDING*2, 22, 4); ctx.fill();
        text(`Over Height: +${(overHeightMm/10).toFixed(0)} cm`, PADDING+8, cy2+13, 11, "#93c5fd", true); cy2 += 28;
      }
      if (overweight && overweightKg > 0) {
        ctx.fillStyle = "rgba(245,158,11,0.15)"; ctx.beginPath(); ctx.roundRect(PADDING, cy2-2, PANEL_W-PADDING*2, 22, 4); ctx.fill();
        text(`Over Weight: +${overweightKg.toFixed(0)} kg`, PADDING+8, cy2+13, 11, "#fbbf24", true); cy2 += 28;
      }
    }
    cy2 += 22; accentBar(cy2); text("LEGEND", PADDING+10, cy2, 10, "#8899bb"); cy2 += 20;
Object.values(
      boxes.reduce((acc, item) => {
        const key = item.product_name || item.label || "Item";
        if (!acc[key]) acc[key] = { product_name: key, color: item.color || "#1565c0", count: 0 };
        acc[key].count += 1;
        return acc;
      }, {})
    ).forEach(({ product_name, color, count }) => {
      if (cy2 > canvasH - 40) return;
      ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(PADDING+4, cy2-9, 12, 12, 3); ctx.fill();
      text(product_name, PADDING+22, cy2, 11, "#dde");
      text(`×${count}`, PANEL_W-PADDING-28, cy2, 11, "#8899bb", true);
      line(PADDING, cy2+6, PANEL_W-PADDING, cy2+6, "rgba(255,255,255,0.06)"); cy2 += 22;
    });
    text(
      new Date().toLocaleString("en-US", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" }),
      PADDING+4, canvasH-14, 10, "rgba(136,153,187,0.7)"
    );
    line(PANEL_W, 0, PANEL_W, canvasH, "rgba(255,255,255,0.15)", 1);
    const link = document.createElement("a");
    link.href = out.toDataURL("image/png");
    link.download = `${shipmentName || "container_packing"}.png`;
    link.click();
  };

  if (!cont) {
    return (
      <div style={styles.noData}>
        <p>No result data found.</p>
        <button style={styles.backBtn} onClick={() => navigate("/cargo-list", { state: { viewShipmentName: shipmentName || null } })}>
          ← Back to Cargo List
        </button>
      </div>
    );
  }

return (
  <div style={styles.root}>

<nav style={styles.nav}>
  <div style={styles.navLogo}>
    <span style={styles.navLogoIcon}>⬡</span>
    <span>CargoSet</span>
  </div>

  {!isSharedView && (
    <div style={styles.navTabs}>
      {["Dashboard", "Cargo Items", "CostAnalysis", "3D Viewer"].map((t) => (
        <button
          key={t}
          style={{ ...styles.navTab, ...(t === "3D Viewer" ? styles.navTabActive : {}) }}
          onClick={() => {
            if (t === "Cargo Items") navigate("/cargo-list", { state: { viewShipmentName: shipmentName || null } });
            if (t === "Dashboard") navigate("/dashboard");
            if (t === "CostAnalysis") navigate("/CostAnalysis", { state: { cargoItems, selectedContainer: cont, shipmentName } });
          }}
        >
          {t}
        </button>
      ))}
    </div>
  )}

  <div style={{ marginLeft: "auto" }}>
    <button style={styles.printBtn} onClick={handlePrintImage}>
      ↓ Export PNG
    </button>
  </div>
{(rejectedItems.length > 0 && manualBoxes && isManualOverride) && (
  <div style={{display:"flex",alignItems:"center",gap:6}}>
<button
      onClick={handleFitRejected}
      disabled={fitLoading || fitError.startsWith("✅") || rejectedItems.length === 0}
      style={{
        ...styles.printBtn,
        background: fitError.startsWith("✅")
          ? "linear-gradient(135deg,#16a34a,#22c55e)"
          : fitError.startsWith("⚠️")
            ? "linear-gradient(135deg,#d97706,#f59e0b)"
            : fitLoading
              ? "#86efac"
              : "linear-gradient(135deg,#16a34a,#22c55e)",
        color:"#fff",
        border:"none",
        fontWeight:700,
        padding:"6px 16px",
        boxShadow:"0 2px 8px rgba(22,163,74,0.35)",
        cursor: fitLoading || fitError.startsWith("✅") || rejectedItems.length === 0 ? "not-allowed" : "pointer"
      }}
    >
{fitLoading
        ? "⏳ Fitting..."
        : rejectedItems.length === 0
          ? "✅ All Items Fitted"
          : fitError.includes("Still Can't Fit") || fitError.includes("still couldn't fit") || fitError.includes("still can't fit")
            ? `⚠️ ${rejectedItems.length} Still Can't Fit`
            : `🔧 Fit ${rejectedItems.length} Rejected Item${rejectedItems.length>1?"s":""}`}
    </button>

{fitError && (
      <span
        style={{
          fontSize:11,
          color:fitError.startsWith("✅") ? "#16a34a" : "#d97706",
          maxWidth:300,
          whiteSpace:"nowrap"
        }}
      >
        {fitError.includes("still can't fit") || fitError.includes("still couldn't fit")
          ? `⚠️ ${rejectedItems.length} item(s) couldn't fit — rearrange boxes & try again`
          : fitError}
      </span>
    )}
  </div>
)}
        {/* Save Layout button — only visible in 3D view (not during Manual Override) */}
        {!isSharedView && !isManualOverride && (
          
          <button
            onClick={layoutSaved ? undefined : handleSaveLayout}
            style={{
              ...styles.printBtn,
              background: layoutSaved
                ? "linear-gradient(135deg,#16a34a,#22c55e)"
                : "linear-gradient(135deg,#2563eb,#1d4ed8)",
              color: "#fff",
              border: "none",
              fontWeight: 700,
              padding: "6px 16px",
              boxShadow: layoutSaved
                ? "0 2px 8px rgba(22,163,74,0.35)"
                : "0 2px 8px rgba(37,99,235,0.35)",
              transition: "all 0.3s",
              minWidth: 110,
            }}
          >
            {layoutSaved ? "✅ Completed!" : "💾 Completed"}
          </button>
        )}
        {/* {!isSharedView && (
        <button
        
          onClick={handleManualOverrideToggle}
          style={{
            ...styles.printBtn,
            background: isManualOverride ? "linear-gradient(135deg,#dc2626,#ef4444)" : "linear-gradient(135deg,#f59e0b,#f97316)",
            color: "#fff",
            border: "none",
            fontWeight: 700,
            padding: "6px 16px",
            boxShadow: isManualOverride ? "0 2px 8px rgba(220,38,38,0.35)" : "0 2px 8px rgba(245,158,11,0.35)",
          }}
        >
          {isManualOverride ? "✅ Apply & Back to 3D" : "✏️ Manual Override"}
        </button>
        )} */}
      </nav>

      <div style={styles.body}>
<aside style={styles.panel}>
          <Section title="Container">
            <Field label="Name" unit="" value={cont.container_name || cont.name || ""} />
            <Field label="Length" unit="mm" value={cont.internal_length_mm || cont.length_mm || ""} />
            <Field label="Width"  unit="mm" value={cont.internal_width_mm  || cont.width_mm  || ""} />
            <Field label="Height" unit="mm" value={cont.internal_height_mm || cont.height_mm || ""} />
            <Field label="Max Payload" unit="kg" value={cont.max_payload_kg || ""} />
          </Section>
          {!isSharedView && (
          <button style={styles.calcBtn} onClick={() => navigate("/cargo-list", { state: { viewShipmentName: shipmentName || null } })}>
            ⚡ Recalculate Packing
          </button>
          )}
<Section title="View Presets">
  <div style={styles.viewGrid}>
    {["3D"].map((v) => (
      <button
        key={v}
        style={{
          ...styles.viewBtn,
          ...(activeView === v ? styles.viewBtnActive : {}),
        }}
        onClick={() => setView(v)}
      >
        {v}
      </button>
    ))}
  </div>
</Section>
          <Section title="Results">
            <div style={styles.statsGrid}>
              <Stat val={packedCount} label="Packed Boxes" />
              <Stat val={placements.length} label="Placements" />
              <Stat val={packedWeight.toLocaleString()} label="Weight kg" />
              <Stat val={getShortContainerName(cont.container_name || cont.name || "")} label="Container" />
            </div>
          </Section>
          <Section title="Legend">
{boxes.length === 0 ? (
              <div style={{ color: "#94a3b8", fontSize: 12 }}>No packed items</div>
            ) : (
              Object.values(
                boxes.reduce((acc, item) => {
                  const key = item.product_name || item.label || "Item";
                  if (!acc[key]) acc[key] = { product_name: key, color: item.color || "#1565c0", count: 0 };
                  acc[key].count += 1;
                  return acc;
                }, {})
              ).map((d, i) => (
                <div key={i} style={styles.legendRow}>
                  <div style={{ ...styles.legendDot, background: d.color }} />
                  <span style={styles.legendName}>{d.product_name}</span>
                  <span style={styles.legendCount}>×{d.count}</span>
                </div>
              ))
            )}
          </Section>
          </aside>


        {/* canvasWrap holds BOTH canvases stacked; we show/hide via visibility so
            the 3D canvas always has real pixel dimensions and never loses its loop */}
        <div style={{ ...styles.canvasWrap, position: "relative" }}>

          {/* ── 3D canvas — always in DOM, just invisible during override ── */}
          <canvas
            ref={canvasRef}
            style={{
              ...styles.canvas,
              position: "absolute", inset: 0,
              visibility: isManualOverride ? "hidden" : "visible",
              pointerEvents: isManualOverride ? "none" : "auto",
            }}
          />

          {/* 3D overlays — only when NOT in override */}
          {!isManualOverride && (
            <>
              <div style={{ ...styles.overlayTL, position: "absolute", zIndex: 5 }}>
                <Pill>📦 {(cont.internal_length_mm || cont.length_mm || 0)} × {(cont.internal_width_mm || cont.width_mm || 0)} × {(cont.internal_height_mm || cont.height_mm || 0)} mm</Pill>
                <Pill accent>{costBasedPlan ? `Plan: ${costBasedPlan}` : (cont.container_name || cont.name || "")}</Pill>
                {shipmentName && <Pill shipment>{String(shipmentName).toUpperCase()}</Pill>}
                {odc && overWidthMm > 0  && <Pill warning>OW +{(overWidthMm/10).toFixed(0)} cm</Pill>}
                {odc && overHeightMm > 0 && <Pill info>OH +{(overHeightMm/10).toFixed(0)} cm</Pill>}
                {overweight && overweightKg > 0 && <Pill danger>OWT +{overweightKg.toFixed(0)} kg</Pill>}
              </div>
              <div style={{ ...styles.hint, position: "absolute", zIndex: 5 }}>🖱 Drag to rotate · Scroll to zoom</div>
              <div style={{ ...styles.zoomBtns, position: "absolute", zIndex: 5 }}>
                {[
                  { icon: "+", action: () => { camRef.current.scale = Math.min(1.5, camRef.current.scale + 0.06); isDirtyRef.current = true; } },
                  { icon: "−", action: () => { camRef.current.scale = Math.max(0.04, camRef.current.scale - 0.06); isDirtyRef.current = true; } },
                  { icon: "↺", action: () => setView("3D") },
                ].map(({ icon, action }) => (
                  <button key={icon} style={styles.zoomBtn} onClick={action}>{icon}</button>
                ))}
              </div>
            </>
          )}

          {/* ── 2D Manual Override canvas — overlaid on top ── */}
          {isManualOverride && (
            <div style={{ position: "absolute", inset: 0, zIndex: 10 }}>
              {/* View selector tabs */}
              <div style={{
                position: "absolute", top: 14, right: 14, zIndex: 20,
                display: "flex", gap: 6, background: "rgba(255,255,255,0.95)",
                border: "1px solid rgba(0,0,0,0.1)", borderRadius: 10, padding: "5px 8px",
                boxShadow: "0 2px 12px rgba(0,0,0,0.12)", backdropFilter: "blur(8px)",
              }}>
                {["Top", "Front", "Side"].map(v => (
                  <button key={v} onClick={() => setMoView(v)} style={{
                    padding: "5px 14px", borderRadius: 7, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 12,
                    background: moView === v ? "linear-gradient(135deg,#f59e0b,#f97316)" : "#f1f5f9",
                    color: moView === v ? "#fff" : "#64748b",
                    boxShadow: moView === v ? "0 2px 6px rgba(245,158,11,0.3)" : "none",
                    transition: "all 0.15s",
                  }}>{v}</button>
                ))}
              </div>

              {/* Reset button */}
              <button onClick={handleResetOverride} style={{
                position: "absolute", top: 14, left: 14, zIndex: 20,
                padding: "6px 14px", background: "rgba(255,255,255,0.95)", border: "1px solid rgba(0,0,0,0.1)",
                borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 12, color: "#64748b",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)", backdropFilter: "blur(8px)",
              }}>↺ Reset Positions</button>

              {/* Info banner */}
              <div style={{
                position: "absolute", top: 14, left: "50%", transform: "translateX(-50%)", zIndex: 20,
                background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.4)",
                borderRadius: 20, padding: "5px 16px", fontSize: 12, fontWeight: 600, color: "#b45309",
                backdropFilter: "blur(8px)", whiteSpace: "nowrap",
              }}>
                ✏️ Manual Override Mode — drag boxes to reposition · scroll to zoom
              </div>

              <canvas
                ref={moCanvasRef}
                style={{ width: "100%", height: "100%", display: "block", cursor: "grab" }}
              />
            </div>
          )}
        </div>
      </div>

{toast && (
        <div style={{
          position:"fixed", bottom:32, left:"50%", transform:"translateX(-50%)",
          zIndex:9999, background: toast.type === "success" ? "#16a34a" : "#dc2626",
          color:"#fff", padding:"12px 28px", borderRadius:12, fontSize:14,
          fontWeight:600, boxShadow:"0 4px 20px rgba(0,0,0,0.18)",
          display:"flex", alignItems:"center", gap:10, whiteSpace:"nowrap",
        }}>
          {toast.message}
        </div>
      )}

      {/* ── ADD ITEM & REPACK MODAL ── */}
{/* ── LAYOUT WARNING MODAL ── */}
      {/* {showLayoutWarning && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{background:"#fff",borderRadius:16,padding:"28px 32px",width:460,maxWidth:"95vw",boxShadow:"0 8px 40px rgba(0,0,0,0.22)",position:"relative",fontFamily:"'DM Sans','Segoe UI',sans-serif"}}>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
              <div style={{width:44,height:44,borderRadius:10,background:"#FEF3C7",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>⚠️</div>
              <div>
                <div style={{fontSize:16,fontWeight:700,color:"#0f172a"}}>Box Placement Warning</div>
                <div style={{fontSize:12,color:"#64748b",marginTop:2}}>{layoutWarnings.length} issue{layoutWarnings.length > 1 ? "s" : ""} found: overlapped, floating, or outside container</div>
              </div>
            </div>

            <div style={{maxHeight:280,overflowY:"auto",display:"flex",flexDirection:"column",gap:8,marginBottom:20}}>
              {layoutWarnings.map((w, i) => (
                <div key={i} style={{
                  padding:"12px 14px",
                  borderRadius:8,
                  background: w.type === "overlap" ? "#FEF2F2" : w.type === "outside" ? "#F0F9FF" : "#FFFBEB",
                  border: `1px solid ${w.type === "overlap" ? "#FECACA" : w.type === "outside" ? "#BAE6FD" : "#FDE68A"}`,
                  display:"flex",gap:10,alignItems:"flex-start"
                }}>
                  <span style={{fontSize:18,flexShrink:0}}>{w.type === "overlap" ? "🔴" : w.type === "outside" ? "🔵" : "🟡"}</span>
                  <div>
                    <div style={{fontSize:12,fontWeight:700,color: w.type === "overlap" ? "#991B1B" : w.type === "outside" ? "#075985" : "#92400E",marginBottom:2}}>
                      {w.type === "overlap" ? "Overlap" : w.type === "outside" ? "Outside Container" : "Floating"}
                    </div>
                    <div style={{fontSize:12,color: w.type === "overlap" ? "#B91C1C" : w.type === "outside" ? "#0369A1" : "#B45309"}}>{w.message}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{fontSize:12,color:"#64748b",background:"#f8fafc",borderRadius:8,padding:"10px 12px",marginBottom:20}}>
              💡 Go back to Manual Override to fix these issues, or dismiss to keep the current layout as-is.
            </div>

            <div style={{display:"flex",gap:10}}>
              <button
                onClick={() => { setShowLayoutWarning(false); setIsManualOverride(true); }}
                style={{flex:1,padding:"9px 0",background:"linear-gradient(135deg,#f59e0b,#f97316)",border:"none",borderRadius:8,cursor:"pointer",fontSize:13,fontWeight:700,color:"#fff"}}>
                ✏️ Fix in Override
              </button>
              <button
                onClick={() => setShowLayoutWarning(false)}
                style={{flex:1,padding:"9px 0",background:"#f1f5f9",border:"1px solid rgba(0,0,0,0.1)",borderRadius:8,cursor:"pointer",fontSize:13,fontWeight:600,color:"#64748b"}}>
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )} */}

      {/* ── ADD ITEM & REPACK MODAL ── */}
      {showAddItem && (        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{background:"#fff",borderRadius:16,padding:"28px 32px",width:400,boxShadow:"0 8px 40px rgba(0,0,0,0.18)",position:"relative"}}>
            <button onClick={()=>setShowAddItem(false)} style={{position:"absolute",top:14,right:16,background:"none",border:"none",fontSize:20,cursor:"pointer",color:"#64748b"}}>✕</button>
            <div style={{fontWeight:700,fontSize:16,marginBottom:4,color:"#0f172a"}}>+ Add Item & Repack</div>
            <div style={{fontSize:12,color:"#64748b",marginBottom:16}}>The packing engine will re-optimize all items including this new one.</div>
            {[
              {label:"Product Name",key:"product_name",type:"text",ph:"e.g. Green Cargo Box"},
              {label:"Length (mm)", key:"length_mm",   type:"number",ph:"e.g. 1000"},
              {label:"Width (mm)",  key:"width_mm",    type:"number",ph:"e.g. 500"},
              {label:"Height (mm)", key:"height_mm",   type:"number",ph:"e.g. 800"},
              {label:"Weight (kg)", key:"weight_kg",   type:"number",ph:"e.g. 200"},
              {label:"Quantity",    key:"quantity",    type:"number",ph:"1"},
            ].map(({label,key,type,ph})=>(
              <div key={key} style={{marginBottom:10}}>
                <label style={{fontSize:11,color:"#64748b",display:"block",marginBottom:2}}>{label}</label>
                <input type={type} placeholder={ph} value={addItemForm[key]}
                  onChange={e=>setAddItemForm(p=>({...p,[key]:e.target.value}))}
                  style={{width:"100%",padding:"7px 10px",border:"1px solid rgba(0,0,0,0.15)",borderRadius:7,fontSize:13,outline:"none",boxSizing:"border-box"}}/>
              </div>
            ))}
            <div style={{marginBottom:10}}>
              <label style={{fontSize:11,color:"#64748b",display:"block",marginBottom:2}}>Cargo Type</label>
              <select value={addItemForm.cargo_type} onChange={e=>setAddItemForm(p=>({...p,cargo_type:e.target.value}))}
                style={{width:"100%",padding:"7px 10px",border:"1px solid rgba(0,0,0,0.15)",borderRadius:7,fontSize:13,outline:"none",boxSizing:"border-box"}}>
                {["Cartons","Sacks","Jumbo Bags","Barrels","Drums","Pipes"].map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            <div style={{marginBottom:16,display:"flex",alignItems:"center",gap:8}}>
              <label style={{fontSize:11,color:"#64748b"}}>Color</label>
              <input type="color" value={addItemForm.color} onChange={e=>setAddItemForm(p=>({...p,color:e.target.value}))}
                style={{width:34,height:30,border:"1px solid rgba(0,0,0,0.15)",borderRadius:6,cursor:"pointer",padding:2}}/>
            </div>
            {addItemError && <div style={{fontSize:12,color:"#dc2626",background:"#fef2f2",border:"1px solid #fecaca",borderRadius:6,padding:"7px 10px",marginBottom:12}}>{addItemError}</div>}
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setShowAddItem(false)} style={{flex:1,padding:"9px 0",background:"#f1f5f9",border:"1px solid rgba(0,0,0,0.1)",borderRadius:8,cursor:"pointer",fontSize:13,fontWeight:600,color:"#64748b"}}>Cancel</button>
              <button onClick={handleAddItemRepack} disabled={addItemLoading}
                style={{flex:2,padding:"9px 0",background:addItemLoading?"#86efac":"linear-gradient(135deg,#16a34a,#22c55e)",border:"none",borderRadius:8,cursor:addItemLoading?"not-allowed":"pointer",fontSize:13,fontWeight:700,color:"#fff"}}>
                {addItemLoading?"⏳ Repacking...":"✓ Add & Repack"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Section = ({ title, children }) => (
  <div style={styles.section}><div style={styles.sectionTitle}>{title}</div>{children}</div>
);

const Field = ({ label, unit, value }) => (
  <div style={styles.field}>
    <label style={styles.fieldLabel}>{label}<span style={styles.fieldUnit}>{unit}</span></label>
    <input readOnly value={value || ""} style={styles.fieldInput} />
  </div>
);

const Stat = ({ val, label }) => (
  <div style={styles.stat}>
    <div style={styles.statVal}>{val}</div>
    <div style={styles.statLabel}>{label}</div>
  </div>
);

const Pill = ({ children, accent, shipment, warning, info, danger }) => (
  <div style={{ ...styles.pill, ...(accent ? styles.pillAccent : {}), ...(shipment ? styles.pillShipment : {}), ...(warning ? styles.pillWarning : {}), ...(info ? styles.pillInfo : {}), ...(danger ? styles.pillDanger : {}) }}>
    {children}
  </div>
);

const C = {
  bg: "#ffffff", surface: "#ffffff", surfaceHigh: "#f1f5f9",
  border: "rgba(0,0,0,0.1)", borderHigh: "rgba(37,99,235,0.4)",
  text: "#0f172a", textMuted: "#64748b", accent: "#2563eb", accentGlow: "rgba(37,99,235,0.08)",
};

const styles = {
  sharedNav: {
  height: 48,
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  padding: "0 18px",
  background: "#fff",
  borderBottom: "1px solid #e5e7eb",
},
  root: { display:"flex", flexDirection:"column", height:"100vh", width:"100%", background:C.bg, fontFamily:"'DM Sans','Segoe UI',sans-serif", color:C.text, overflow:"hidden", margin:0, padding:0, boxSizing:"border-box" },
  noData: { display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100vh", background:C.bg, color:C.text, gap:16 },
  backBtn: { padding:"10px 20px", background:C.accent, color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontWeight:600 },
  nav: { display:"flex", alignItems:"center", padding:"0 20px", height:52, background:C.surface, borderBottom:`1px solid ${C.border}`, flexShrink:0, gap:8 },
  navLogo: { display:"flex", alignItems:"center", gap:8, fontWeight:700, fontSize:16, color:C.accent, letterSpacing:"0.05em", marginRight:20 },
  navLogoIcon: { fontSize:20 },
  navTabs: { display:"flex", gap:4, flex:1 },
  navTab: { padding:"6px 14px", background:"transparent", border:"none", color:C.textMuted, cursor:"pointer", borderRadius:6, fontSize:13, fontWeight:500, transition:"all 0.15s" },
  navTabActive: { background:C.accentGlow, color:C.accent, border:`1px solid ${C.borderHigh}` },
  printBtn: { padding:"6px 14px", background:"transparent", border:`1px solid ${C.border}`, color:C.textMuted, cursor:"pointer", borderRadius:6, fontSize:12, fontWeight:500 },
  body: { display:"flex", flex:1, overflow:"hidden", minWidth:0, minHeight:0 },
  panel: { width:240, background:C.surface, borderRight:`1px solid ${C.border}`, display:"flex", flexDirection:"column", gap:0, overflowY:"auto", overflowX:"hidden", padding:"12px 0", flexShrink:0, scrollbarWidth:"thin", boxSizing:"border-box" },
  section: { padding:"0 14px 12px" },
  sectionTitle: { fontSize:10, fontWeight:700, letterSpacing:"0.12em", color:C.textMuted, textTransform:"uppercase", padding:"10px 0 8px", borderBottom:`1px solid ${C.border}`, marginBottom:10 },
  field: { marginBottom:8 },
  fieldLabel: { fontSize:11, color:C.textMuted, display:"flex", justifyContent:"space-between", marginBottom:3 },
  fieldUnit: { color:"rgba(100,116,139,0.6)", fontSize:10 },
  fieldInput: { width:"100%", background:C.surfaceHigh, border:`1px solid ${C.border}`, borderRadius:6, padding:"5px 8px", color:C.text, fontSize:13, fontWeight:600, outline:"none", boxSizing:"border-box" },
  calcBtn: { margin:"4px 14px 14px", padding:"9px 0", background:"linear-gradient(135deg,#1d4ed8,#2563eb)", border:"none", borderRadius:8, color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer", letterSpacing:"0.02em", boxShadow:"0 4px 12px rgba(37,99,235,0.3)" },
 viewGrid: {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: 8,
  width: "100%",
},
  viewBtn: {
  width: "100%",
  height: 44,
  borderRadius: 8,
  border: "1px solid #cbd5e1",
  background: "#f8fafc",
  color: "#334155",
  fontWeight: 600,
  cursor: "pointer",
},
  viewBtnActive: { background:C.accentGlow, border:`1px solid ${C.accent}`, color:C.accent },
  statsGrid: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 },
  stat: { background:C.surfaceHigh, border:`1px solid ${C.border}`, borderRadius:8, padding:"10px 10px 8px", display:"flex", flexDirection:"column", gap:4, minWidth:0, overflow:"hidden" },
  statVal: { fontSize:18, fontWeight:800, color:C.accent, lineHeight:1, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" },
  statLabel: { fontSize:9, fontWeight:600, color:C.textMuted, textTransform:"uppercase", letterSpacing:"0.08em", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", marginTop:2 },
  legendRow: { display:"flex", alignItems:"center", gap:8, padding:"4px 0", borderBottom:`1px solid ${C.border}` },
  legendDot: { width:10, height:10, borderRadius:3, flexShrink:0 },
  legendName: { flex:1, fontSize:12, color:C.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" },
  legendCount: { fontSize:12, fontWeight:700, color:C.textMuted },
  canvasWrap: { flex:1, position:"relative", overflow:"hidden", minWidth:0, minHeight:0 },
  canvas: { width:"100%", height:"100%", display:"block", cursor:"grab" },
  overlayTL: { position:"absolute", top:14, left:14, display:"flex", gap:8, flexWrap:"wrap" },
  pill: { padding:"5px 12px", background:"rgba(255,255,255,0.85)", border:`1px solid ${C.border}`, borderRadius:20, fontSize:12, color:C.textMuted, backdropFilter:"blur(8px)", boxShadow:"0 1px 4px rgba(0,0,0,0.08)" },
  pillAccent: { background:"rgba(37,99,235,0.08)", border:`1px solid ${C.borderHigh}`, color:C.accent },
  pillShipment: { background:"rgba(249,115,22,0.10)", border:"1px solid rgba(249,115,22,0.35)", color:"#c2410c", fontWeight:700 },
  pillWarning: { background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.25)", color:"#dc2626", fontWeight:700 },
  pillInfo: { background:"rgba(37,99,235,0.08)", border:"1px solid rgba(37,99,235,0.25)", color:"#2563eb", fontWeight:700 },
  pillDanger: { background:"rgba(245,158,11,0.10)", border:"1px solid rgba(245,158,11,0.35)", color:"#b45309", fontWeight:700 },
  hint: { position:"absolute", bottom:14, left:"50%", transform:"translateX(-50%)", padding:"5px 14px", background:"rgba(255,255,255,0.85)", border:`1px solid ${C.border}`, borderRadius:20, fontSize:11, color:C.textMuted, backdropFilter:"blur(6px)", whiteSpace:"nowrap", boxShadow:"0 1px 4px rgba(0,0,0,0.08)" },
  zoomBtns: { position:"absolute", right:14, bottom:14, display:"flex", flexDirection:"column", gap:6 },
  zoomBtn: { width:34, height:34, background:"rgba(255,255,255,0.9)", border:`1px solid ${C.border}`, borderRadius:8, color:C.text, fontSize:16, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(6px)", transition:"all 0.15s", boxShadow:"0 1px 4px rgba(0,0,0,0.1)" },
};

export default ThreeDViewer;