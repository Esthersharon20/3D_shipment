// import React, { useEffect, useMemo, useState } from 'react';
// import { useLocation, useNavigate } from 'react-router-dom';
// import { SidebarLayout } from '../../Components';
// import './CostAnalysis.css';


// const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// const CONTAINER_KEYS = ['20ft', '40ft', '40ft_hc', '45ft_hc'];
// const CONTAINER_NAMES = {
//   '20ft': '20ft Standard',
//   '40ft': '40ft Standard',
//   '40ft_hc': '40ft High Cube',
//   '45ft_hc': '45ft High Cube',
// };

// const DEFAULT_RATES = {
//   '20ft': { base_freight_rate: 165000, customs_clearance: 29000, terminal_handling: 12500, documentation_fees: 12500 },
//   '40ft': { base_freight_rate: 182000, customs_clearance: 29000, terminal_handling: 14000, documentation_fees: 12500 },
//   '40ft_hc': { base_freight_rate: 190000, customs_clearance: 29000, terminal_handling: 14000, documentation_fees: 12500 },
//   '45ft_hc': { base_freight_rate: 207000, customs_clearance: 29000, terminal_handling: 16500, documentation_fees: 12500 },
// };

// const CONTAINER_SPECS = {
//   '20ft': { volume_m3: 33.137, max_payload_kg: 28200 },
//   '40ft': { volume_m3: 67.566, max_payload_kg: 26680 },
//   '40ft_hc': { volume_m3: 76.048, max_payload_kg: 26520 },
//   '45ft_hc': { volume_m3: 85.720, max_payload_kg: 27700 },
// };

// const RATE_LABELS = {
//   base_freight_rate: 'Base Freight Rate',
//   customs_clearance: 'Customs Clearance',
//   terminal_handling: 'Terminal Handling',
//   documentation_fees: 'Documentation Fees',
// };

// function fmt(n, decimals = 0) {
//   if (n == null || Number.isNaN(Number(n))) return '—';
//   return Number(n).toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
// }

// function normalizeItem(item) {
//   const length = Number(item.length_mm ?? item.length_cm * 10 ?? 0);
//   const width = Number(item.width_mm ?? item.width_cm * 10 ?? 0);
//   const height = Number(item.height_mm ?? item.height_cm * 10 ?? 0);
//   return {
//     ...item,
//     product_name: item.product_name || item.description || 'Cargo Item',
//     length_mm: length,
//     width_mm: width,
//     height_mm: height,
//     weight_kg: Number(item.weight_kg || 0),
//     quantity: Number(item.quantity || 1),
//   };
// }

// export default function CostAnalysis() {
//   const location = useLocation();
//   const navigate = useNavigate();

//   const stateCargoItems = location.state?.cargoItems || [];
//   const selectedContainer = location.state?.selectedContainer || location.state?.container || null;
//   const activeShipmentName = location.state?.shipmentName || location.state?.viewShipmentName || '';

//   const [cargoItems, setCargoItems] = useState(stateCargoItems.map(normalizeItem));
//   const [rates, setRates] = useState(DEFAULT_RATES);
//   const [error, setError] = useState('');
//   const [packing, setPacking] = useState(false);
//   const [rejectedItems, setRejectedItems] = useState([]);
//   const [originalRejectedCount, setOriginalRejectedCount] = useState(0);
//   const [showRejectedPopup, setShowRejectedPopup] = useState(false);
//   const [showManualPacked, setShowManualPacked] = useState(false);
//   const [packingResult, setPackingResult] = useState(null);
//   const [currency, setCurrency] = useState('INR');
//   const [shareUrl, setShareUrl] = useState('');
//   const [shareLoading, setShareLoading] = useState(false);
//   const shareGeneratedRef = React.useRef(false);

// const [manualPackedSet, setManualPackedSet] = useState(() => {
//     try {
//       if (!activeShipmentName) return new Set();
//       const shipmentKey = `manual_override_packed_${activeShipmentName}`;
//       const packedItems = JSON.parse(localStorage.getItem(shipmentKey) || '[]');
//       return new Set(Array.isArray(packedItems) ? packedItems : []);
//     } catch {
//       return new Set();
//     }
//   });

//   // Read saved rejected count after Save Layout from 3D viewer
//   useEffect(() => {
//     if (!activeShipmentName) return;
//     const savedKey = `cargoset_rejected_after_save_${activeShipmentName}`;
//     try {
//       const raw = localStorage.getItem(savedKey);
//       if (raw) {
//         const updated = JSON.parse(raw);
//         if (Array.isArray(updated)) {
//           setRejectedItems(updated);
//           setPackingResult(prev => prev ? { ...prev, rejected: updated } : prev);
//         }
//       }
//     } catch {}
//   }, [activeShipmentName]);

//   const currencySymbols = {
//     INR: '₹',
//     USD: '$',
//     EUR: '€',
//     GBP: '£',
//     AED: 'د.إ',
//     SGD: 'S$',
//   };

//   useEffect(() => {
//     if (stateCargoItems && stateCargoItems.length > 0) {
//       setCargoItems(stateCargoItems.map(normalizeItem));
//       setRejectedItems([]);
//       setOriginalRejectedCount(0);
//       setPackingResult(null);
//       return;
//     }

//     const url = activeShipmentName
//       ? `${API}/api/cargo?shipment=${encodeURIComponent(activeShipmentName)}`
//       : `${API}/api/cargo`;

//     fetch(url)
//       .then((r) => {
//         if (!r.ok) throw new Error('Cannot load cargo items');
//         return r.json();
//       })
//       .then((data) => {
//         setCargoItems(Array.isArray(data) ? data.map(normalizeItem) : []);
//       })
//       .catch((e) => setError(e.message));
//   }, [activeShipmentName, stateCargoItems]);

//   const analysisData = useMemo(() => {
//     const totalVolM3 = cargoItems.reduce((acc, it) => acc + (it.length_mm * it.width_mm * it.height_mm * it.quantity) / 1e9, 0);
//     const totalWtKg = cargoItems.reduce((acc, it) => acc + it.weight_kg * it.quantity, 0);

//     const analysis = {};
//     CONTAINER_KEYS.forEach((k) => {
//       const spec = CONTAINER_SPECS[k];
//       const rate = rates[k];
//       const noByVolume = Math.max(1, Math.ceil(totalVolM3 / spec.volume_m3));
//       const noByWeight = Math.max(1, Math.ceil(totalWtKg / spec.max_payload_kg));
//       const containersRequired = Math.max(noByVolume, noByWeight);
//       const oceanFreight = rate.base_freight_rate * containersRequired;
//       const customsClearance = rate.customs_clearance * containersRequired;
//       const terminalHandling = rate.terminal_handling * containersRequired;
//       const documentationFees = rate.documentation_fees * containersRequired;
//       const totalCost = oceanFreight + customsClearance + terminalHandling + documentationFees;
//       analysis[k] = {
//         noByVolume, noByWeight, containersRequired,
//         oceanFreight, customsClearance, terminalHandling, documentationFees, totalCost,
//         costPerM3: totalVolM3 ? totalCost / totalVolM3 : 0,
//         costPerKg: totalWtKg ? totalCost / totalWtKg : 0,
//       };
//     });

//     const recommended = CONTAINER_KEYS.reduce(
//       (best, k) => analysis[k].totalCost < analysis[best].totalCost ? k : best,
//       '20ft'
//     );
//     return {
//       totalVolM3,
//       totalWtKg,
//       totalUnits: cargoItems.reduce((s, i) => s + i.quantity, 0),
//       analysis,
//       recommended,
//     };
//   }, [cargoItems, rates]);

//   // Auto-generate share URL once analysis is ready
//   useEffect(() => {
//     if (!analysisData || !cargoItems.length || shareGeneratedRef.current || shareLoading) return;
//     shareGeneratedRef.current = true;
//     setShareLoading(true);
//     const payload = {
//       cargoItems,
//       analysisData,
//       packingResult,
//       selectedContainer,
//       freightRates: rates,
//       shipmentName: activeShipmentName,
//     };
//     fetch(`${API}/api/share-report`, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify(payload),
//     })
//       .then((r) => r.json())
//       .then((data) => {
//         if (data.shareId) {
//           setShareUrl(`${window.location.origin}/share/${data.shareId}`);
//         }
//       })
//       .catch(() => {})
//       .finally(() => setShareLoading(false));
//   }, [analysisData, cargoItems.length]);

//   const updateRate = (containerKey, rateKey, value) => {
//     setRates((prev) => ({
//       ...prev,
//       [containerKey]: { ...prev[containerKey], [rateKey]: Number(value || 0) },
//     }));
//   };

// useEffect(() => {
//   if (!cargoItems.length) return;

//   const dbRejected = cargoItems.filter(item => item.is_rejected);

//   if (dbRejected.length > 0) {
//     // Each DB row = one product_name with rejected_quantity units
//     // Expand back into individual unit entries so existing UI (count, popup) works correctly
//     const formatted = dbRejected.flatMap(item => {
//       const qty = Number(item.rejected_quantity || 1);
//       return Array.from({ length: qty }, (_, i) => ({
//         product_name: item.product_name,
//         quantity: 1,
//         unit_no: i + 1,
//         reason: 'No space available',
//       }));
//     });
//     setRejectedItems(formatted);
//     setOriginalRejectedCount(formatted.length);
//     return;
//   }

//   // Fallback: run packing (for shipments not yet saved)
//   const checkRejectedItems = async () => {
//     try {
//       const res = await fetch(`${API}/api/calculate-packing`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           container_type: analysisData.recommended,
//           container: selectedContainer,
//           cargoItems,
//         }),
//       });
//       const result = await res.json();
//       if (res.ok && result.success !== false) {
//         const allRejected = result.rejected || [];
//         const remaining = allRejected.filter(r => !manualPackedSet.has(r.product_name));
//         setRejectedItems(remaining);
//         setOriginalRejectedCount(allRejected.length);
//         setPackingResult(result);
//       }
//     } catch (err) {
//       console.log('Rejected preview failed:', err.message);
//     }
//   };

//   checkRejectedItems();
// }, [cargoItems, analysisData.recommended, selectedContainer, manualPackedSet]);
// const handleProceedTo3D = async () => {
//   if (!cargoItems.length) {
//     setError('No cargo items found. Please add cargo items first.');
//     return;
//   }
//   setPacking(true);
//   setError('');
//   try {
//     if (packingResult) {
//       localStorage.setItem("FORCE_FRESH_PACKING", "true");
//       navigate('/3d-viewer', {
//         state: {
//           result: packingResult,
//           selectedContainer: packingResult.container || selectedContainer,
//           placements: packingResult.placements || [],
//           cargoItems,
//           costAnalysis: analysisData,
//           rejectedFromCostAnalysis: rejectedItems,
//           navigationTs: Date.now(),  // ← ADD THIS
//         },
//       });
//       return;
//     }

//     const res = await fetch(`${API}/api/calculate-packing`, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({
//         container_type: analysisData.recommended,
//         container: selectedContainer,
//         cargoItems,
//       }),
//     });
//     const result = await res.json();
//     setRejectedItems(result.rejected || []);
//     setPackingResult(result);
//     if (!res.ok || result.error || result.success === false)
//       throw new Error(result.message || result.error || '3D packing calculation failed');
//     navigate('/3d-viewer', {
//       state: {
//         result,
//         selectedContainer: result.container || selectedContainer,
//         placements: result.placements || [],
//         cargoItems,
//         costAnalysis: analysisData,
//         rejectedFromCostAnalysis: result.rejected || [],
//         navigationTs: Date.now(),  // ← ADD THIS
//       },
//     });
//   } catch (e) {
//     setError(e.message);
//   } finally {
//     setPacking(false);
//   }
// };

//   const layoutSavedForShipment =
//     activeShipmentName &&
//     localStorage.getItem(`cargoset_saved_layout_${activeShipmentName}`);

//   const validManualPackedSet = layoutSavedForShipment ? manualPackedSet : new Set();
//   const manualFittedCount = validManualPackedSet.size;

//   useEffect(() => {
//     console.log("manualPackedSet:", [...manualPackedSet]);
//     console.log("rejectedItems:", rejectedItems);
//     console.log("originalRejectedCount:", originalRejectedCount);
//     console.log("manualFittedCount:", manualFittedCount);
//   }, [manualPackedSet, rejectedItems]);

//   const manualPackedNames = [...manualPackedSet];

//   const visibleManualPacked = showManualPacked
//     ? manualPackedNames
//     : manualPackedNames.slice(0, 2);

//   const rejectedNames = rejectedItems.map((item) =>
//     String(item.product_name || item.name || '').trim().toLowerCase()
//   );

// const visibleCargoItems = cargoItems;

//   const tableItemsToShow = showManualPacked
//     ? visibleCargoItems
//     : visibleCargoItems.slice(0, 5);

//   if (!cargoItems.length && !analysisData.totalUnits) {
//     return (
//       <SidebarLayout title="">
//         <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
//           <p>Loading cargo data...</p>
//         </div>
//       </SidebarLayout>
//     );
//   }

//   return (
//     <SidebarLayout title="">
//       <div className="cost-analysis">
//         <div className="ca-header">
//           <h2>💰 Freight Cost Analysis</h2>
//           <p className="ca-subtitle"></p>
//           {error && <div className="ca-error">⚠️ {error}</div>}
//         </div>

//         <div className="ca-section">
//           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
//             <h3>Freight Charges ({currency} per container)</h3>
//             <div className="currency-box">
//               <label>Select Currency</label>
//               <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="currency-select">
//                 <option value="INR">₹ INR - Indian Rupee</option>
//                 <option value="USD">$ USD - US Dollar</option>
//                 <option value="EUR">€ EUR - Euro</option>
//                 <option value="GBP">£ GBP - Pound</option>
//                 <option value="AED">د.إ AED - Dirham</option>
//                 <option value="SGD">S$ SGD - Singapore Dollar</option>
//               </select>
//             </div>
//           </div>

//           <div className="ca-table-wrap">
//             <table className="ca-table ca-input-table">
//               <thead>
//                 <tr>
//                   <th>Charge Type</th>
//                   {CONTAINER_KEYS.map((k) => <th key={k}>{CONTAINER_NAMES[k]}</th>)}
//                 </tr>
//               </thead>
//               <tbody>
//                 {Object.entries(RATE_LABELS).map(([rateKey, label]) => (
//                   <tr key={rateKey}>
//                     <td><strong>{label}</strong></td>
//                     {CONTAINER_KEYS.map((k) => (
//                       <td key={k}>
//                         <input
//                           className="ca-rate-input"
//                           type="number"
//                           value={rates[k][rateKey]}
//                           onChange={(e) => updateRate(k, rateKey, e.target.value)}
//                         />
//                       </td>
//                     ))}
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//           <p className="ca-formula-note">Changing these values immediately recalculates the lowest-cost container.</p>
//         </div>

//         <div className="ca-section">
//           <h3>Cargo Summary From Item List</h3>
//           <div className="ca-summary-grid">
//             <div className="ca-stat">
//               <span className="ca-stat-label">Total Volume</span>
//               <span className="ca-stat-value">{fmt(analysisData.totalVolM3, 4)} m³</span>
//             </div>
//             <div className="ca-stat">
//               <span className="ca-stat-label">Total Weight</span>
//               <span className="ca-stat-value">{fmt(analysisData.totalWtKg, 2)} kg</span>
//             </div>
//             <div className="ca-stat">
//               <span className="ca-stat-label">Item Lines</span>
//               <span className="ca-stat-value">{cargoItems.length}</span>
//             </div>
//             <div className="ca-stat">
//               <span className="ca-stat-label">Total Qty</span>
//               <span className="ca-stat-value">{fmt(analysisData.totalUnits)}</span>
//             </div>
//           </div>

//           <div
//             className="ca-table-wrap"
//             style={{
//               marginTop: '20px',
//               maxHeight: showManualPacked ? 'none' : '420px',
//               overflow: 'hidden',
//             }}
//           >
//             <table className="ca-table">
//               <thead>
//                 <tr>
//                   <th>Item Name</th>
//                   <th>Length</th>
//                   <th>Width</th>
//                   <th>Height</th>
//                   <th>Weight</th>
//                   <th>Qty</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {tableItemsToShow.map((item, index) => (
//                   <tr key={index}>
// <td>{item.product_name}</td>
//                     <td>{item.length_mm}</td>
//                     <td>{item.width_mm}</td>
//                     <td>{item.height_mm}</td>
//                     <td>{item.weight_kg}</td>
// <td>
//   {(() => {
//     const rejFromDB = cargoItems
//       .filter(i => i.is_rejected && i.product_name === item.product_name)
//       .reduce((sum, i) => sum + Number(i.rejected_quantity || 0), 0);
//     const rejFromState = rejectedItems
//       .filter(r => (r.product_name || '') === (item.product_name || ''))
//       .length;
//     const deduct = rejFromDB > 0 ? rejFromDB : rejFromState;
//     return Math.max(0, Number(item.quantity) - deduct);
//   })()}
// </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>

//           {visibleCargoItems.length > 5 && (
//             <div style={{ textAlign: 'center', marginTop: '10px' }}>
//               <button
//                 onClick={() => setShowManualPacked(!showManualPacked)}
//                 style={{
//                   background: 'transparent', border: '1px solid #2563eb', color: '#2563eb',
//                   fontWeight: 700, cursor: 'pointer', fontSize: '13px', borderRadius: '6px', padding: '4px 12px',
//                 }}
//               >
//                 {showManualPacked ? 'Show less' : 'Show more'}
//               </button>
//             </div>
//           )}

// <div
//   style={{
//     marginTop: '20px', padding: '14px 18px', border: '1px solid #fecaca',
//     background: '#fff1f2', borderRadius: '10px', display: 'flex',
//     justifyContent: 'space-between', alignItems: 'center',
//     cursor: 'pointer', fontWeight: '700', color: '#b91c1c',
//   }}
//   onClick={() => setShowRejectedPopup(true)}
// >
//   <span>Rejected Items</span>
//   {/* Count unique product names, not individual units */}
//   <span>
//     {cargoItems.filter(i => i.is_rejected).length > 0
//       ? `${cargoItems.filter(i => i.is_rejected).length} product type${cargoItems.filter(i => i.is_rejected).length > 1 ? 's' : ''} · ${rejectedItems.length} unit${rejectedItems.length !== 1 ? 's' : ''}`
//       : rejectedItems.length
//     }
//   </span>
// </div>

// {showRejectedPopup && (
//   <div style={{
//     position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
//     background: 'rgba(0,0,0,0.45)', display: 'flex',
//     alignItems: 'center', justifyContent: 'center', zIndex: 9999,
//   }}>
//     <div style={{
//       background: '#fff', width: '520px', maxHeight: '75vh',
//       overflowY: 'auto', borderRadius: '14px', padding: '22px',
//     }}>
//       <h3 style={{ marginBottom: '16px', color: '#b91c1c' }}>Rejected Items</h3>
//       {rejectedItems.length === 0 ? (
//         <p>No rejected items</p>
//       ) : (
//         // Group by product_name for clean display
//         Object.values(
//           rejectedItems.reduce((acc, item) => {
//             const name = item.product_name || `Item`;
//             if (!acc[name]) acc[name] = { ...item, count: 0 };
//             acc[name].count += 1;
//             return acc;
//           }, {})
//         ).map((item, index) => (
//           <div key={index} style={{
//             padding: '12px', border: '1px solid #fee2e2',
//             borderRadius: '10px', marginBottom: '10px', background: '#fff7f7',
//             display: 'flex', justifyContent: 'space-between', alignItems: 'center',
//           }}>
//             <div>
//               <strong>{item.product_name}</strong>
//               <div style={{ marginTop: '5px', fontSize: 13, color: '#b91c1c' }}>
//                 {item.count} unit{item.count !== 1 ? 's' : ''} rejected
//               </div>
//               <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 3 }}>
//                 Reason: {item.reason || 'No space available'}
//               </div>
//             </div>
//             <div style={{
//               background: '#fee2e2', borderRadius: 8, padding: '6px 14px',
//               fontWeight: 700, fontSize: 18, color: '#b91c1c',
//             }}>
//               ×{item.count}
//             </div>
//           </div>
//         ))
//       )}
//       <button
//         onClick={() => setShowRejectedPopup(false)}
//         style={{
//           marginTop: '14px', background: '#1e3a8a', color: '#fff',
//           border: 'none', borderRadius: '8px', padding: '9px 18px', cursor: 'pointer',
//         }}
//       >
//         Close
//       </button>
//     </div>
//   </div>
// )}
//         </div>

//         <div className="ca-section">
//           <h3>All Containers Cost Comparison</h3>
//           <div className="ca-table-wrap">
//             <table className="ca-table">
//               <thead>
//                 <tr>
//                   <th>Container</th>
//                   <th>By Volume</th>
//                   <th>By Weight</th>
//                   <th>Required Containers</th>
//                   <th>Freight Cost</th>
//                   <th>Other Charges</th>
//                   <th>Total Cost</th>
//                   <th>Cost / m³</th>
//                   <th>Cost / kg</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {CONTAINER_KEYS.map((k) => {
//                   const d = analysisData.analysis[k];
//                   const otherCharges = d.customsClearance + d.terminalHandling + d.documentationFees;
//                   return (
//                     <tr key={k} className={analysisData.recommended === k ? 'row-recommended' : ''}>
//                       <td>
//                         <strong>{CONTAINER_NAMES[k]}</strong>
//                         {analysisData.recommended === k && <span className="badge-rec">Lowest</span>}
//                       </td>
//                       <td>{d.noByVolume}</td>
//                       <td>{d.noByWeight}</td>
//                       <td><strong>{d.containersRequired}</strong></td>
//                       <td>{currencySymbols[currency]}{fmt(d.oceanFreight)}</td>
//                       <td>{currencySymbols[currency]}{fmt(otherCharges)}</td>
//                       <td><strong>{currencySymbols[currency]}{fmt(d.totalCost)}</strong></td>
//                       <td>{currencySymbols[currency]}{fmt(d.costPerM3, 2)}</td>
//                       <td>{currencySymbols[currency]}{fmt(d.costPerKg, 2)}</td>
//                     </tr>
//                   );
//                 })}
//               </tbody>
//             </table>
//           </div>
//         </div>

//         <div
//           className="ca-recommendation"
//           style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px' }}
//         >
//           {/* LEFT SIDE */}
//           <div style={{ display: 'flex', gap: '16px' }}>
//             <span className="ca-rec-icon">✅</span>
//             <div>
//               <strong>
//                 Lowest Cost Container:{' '}
//                 {CONTAINER_NAMES[analysisData.recommended]}
//               </strong>
//               <p>
//                 Total cost {currencySymbols[currency]}
//                 {fmt(analysisData.analysis[analysisData.recommended].totalCost)}{' '}
//                 using{' '}
//                 {analysisData.analysis[analysisData.recommended].containersRequired}{' '}
//                 container(s).
//               </p>
//               <button
//                 className="btn-primary ca-proceed-btn"
//                 onClick={handleProceedTo3D}
//                 disabled={packing || !cargoItems.length}
//               >
//                 {packing ? 'Calculating 3D…' : 'Proceed to 3D Loading'}
//               </button>
//             </div>
//           </div>

//           {/* RIGHT SIDE SHARE URL */}
//           <div
//             style={{
//               background: '#fff', border: '1px solid #dbeafe', borderRadius: '14px',
//               padding: '16px', width: '540px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
//             }}
//           >
//             <div style={{ fontWeight: '700', color: '#1e3a8a', marginBottom: '12px', fontSize: '16px' }}>
//               🔗 Shareable Public URL
//             </div>
//             <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
//               <input
//                 value={
//                   shareLoading
//                     ? 'Generating share link...'
//                     : shareUrl || `${window.location.origin}/share/demo`
//                 }
//                 readOnly
//                 style={{
//                   flex: 1, padding: '12px', border: '1px solid #cbd5e1',
//                   borderRadius: '10px', fontSize: '14px', outline: 'none',
//                   background: '#f8fafc', textAlign: 'center', fontWeight: '500',
//                 }}
//               />
//               <button
//                 id="copyShareButton"
//                 onClick={async (e) => {
//                   const url = shareUrl || `${window.location.origin}/share/demo`;
//                   if (!shareUrl) {
//                     alert('Share link is still generating, please wait.');
//                     return;
//                   }
//                   await navigator.clipboard.writeText(url);
//                   e.target.innerHTML = '✔';
//                   e.target.style.color = '#16a34a';
//                   e.target.style.fontSize = '24px';
//                   const toastBox = document.createElement('div');
//                   toastBox.innerText = '✔ Link copied successfully';
//                   toastBox.style.position = 'fixed';
//                   toastBox.style.top = '20px';
//                   toastBox.style.right = '20px';
//                   toastBox.style.background = '#16a34a';
//                   toastBox.style.color = '#fff';
//                   toastBox.style.width = '260px';
//                   toastBox.style.padding = '14px 28px';
//                   toastBox.style.borderRadius = '10px';
//                   toastBox.style.fontWeight = '600';
//                   toastBox.style.fontSize = '15px';
//                   toastBox.style.textAlign = 'center';
//                   toastBox.style.boxShadow = '0 4px 14px rgba(0,0,0,0.15)';
//                   toastBox.style.zIndex = '99999';
//                   document.body.appendChild(toastBox);
//                   setTimeout(() => {
//                     toastBox.remove();
//                     e.target.innerHTML = '⧉';
//                     e.target.style.color = '#000';
//                     e.target.style.fontSize = '22px';
//                   }, 2000);
//                 }}
//                 style={{
//                   width: '56px', height: '48px', border: '1px solid #cbd5e1',
//                   background: '#fff', borderRadius: '10px', cursor: 'pointer',
//                   fontSize: '22px', transition: '0.2s ease',
//                 }}
//               >
//                 ⧉
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//     </SidebarLayout>
//   );
// }




import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SidebarLayout } from '../../Components';
import './CostAnalysis.css';


const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const CONTAINER_KEYS = ['20ft', '40ft', '40ft_hc', '45ft_hc'];
const CONTAINER_NAMES = {
  '20ft': '20ft Standard',
  '40ft': '40ft Standard',
  '40ft_hc': '40ft High Cube',
  '45ft_hc': '45ft High Cube',
};

const DEFAULT_RATES = {
  '20ft': { base_freight_rate: 165000, customs_clearance: 29000, terminal_handling: 12500, documentation_fees: 12500 },
  '40ft': { base_freight_rate: 182000, customs_clearance: 29000, terminal_handling: 14000, documentation_fees: 12500 },
  '40ft_hc': { base_freight_rate: 190000, customs_clearance: 29000, terminal_handling: 14000, documentation_fees: 12500 },
  '45ft_hc': { base_freight_rate: 207000, customs_clearance: 29000, terminal_handling: 16500, documentation_fees: 12500 },
};

const CONTAINER_SPECS = {
  '20ft': { volume_m3: 33.137, max_payload_kg: 28200 },
  '40ft': { volume_m3: 67.566, max_payload_kg: 26680 },
  '40ft_hc': { volume_m3: 76.048, max_payload_kg: 26520 },
  '45ft_hc': { volume_m3: 85.720, max_payload_kg: 27700 },
};

const RATE_LABELS = {
  base_freight_rate: 'Base Freight Rate',
  customs_clearance: 'Customs Clearance',
  terminal_handling: 'Terminal Handling',
  documentation_fees: 'Documentation Fees',
};

function fmt(n, decimals = 0) {
  if (n == null || Number.isNaN(Number(n))) return '—';
  return Number(n).toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function normalizeItem(item) {
  const length = Number(item.length_mm ?? item.length_cm * 10 ?? 0);
  const width = Number(item.width_mm ?? item.width_cm * 10 ?? 0);
  const height = Number(item.height_mm ?? item.height_cm * 10 ?? 0);
  return {
    ...item,
    product_name: item.product_name || item.description || 'Cargo Item',
    length_mm: length,
    width_mm: width,
    height_mm: height,
    weight_kg: Number(item.weight_kg || 0),
    quantity: Number(item.quantity || 1),
  };
}

export default function CostAnalysis() {
  const location = useLocation();
  const navigate = useNavigate();

  const stateCargoItems = location.state?.cargoItems || [];
  const selectedContainer = location.state?.selectedContainer || location.state?.container || null;
  const activeShipmentName = location.state?.shipmentName || location.state?.viewShipmentName || '';

  const [cargoItems, setCargoItems] = useState(stateCargoItems.map(normalizeItem));
  const [rates, setRates] = useState(DEFAULT_RATES);
  const [error, setError] = useState('');
  const [packing, setPacking] = useState(false);
  const [rejectedItems, setRejectedItems] = useState([]);
  const [originalRejectedCount, setOriginalRejectedCount] = useState(0);
  const [showRejectedPopup, setShowRejectedPopup] = useState(false);
  const [showManualPacked, setShowManualPacked] = useState(false);
  const [packingResult, setPackingResult] = useState(null);
  const [currency, setCurrency] = useState('INR');
  const [shareUrl, setShareUrl] = useState('');
  const [shareLoading, setShareLoading] = useState(false);
const shareGeneratedRef = React.useRef(false);
  const shareTimerRef = React.useRef(null);
const [secondaryResultState, setSecondaryResultState] = useState(null);
const secondaryResultStateRef = React.useRef(null);
  const allAdditionalResultsRef = React.useRef([]);
  const allAdditionalContainerTypesRef = React.useRef([]);

  // Cost-Based Method-Rejection state
const [costBasedResult, setCostBasedResult] = useState(null);
  const [costBasedLoading, setCostBasedLoading] = useState(false);
  const [costBasedError, setCostBasedError] = useState('');
const [selectedPlan, setSelectedPlan] = useState(null);
  const [planSaved, setPlanSaved] = useState(false);

  const savePlanToDB = async (plan, results) => {
    if (!activeShipmentName) return;
    try {
      await fetch(`${API}/api/shipments/plan/${encodeURIComponent(activeShipmentName)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selected_plan: plan,
          cost_based_results: results,
          recommended_plan: costBasedResult?.winner || null,
        }),
      });
      setPlanSaved(true);
      setTimeout(() => setPlanSaved(false), 2000);
    } catch (err) {
      console.error('Failed to save plan:', err);
    }
  };

  useEffect(() => {
    if (!activeShipmentName) return;
    fetch(`${API}/api/shipments/plan/${encodeURIComponent(activeShipmentName)}`)
      .then(r => r.json())
      .then(data => {
        if (data.selected_plan) {
          setSelectedPlan(data.selected_plan);
        }
        if (data.cost_based_results && Array.isArray(data.cost_based_results)) {
          setCostBasedResult({
            results: data.cost_based_results,
            winner: data.recommended_plan || null,
            totalAllItems: data.cost_based_results.reduce((max, r) => Math.max(max, r.totalAllItems || 0), 0),
          });
        }
      })
      .catch(() => {});
  }, [activeShipmentName]);
const [manualPackedSet, setManualPackedSet] = useState(() => {
    try {
      if (!activeShipmentName) return new Set();
      const shipmentKey = `manual_override_packed_${activeShipmentName}`;
      const packedItems = JSON.parse(localStorage.getItem(shipmentKey) || '[]');
      return new Set(Array.isArray(packedItems) ? packedItems : []);
    } catch {
      return new Set();
    }
  });

  // Read saved rejected count after Save Layout from 3D viewer
  useEffect(() => {
    if (!activeShipmentName) return;
    const savedKey = `cargoset_rejected_after_save_${activeShipmentName}`;
    try {
      const raw = localStorage.getItem(savedKey);
      if (raw) {
        const updated = JSON.parse(raw);
        if (Array.isArray(updated)) {
          setRejectedItems(updated);
          setPackingResult(prev => prev ? { ...prev, rejected: updated } : prev);
        }
      }
    } catch {}
  }, [activeShipmentName]);

  const currencySymbols = {
    INR: '₹',
    USD: '$',
    EUR: '€',
    GBP: '£',
    AED: 'د.إ',
    SGD: 'S$',
  };

  useEffect(() => {
    if (stateCargoItems && stateCargoItems.length > 0) {
      setCargoItems(stateCargoItems.map(normalizeItem));
      setRejectedItems([]);
      setOriginalRejectedCount(0);
      setPackingResult(null);
      return;
    }

    const url = activeShipmentName
      ? `${API}/api/cargo?shipment=${encodeURIComponent(activeShipmentName)}`
      : `${API}/api/cargo`;

    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error('Cannot load cargo items');
        return r.json();
      })
      .then((data) => {
        setCargoItems(Array.isArray(data) ? data.map(normalizeItem) : []);
      })
      .catch((e) => setError(e.message));
  }, [activeShipmentName, stateCargoItems]);

  const analysisData = useMemo(() => {
    const totalVolM3 = cargoItems.reduce((acc, it) => acc + (it.length_mm * it.width_mm * it.height_mm * it.quantity) / 1e9, 0);
    const totalWtKg = cargoItems.reduce((acc, it) => acc + it.weight_kg * it.quantity, 0);

    const analysis = {};
    CONTAINER_KEYS.forEach((k) => {
      const spec = CONTAINER_SPECS[k];
      const rate = rates[k];
      const noByVolume = Math.max(1, Math.ceil(totalVolM3 / spec.volume_m3));
      const noByWeight = Math.max(1, Math.ceil(totalWtKg / spec.max_payload_kg));
      const containersRequired = Math.max(noByVolume, noByWeight);
      const oceanFreight = rate.base_freight_rate * containersRequired;
      const customsClearance = rate.customs_clearance * containersRequired;
      const terminalHandling = rate.terminal_handling * containersRequired;
      const documentationFees = rate.documentation_fees * containersRequired;
      const totalCost = oceanFreight + customsClearance + terminalHandling + documentationFees;
      analysis[k] = {
        noByVolume, noByWeight, containersRequired,
        oceanFreight, customsClearance, terminalHandling, documentationFees, totalCost,
        costPerM3: totalVolM3 ? totalCost / totalVolM3 : 0,
        costPerKg: totalWtKg ? totalCost / totalWtKg : 0,
      };
    });

    const recommended = CONTAINER_KEYS.reduce(
      (best, k) => analysis[k].totalCost < analysis[best].totalCost ? k : best,
      '20ft'
    );
    return {
      totalVolM3,
      totalWtKg,
      totalUnits: cargoItems.reduce((s, i) => s + i.quantity, 0),
      analysis,
      recommended,
    };
  }, [cargoItems, rates]);

  // Auto-generate share URL once analysis is ready
const generateShareUrl = React.useCallback(() => {
    // ── Always use shipment name as the share ID — one fixed URL per shipment ──
    if (activeShipmentName) {
      const fixedUrl = `${window.location.origin}/share/${encodeURIComponent(activeShipmentName)}`;
      setShareUrl(fixedUrl);
      // Save latest data to DB under this shipment name
      if (shareTimerRef.current) clearTimeout(shareTimerRef.current);
      shareTimerRef.current = setTimeout(async () => {
        try {
          const payload = {
            cargoItems,
            analysisData,
            packingResult,
            selectedContainer,
            freightRates: rates,
            shipmentName: activeShipmentName,
            costBasedResult: costBasedResult || null,
            selectedPlan: selectedPlan || null,
            secondaryResult: secondaryResultStateRef.current || secondaryResultState || null,
            allAdditionalResults: allAdditionalResultsRef.current || [],
            allAdditionalContainerTypes: allAdditionalContainerTypesRef.current || [],
          };
          await fetch(`${API}/api/share-report`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...payload, shareId: activeShipmentName }),
          });
        } catch {}
      }, 800);
    }
  }, [cargoItems, analysisData, packingResult, rates, activeShipmentName, costBasedResult, selectedPlan, secondaryResultState]);

  useEffect(() => {
    if (!cargoItems.length) return;
    generateShareUrl();
  }, [
    cargoItems.length,
    rates,
    selectedPlan?.label,
    costBasedResult?.winner?.label,
    packingResult,
    secondaryResultState,
  ]);

  const updateRate = (containerKey, rateKey, value) => {
    setRates((prev) => ({
      ...prev,
      [containerKey]: { ...prev[containerKey], [rateKey]: Number(value || 0) },
    }));
  };

useEffect(() => {
  if (!cargoItems.length) return;

  const dbRejected = cargoItems.filter(item => item.is_rejected);

  if (dbRejected.length > 0) {
    // Each DB row = one product_name with rejected_quantity units
    // Expand back into individual unit entries so existing UI (count, popup) works correctly
    const formatted = dbRejected.flatMap(item => {
      const qty = Number(item.rejected_quantity || 1);
      return Array.from({ length: qty }, (_, i) => ({
        product_name: item.product_name,
        quantity: 1,
        unit_no: i + 1,
        reason: 'No space available',
      }));
    });
    setRejectedItems(formatted);
    setOriginalRejectedCount(formatted.length);
    return;
  }

  // Fallback: run packing (for shipments not yet saved)
  const checkRejectedItems = async () => {
    try {
      const res = await fetch(`${API}/api/calculate-packing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          container_type: analysisData.recommended,
          container: selectedContainer,
          cargoItems,
        }),
      });
      const result = await res.json();
      if (res.ok && result.success !== false) {
        const allRejected = result.rejected || [];
        const remaining = allRejected.filter(r => !manualPackedSet.has(r.product_name));
        setRejectedItems(remaining);
        setOriginalRejectedCount(allRejected.length);
        setPackingResult(result);
      }
    } catch (err) {
      console.log('Rejected preview failed:', err.message);
    }
  };

  checkRejectedItems();
}, [cargoItems, analysisData.recommended, selectedContainer, manualPackedSet]);

// ═══════════════════════════════════════════════════════════════════
// COST-BASED METHOD-REJECTION — Dynamic Nested Loop Container Selection
// Generates ALL combos of 1 or 2 containers (with repeats allowed)
// from [20ft, 40ft, 40HC, 45HC] → 14 total conditions
// Outer loop: each container plan combo
// Inner loop: pack ALL cargo items — first container takes what it can,
//             overflow spills into second container
// Pick feasible plan (0 rejected) with LOWEST total cost
// ═══════════════════════════════════════════════════════════════════
const runCostBasedMethodRejection = async () => {
  if (!cargoItems.length) {
    setCostBasedError('No cargo items found.');
    return;
  }
  setCostBasedLoading(true);
  setCostBasedError('');
  setCostBasedResult(null);

  const CONTAINER_TYPES = ['20ft', '40ft', '40ft_hc', '45ft_hc'];
  // Sort by cheapest first so we always try lowest cost option
  const containerCostRank = (ct) => {
    const r = rates[ct];
    return r.base_freight_rate + r.customs_clearance + r.terminal_handling + r.documentation_fees;
  };
  const CONTAINER_LABELS = {
    '20ft': '20ft', '40ft': '40ft', '40ft_hc': '40HC', '45ft_hc': '45HC',
  };

  const totalAllItems = cargoItems.reduce((s, i) => s + Number(i.quantity), 0);

  // ── Cache: same container type + same items → reuse result ──
  const packCache = new Map();

  const packOne = async (containerType, items) => {
    const cacheKey = containerType + '|' + items.map(i => `${i.product_name}:${i.quantity}`).join(',');
    if (packCache.has(cacheKey)) return packCache.get(cacheKey);

    const res = await fetch(`${API}/api/calculate-packing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ container_type: containerType, cargoItems: items }),
    });
    const result = await res.json();
    const r = rates[containerType];
    const cost = r.base_freight_rate + r.customs_clearance + r.terminal_handling + r.documentation_fees;
    if (!res.ok || result.success === false) {
      const out = { rejected: items, cost };
      packCache.set(cacheKey, out);
      return out;
    }
    const rejected = (result.rejected || []).map(rej => {
      const orig = cargoItems.find(c => c.product_name === (rej.product_name || rej.name)) || rej;
      return { ...orig, product_name: rej.product_name || rej.name || orig.product_name, quantity: Number(rej.count || rej.quantity || 1) };
    });
    const out = { rejected, cost };
    packCache.set(cacheKey, out);
    return out;
  };

  // ── Step 1: pre-pack ALL 4 container types against full cargo list in parallel ──
  // This primes the cache so depth-1 combos are instant
  await Promise.all(
    CONTAINER_TYPES.map(ct => packOne(ct, cargoItems.map(i => ({ ...i }))).catch(() => {}))
  );

  // ── Process one combo — for last slot, try ALL container types
  //    and pick cheapest that fits remaining items ──
  const processCombo = async (combo) => {
    const planCounts = { '20ft': 0, '40ft': 0, '40ft_hc': 0, '45ft_hc': 0 };
    for (const ct of combo) planCounts[ct]++;

    let itemsRemaining = cargoItems.map(i => ({ ...i }));
    let planTotalCost = 0;
    const usedContainers = [];

    for (let ci = 0; ci < combo.length; ci++) {
      // ── GUARD: nothing left to pack, stop adding containers ──
      if (!itemsRemaining.length) break;

      const ct = combo[ci];
      const isLastSlot = ci === combo.length - 1;

      if (isLastSlot && itemsRemaining.length > 0) {
        // For the last slot, try ALL 4 types and pick cheapest with 0 rejected
        const attempts = await Promise.all(
          CONTAINER_TYPES.map(async tryCt => {
            try {
              const r = await packOne(tryCt, itemsRemaining);
              return { ct: tryCt, ...r };
            } catch {
              return { ct: tryCt, rejected: itemsRemaining, cost: containerCostRank(tryCt) };
            }
          })
        );

        // Pick cheapest among those with 0 rejected
        const feasible = attempts.filter(a => a.rejected.length === 0);
        if (feasible.length > 0) {
          const best = feasible.reduce((b, a) => a.cost < b.cost ? a : b, feasible[0]);
          planTotalCost += best.cost;
          usedContainers.push(best.ct);
          // Update counts to reflect actual container used
          planCounts[ct] = Math.max(0, planCounts[ct] - 1);
          planCounts[best.ct] = (planCounts[best.ct] || 0) + 1;
          itemsRemaining = [];
        } else {
          // Nothing fits all — use original plan container, accept rejections
          try {
            const { rejected, cost } = await packOne(ct, itemsRemaining);
            planTotalCost += cost;
            usedContainers.push(ct);
            itemsRemaining = rejected;
          } catch (err) {
            console.warn('Packing failed for', ct, err.message);
          }
        }
      } else {
        try {
          const { rejected, cost } = await packOne(ct, itemsRemaining);
          planTotalCost += cost;
          usedContainers.push(ct);
          itemsRemaining = rejected;
        } catch (err) {
          console.warn('Packing failed for', ct, err.message);
        }
      }
    }

    const itemsRejectedFinal = itemsRemaining.reduce((s, i) => s + Number(i.quantity), 0);
    const isFeasible = itemsRejectedFinal === 0;

    // Rebuild label and counts from actually used containers
    const actualCounts = { '20ft': 0, '40ft': 0, '40ft_hc': 0, '45ft_hc': 0 };
    for (const ct of usedContainers) actualCounts[ct]++;
    const actualLabel = usedContainers.map(c => CONTAINER_LABELS[c]).join(' + ');

    return {
      label: actualLabel,
      containers: usedContainers,
      counts: actualCounts,
      itemsFitted: totalAllItems - itemsRejectedFinal,
      itemsRejected: itemsRejectedFinal,
      totalAllItems,
      feasible: isFeasible,
      totalCost: planTotalCost,
    };
  };

  // ── Build combos for a given depth ──
  const buildCombos = (depth) => {
    const combos = [];
    const build = (start, current) => {
      if (current.length === depth) { combos.push([...current]); return; }
      for (let i = start; i < CONTAINER_TYPES.length; i++) {
        current.push(CONTAINER_TYPES[i]);
        build(i, current);
        current.pop();
      }
    };
    build(0, []);
    return combos;
  };

  const MAX_DEPTH = 6;
  const PARALLEL_LIMIT = 6;
  const results = [];
  const seenKeys = new Set(); // global dedup across all depths
  let foundFeasible = false;

  for (let depth = 1; depth <= MAX_DEPTH && !foundFeasible; depth++) {
    const combos = buildCombos(depth);

    for (let i = 0; i < combos.length; i += PARALLEL_LIMIT) {
      const batch = combos.slice(i, i + PARALLEL_LIMIT);
      const batchResults = await Promise.all(batch.map(combo => processCombo(combo)));

      for (const r of batchResults) {
        // Deduplicate using sorted containers as canonical key
        const key = [...r.containers].sort().join('|');
        if (seenKeys.has(key)) continue; // skip duplicate
        seenKeys.add(key);
        results.push(r);
      }

      if (results.some(r => r.feasible)) {
        foundFeasible = true;
        break;
      }
    }
  }

  // ── PICK WINNER: lowest cost, fewest containers on tie ──
  const feasiblePlans = results.filter(r => r.feasible);
  const winner = feasiblePlans.length > 0
    ? feasiblePlans.reduce((best, r) => {
        if (r.totalCost < best.totalCost) return r;
        if (r.totalCost === best.totalCost && r.containers.length < best.containers.length) return r;
        return best;
      }, feasiblePlans[0])
    : null;

setCostBasedResult({ results, winner, totalAllItems });
  setSelectedPlan(winner);
  setCostBasedLoading(false);
  if (winner) savePlanToDB(winner, results);
  setTimeout(() => generateShareUrl(), 100);
};

const handleProceedTo3D = async () => {
  if (!cargoItems.length) {
    setError('No cargo items found. Please add cargo items first.');
    return;
  }
  setPacking(true);
  setError('');
  try {
    // ── If cost-based analysis has a winner, use its container order ──
    // Sort containers largest → smallest so we fill the biggest first
const activePlan = selectedPlan || costBasedResult?.winner;
    if (activePlan) {
      const CONTAINER_VOL = {
        '20ft': 33.137, '40ft': 67.566, '40ft_hc': 76.048, '45ft_hc': 85.720,
      };
      // Sort the winner containers largest volume first
const orderedContainers = [...activePlan.containers].sort(
        (a, b) => CONTAINER_VOL[b] - CONTAINER_VOL[a]
      );

const primaryContainer = orderedContainers[0];

      // Step 1 — pack ALL items into primary (largest) container
      const res1 = await fetch(`${API}/api/calculate-packing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ container_type: primaryContainer, cargoItems }),
      });
      const result1 = await res1.json();
      if (!res1.ok || result1.success === false)
        throw new Error(result1.message || result1.error || 'Primary container packing failed');

      // Steps 2..N — pack overflow into each remaining container in the plan
// Steps 2..N — pack overflow into each remaining container in the plan
      let overflow = result1.rejected || [];
      const additionalResults = [];
      const actualContainerTypes = [primaryContainer]; // track what actually got used

      for (let ci = 1; ci < orderedContainers.length; ci++) {
        // ── STOP if nothing left to pack — don't add empty containers ──
        if (!overflow.length) break;

        const overflowAsCargo = overflow.map(r => {
          const orig = cargoItems.find(c => c.product_name === (r.product_name || r.name)) || r;
          return { ...orig, product_name: r.product_name || r.name || orig.product_name, quantity: Number(r.count || r.quantity || 1) };
        });
const resN = await fetch(`${API}/api/calculate-packing`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ container_type: orderedContainers[ci], cargoItems: overflowAsCargo }),
        });
        const resultN = await resN.json();
        // ── Debug: log any placements outside container bounds ──
        const contDims = resultN.container;
        if (contDims) {
          (resultN.placements || []).forEach(p => {
            if (
              p.x + (p.length_mm || 0) > (contDims.internal_length_mm || 0) ||
              p.z + (p.width_mm  || 0) > (contDims.internal_width_mm  || 0) ||
              p.y + (p.height_mm || 0) > (contDims.internal_height_mm || 0)
            ) {
              console.error('🚨 PACKING ENGINE returned item outside container:', p, contDims);
            }
          });
        }

        // ── Only add this container if it actually packed something ──
        if ((resultN.placements || []).length > 0) {
          additionalResults.push(resultN);
          actualContainerTypes.push(orderedContainers[ci]);
        }

        overflow = resultN.rejected || [];
      }

      // ── Build the actual plan label from containers that were really used ──
      const CONTAINER_LABELS = {
        '20ft': '20ft', '40ft': '40ft', '40ft_hc': '40HC', '45ft_hc': '45HC',
      };
      const actualPlanLabel = actualContainerTypes
        .map(c => CONTAINER_LABELS[c] || c)
        .join(' + ');

      const cleanAdditionalResults = additionalResults;
      const cleanContainerTypes = actualContainerTypes.slice(1);

const result2 = cleanAdditionalResults[0] || null;
      secondaryResultStateRef.current = result2;
      allAdditionalResultsRef.current = cleanAdditionalResults;
      allAdditionalContainerTypesRef.current = cleanContainerTypes;
      setSecondaryResultState(result2);

      // ── Save latest state to share URL before navigating ──
      // We call the API directly here instead of generateShareUrl()
      // because React state updates are async and refs have the latest values
      try {
        await fetch(`${API}/api/share-report`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            shareId: activeShipmentName,
            shipmentName: activeShipmentName,
            cargoItems,
            analysisData,
            packingResult: result1,
            selectedContainer: result1.container || primaryContainer,
            freightRates: rates,
            costBasedResult: costBasedResult || null,
            selectedPlan: activePlan || null,
            secondaryResult: result2,
            allAdditionalResults: cleanAdditionalResults,
            allAdditionalContainerTypes: cleanContainerTypes,
          }),
        });
      } catch (e) {
        console.warn('Share URL update failed:', e.message);
      }

      localStorage.setItem('FORCE_FRESH_PACKING', 'true');

      navigate('/3d-viewer', {
        state: {
          result: result1,
          selectedContainer: result1.container || primaryContainer,
          placements: result1.placements || [],
          cargoItems,
          costAnalysis: analysisData,
          rejectedFromCostAnalysis: result1.rejected || [],
          secondaryContainerType: cleanContainerTypes[0] || null,
          secondaryResult: result2,
          allAdditionalResults: cleanAdditionalResults,
          allAdditionalContainerTypes: cleanContainerTypes,
          costBasedPlan: actualPlanLabel,   // ← shows actual used containers, not planned
          navigationTs: Date.now(),
        },
      });
      return;
    }

    // ── Default: no cost-based winner, use existing logic ────────────
    if (packingResult) {
      localStorage.setItem('FORCE_FRESH_PACKING', 'true');
      navigate('/3d-viewer', {
        state: {
          result: packingResult,
          selectedContainer: packingResult.container || selectedContainer,
          placements: packingResult.placements || [],
          cargoItems,
          costAnalysis: analysisData,
          rejectedFromCostAnalysis: rejectedItems,
          navigationTs: Date.now(),
        },
      });
      return;
    }

    const res = await fetch(`${API}/api/calculate-packing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        container_type: analysisData.recommended,
        container: selectedContainer,
        cargoItems,
      }),
    });
    const result = await res.json();
    setRejectedItems(result.rejected || []);
    setPackingResult(result);
    if (!res.ok || result.error || result.success === false)
      throw new Error(result.message || result.error || '3D packing calculation failed');
    navigate('/3d-viewer', {
      state: {
        result,
        selectedContainer: result.container || selectedContainer,
        placements: result.placements || [],
        cargoItems,
        costAnalysis: analysisData,
        rejectedFromCostAnalysis: result.rejected || [],
        navigationTs: Date.now(),
      },
    });
  } catch (e) {
    setError(e.message);
  } finally {
    setPacking(false);
  }
};

  const layoutSavedForShipment =
    activeShipmentName &&
    localStorage.getItem(`cargoset_saved_layout_${activeShipmentName}`);

  const validManualPackedSet = layoutSavedForShipment ? manualPackedSet : new Set();
  const manualFittedCount = validManualPackedSet.size;

  useEffect(() => {
    console.log("manualPackedSet:", [...manualPackedSet]);
    console.log("rejectedItems:", rejectedItems);
    console.log("originalRejectedCount:", originalRejectedCount);
    console.log("manualFittedCount:", manualFittedCount);
  }, [manualPackedSet, rejectedItems]);

  const manualPackedNames = [...manualPackedSet];

  const visibleManualPacked = showManualPacked
    ? manualPackedNames
    : manualPackedNames.slice(0, 2);

  const rejectedNames = rejectedItems.map((item) =>
    String(item.product_name || item.name || '').trim().toLowerCase()
  );

const visibleCargoItems = cargoItems;

  const tableItemsToShow = showManualPacked
    ? visibleCargoItems
    : visibleCargoItems.slice(0, 5);

  if (!cargoItems.length && !analysisData.totalUnits) {
    return (
      <SidebarLayout title="">
        <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
          <p>Loading cargo data...</p>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout title="">
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div className="cost-analysis">
        <div className="ca-header">
          <h2>💰 Freight Cost Analysis</h2>
          <p className="ca-subtitle"></p>
          {error && <div className="ca-error">⚠️ {error}</div>}
        </div>

        <div className="ca-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3>Freight Charges ({currency} per container)</h3>
            <div className="currency-box">
              <label>Select Currency</label>
              <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="currency-select">
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
                  {CONTAINER_KEYS.map((k) => <th key={k}>{CONTAINER_NAMES[k]}</th>)}
                </tr>
              </thead>
              <tbody>
                {Object.entries(RATE_LABELS).map(([rateKey, label]) => (
                  <tr key={rateKey}>
                    <td><strong>{label}</strong></td>
                    {CONTAINER_KEYS.map((k) => (
                      <td key={k}>
                        <input
                          className="ca-rate-input"
                          type="number"
                          value={rates[k][rateKey]}
                          onChange={(e) => updateRate(k, rateKey, e.target.value)}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="ca-formula-note">Changing these values immediately recalculates the lowest-cost container.</p>
        </div>

<div className="ca-section">
          {activeShipmentName && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '10px',
            }}>
              <span style={{
                background: '#1e3a8a',
                color: '#fff',
                borderRadius: '20px',
                padding: '4px 14px',
                fontSize: '13px',
                fontWeight: '700',
                letterSpacing: '0.04em',
              }}>
                📦 {activeShipmentName.toUpperCase()}
              </span>
            </div>
          )}
          <h3>Cargo Summary From Item List</h3>
          <div className="ca-summary-grid">
            <div className="ca-stat">
              <span className="ca-stat-label">Total Volume</span>
              <span className="ca-stat-value">{fmt(analysisData.totalVolM3, 4)} m³</span>
            </div>
            <div className="ca-stat">
              <span className="ca-stat-label">Total Weight</span>
              <span className="ca-stat-value">{fmt(analysisData.totalWtKg, 2)} kg</span>
            </div>
            <div className="ca-stat">
              <span className="ca-stat-label">Item Lines</span>
              <span className="ca-stat-value">{cargoItems.length}</span>
            </div>
            <div className="ca-stat">
              <span className="ca-stat-label">Total Qty</span>
              <span className="ca-stat-value">{fmt(analysisData.totalUnits)}</span>
            </div>
          </div>

          <div
            className="ca-table-wrap"
            style={{
              marginTop: '20px',
              maxHeight: showManualPacked ? 'none' : '420px',
              overflow: 'hidden',
            }}
          >
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
                {tableItemsToShow.map((item, index) => (
                  <tr key={index}>
                    <td>{item.product_name}</td>
                    <td>{item.length_mm}</td>
                    <td>{item.width_mm}</td>
                    <td>{item.height_mm}</td>
                    <td>{item.weight_kg}</td>
                    <td>{Number(item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {visibleCargoItems.length > 5 && (
            <div style={{ textAlign: 'center', marginTop: '10px' }}>
              <button
                onClick={() => setShowManualPacked(!showManualPacked)}
                style={{
                  background: 'transparent', border: '1px solid #2563eb', color: '#2563eb',
                  fontWeight: 700, cursor: 'pointer', fontSize: '13px', borderRadius: '6px', padding: '4px 12px',
                }}
              >
                {showManualPacked ? 'Show less' : 'Show more'}
              </button>
            </div>
          )}

{/* <div
  style={{
    marginTop: '20px', padding: '14px 18px', border: '1px solid #fecaca',
    background: '#fff1f2', borderRadius: '10px', display: 'flex',
    justifyContent: 'space-between', alignItems: 'center',
    cursor: 'pointer', fontWeight: '700', color: '#b91c1c',
  }}
  onClick={() => setShowRejectedPopup(true)}
>
  <span>Rejected Items</span>

  <span>
    {cargoItems.filter(i => i.is_rejected).length > 0
      ? `${cargoItems.filter(i => i.is_rejected).length} product type${cargoItems.filter(i => i.is_rejected).length > 1 ? 's' : ''} · ${rejectedItems.length} unit${rejectedItems.length !== 1 ? 's' : ''}`
      : rejectedItems.length
    }
  </span>
</div> */}

{showRejectedPopup && (
  <div style={{
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.45)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', zIndex: 9999,
  }}>
    <div style={{
      background: '#fff', width: '520px', maxHeight: '75vh',
      overflowY: 'auto', borderRadius: '14px', padding: '22px',
    }}>
      <h3 style={{ marginBottom: '16px', color: '#b91c1c' }}>Rejected Items</h3>
      {rejectedItems.length === 0 ? (
        <p>No rejected items</p>
      ) : (
        // Group by product_name for clean display
        Object.values(
          rejectedItems.reduce((acc, item) => {
            const name = item.product_name || `Item`;
            if (!acc[name]) acc[name] = { ...item, count: 0 };
            acc[name].count += 1;
            return acc;
          }, {})
        ).map((item, index) => (
          <div key={index} style={{
            padding: '12px', border: '1px solid #fee2e2',
            borderRadius: '10px', marginBottom: '10px', background: '#fff7f7',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <strong>{item.product_name}</strong>
              <div style={{ marginTop: '5px', fontSize: 13, color: '#b91c1c' }}>
                {item.count} unit{item.count !== 1 ? 's' : ''} rejected
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 3 }}>
                Reason: {item.reason || 'No space available'}
              </div>
            </div>
            <div style={{
              background: '#fee2e2', borderRadius: 8, padding: '6px 14px',
              fontWeight: 700, fontSize: 18, color: '#b91c1c',
            }}>
              ×{item.count}
            </div>
          </div>
        ))
      )}
      <button
        onClick={() => setShowRejectedPopup(false)}
        style={{
          marginTop: '14px', background: '#1e3a8a', color: '#fff',
          border: 'none', borderRadius: '8px', padding: '9px 18px', cursor: 'pointer',
        }}
      >
        Close
      </button>
    </div>
  </div>
)}
        </div>

        {/* ══════════════════════════════════════════════════════════
             COST-BASED METHOD-REJECTION SECTION
             Dynamic nested loop — all 1 & 2 container combos
             ══════════════════════════════════════════════════════════ */}
        <div className="ca-section">
<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0 }}>Rejection Resolution</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '260px', justifyContent: 'flex-end' }}>
              <span style={{ color: '#16a34a', fontWeight: 700, fontSize: 13, visibility: planSaved ? 'visible' : 'hidden' }}>
                ✅ Plan saved
              </span>
              <button
                onClick={runCostBasedMethodRejection}
                disabled={costBasedLoading || !cargoItems.length}
                style={{
                  background: cargoItems.length ? '#1e3a8a' : '#94a3b8',
                  color: '#fff', border: 'none', borderRadius: '8px',
                  padding: '10px 22px', fontWeight: 700, fontSize: '14px',
                  cursor: cargoItems.length ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', gap: '8px',
                  whiteSpace: 'nowrap',
                }}
              >
                {costBasedLoading ? (
                  <><span style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />Analysing…</>
                ) : (
                  <>🔁 Run Cost-Based Analysis</>
                )}
              </button>
            </div>
          </div>

          {costBasedError && (
            <div style={{ padding: '12px', background: '#fff1f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#b91c1c', marginBottom: '12px' }}>
              ⚠️ {costBasedError}
            </div>
          )}

          {/* Results table — shown after analysis runs */}
          {costBasedResult && (
            <>
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
{costBasedResult.results.map((row, idx) => {
const rowKey = [...(row.containers || [])].sort().join('|');
                      const winnerKey = costBasedResult.winner ? [...(costBasedResult.winner.containers || [])].sort().join('|') : null;
                      const isWinner = !!winnerKey && rowKey === winnerKey && idx === costBasedResult.results.findIndex(r => [...(r.containers||[])].sort().join('|') === winnerKey);
                      const isSelected = selectedPlan
                        ? [...(selectedPlan.containers || [])].sort().join('|') === rowKey && idx === costBasedResult.results.findIndex(r => [...(r.containers||[])].sort().join('|') === rowKey)
                        : false;
                      return (
                        <tr
                          key={idx}
onClick={async () => {
                            setSelectedPlan(row);
                            savePlanToDB(row, costBasedResult.results);
                            // ── Save share URL immediately with the newly selected plan ──
                            // Don't use generateShareUrl() here because React state
                            // selectedPlan hasn't updated yet — pass row directly
                            if (activeShipmentName) {
                              try {
                                await fetch(`${API}/api/share-report`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    shareId: activeShipmentName,
                                    shipmentName: activeShipmentName,
                                    cargoItems,
                                    analysisData,
                                    packingResult,
                                    selectedContainer,
                                    freightRates: rates,
                                    costBasedResult: costBasedResult || null,
                                    selectedPlan: row,
                                    secondaryResult: secondaryResultStateRef.current || null,
                                    allAdditionalResults: allAdditionalResultsRef.current || [],
                                    allAdditionalContainerTypes: allAdditionalContainerTypesRef.current || [],
                                  }),
                                });
                              } catch (e) {
                                console.warn('Share save failed:', e.message);
                              }
                            }
                          }}
                          style={{
                            background: isSelected ? '#dbeafe' : row.feasible ? '#f0fdf4' : '#fff7f7',
                            fontWeight: isSelected ? 700 : 400,
                            outline: isSelected ? '2px solid #2563eb' : undefined,
                            cursor: 'pointer',
                            transition: 'background 0.15s',
                          }}
                        >
                          <td>Solution {idx + 1}</td>
                          <td>
                            <strong>{row.label}</strong>
                            {isWinner && (
                              <span style={{
                                marginLeft: 8, background: '#ca8a04', color: '#fff',
                                borderRadius: 5, padding: '2px 8px', fontSize: 11, fontWeight: 700,
                              }}>✓ Optimal</span>
                            )}
                            {isSelected && !isWinner && (
                              <span style={{
                                marginLeft: 8, background: '#2563eb', color: '#fff',
                                borderRadius: 5, padding: '2px 8px', fontSize: 11, fontWeight: 700,
                              }}>✓ Selected</span>
                            )}
                          </td>
                          <td style={{ textAlign: 'center' }}>{row.counts['20ft'] || 0}</td>
                          <td style={{ textAlign: 'center' }}>{row.counts['40ft'] || 0}</td>
                          <td style={{ textAlign: 'center' }}>{row.counts['40ft_hc'] || 0}</td>
                          <td style={{ textAlign: 'center' }}>{row.counts['45ft_hc'] || 0}</td>
                          <td style={{ textAlign: 'center', color: '#166534', fontWeight: 600 }}>
                            {row.itemsFitted}
                          </td>
                          <td style={{ textAlign: 'center', color: row.itemsRejected > 0 ? '#b91c1c' : '#166534', fontWeight: 600 }}>
                            {row.itemsRejected}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 700 }}>
                            {currencySymbols[currency]}{fmt(row.totalCost)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* no-feasible warning only */}
{costBasedResult && !costBasedResult.winner && costBasedResult.results.every(r => Number(r.itemsRejected) > 0) && (
                <div style={{
                  marginTop: '16px', padding: '16px 20px',
                  background: '#fff1f2', border: '1px solid #fecaca',
                  borderRadius: '10px', color: '#b91c1c', fontWeight: 600,
                }}>
                  ⚠️ No container combination found that can fit all items. Try reviewing item dimensions.
                </div>
              )}
            </>
          )}
        </div>

        <div
          className="ca-recommendation"
          style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px' }}
        >
          {/* LEFT SIDE — updates when cost-based analysis runs */}
          <div style={{ display: 'flex', gap: '16px' }}>
            <span className="ca-rec-icon">✅</span>
            <div>
              <strong>
{(selectedPlan || costBasedResult?.winner)
                  ? <>{ selectedPlan && selectedPlan.label !== costBasedResult?.winner?.label ? 'Selected Container Plan' : 'Optimal Container Plan'}: {(selectedPlan || costBasedResult.winner).label}</>
                  : costBasedResult && !costBasedResult.winner
                  ? <>No feasible plan found</>
                  : <>Run Cost-Based Analysis to find the optimal container plan</>
                }
              </strong>
              <p>
{costBasedResult?.winner ? (
                  <>
Lowest feasible cost {currencySymbols[currency]}{fmt((selectedPlan || costBasedResult.winner).totalCost)}{' '}
                    · {(selectedPlan || costBasedResult.winner).itemsFitted}/{costBasedResult.totalAllItems} items fitted ✅
                  </>
) : costBasedResult && !costBasedResult.winner && costBasedResult.results.every(r => Number(r.itemsRejected) > 0) ? (
                  <>No container plan found that fits all items. Review item dimensions.</>
                ) : (
                  <>-----</>
                )}
              </p>
<button
                className="btn-primary ca-proceed-btn"
                onClick={handleProceedTo3D}
                disabled={packing || !cargoItems.length || (!costBasedResult && rejectedItems.length > 0)}
                title={!costBasedResult && rejectedItems.length > 0 ? 'Run Cost-Based Analysis first to resolve rejected items' : ''}
              >
{packing ? 'Calculating 3D…' : (selectedPlan || costBasedResult?.winner) ? `Proceed with ${(selectedPlan || costBasedResult.winner).label}` : 'Proceed to 3D Loading'}
              </button>
            </div>
          </div>

          {/* RIGHT SIDE SHARE URL */}
          <div
            style={{
              background: '#fff', border: '1px solid #dbeafe', borderRadius: '14px',
              padding: '16px', width: '540px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
            }}
          >
            <div style={{ fontWeight: '700', color: '#1e3a8a', marginBottom: '12px', fontSize: '16px' }}>
              🔗 Shareable Public URL
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input
                value={
                  shareLoading
                    ? 'Generating share link...'
                    : shareUrl || `${window.location.origin}/share/demo`
                }
                readOnly
                style={{
                  flex: 1, padding: '12px', border: '1px solid #cbd5e1',
                  borderRadius: '10px', fontSize: '14px', outline: 'none',
                  background: '#f8fafc', textAlign: 'center', fontWeight: '500',
                }}
              />
              <button
                id="copyShareButton"
                onClick={async (e) => {
                  const url = shareUrl || `${window.location.origin}/share/demo`;
                  if (!shareUrl) {
                    alert('Share link is still generating, please wait.');
                    return;
                  }
                  await navigator.clipboard.writeText(url);
                  e.target.innerHTML = '✔';
                  e.target.style.color = '#16a34a';
                  e.target.style.fontSize = '24px';
                  const toastBox = document.createElement('div');
                  toastBox.innerText = '✔ Link copied successfully';
                  toastBox.style.position = 'fixed';
                  toastBox.style.top = '20px';
                  toastBox.style.right = '20px';
                  toastBox.style.background = '#16a34a';
                  toastBox.style.color = '#fff';
                  toastBox.style.width = '260px';
                  toastBox.style.padding = '14px 28px';
                  toastBox.style.borderRadius = '10px';
                  toastBox.style.fontWeight = '600';
                  toastBox.style.fontSize = '15px';
                  toastBox.style.textAlign = 'center';
                  toastBox.style.boxShadow = '0 4px 14px rgba(0,0,0,0.15)';
                  toastBox.style.zIndex = '99999';
                  document.body.appendChild(toastBox);
                  setTimeout(() => {
                    toastBox.remove();
                    e.target.innerHTML = '⧉';
                    e.target.style.color = '#000';
                    e.target.style.fontSize = '22px';
                  }, 2000);
                }}
                style={{
                  width: '56px', height: '48px', border: '1px solid #cbd5e1',
                  background: '#fff', borderRadius: '10px', cursor: 'pointer',
                  fontSize: '22px', transition: '0.2s ease',
                }}
              >
                ⧉
              </button>
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}