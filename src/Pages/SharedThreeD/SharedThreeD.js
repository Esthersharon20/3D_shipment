import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ThreeDViewer from "../ThreeDViewer/ThreeDViewer";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

const CONTAINER_VOL = {
  '20ft': 33.137, '40ft': 67.566, '40ft_hc': 76.048, '45ft_hc': 85.720,
};

function sortedContainers(containers) {
  return [...(containers || [])].sort((a, b) => (CONTAINER_VOL[b] || 0) - (CONTAINER_VOL[a] || 0));
}

export default function SharedThreeD() {
  const { shareId } = useParams();
  const [viewerState, setViewerState] = useState(null);
  const [error, setError] = useState(null);
  const [loadingMsg, setLoadingMsg] = useState('Loading shared report...');

  useEffect(() => {
    fetch(`${API}/api/share-report/${encodeURIComponent(shareId)}`)
      .then(res => {
        if (!res.ok) throw new Error("Shared report not found");
        return res.json();
      })
      .then(async (report) => {
        console.log("Share report data:", report);

        const cargoItems = report.cargoItems || [];

        // ── Use saved allAdditionalResults if available (from Proceed to 3D) ──
        // This is the most accurate — it reflects exactly what was packed
        if (report.allAdditionalResults && report.allAdditionalResults.length > 0 && report.packingResult?.placements?.length > 0) {
          setLoadingMsg('Rendering saved layout...');
          const activePlan = report.selectedPlan || report.costBasedResult?.winner || null;
          const ordered = activePlan ? sortedContainers(activePlan.containers) : [];
          const CONTAINER_LABELS = { '20ft': '20ft', '40ft': '40ft', '40ft_hc': '40HC', '45ft_hc': '45HC' };
          const planLabel = ordered.map(c => CONTAINER_LABELS[c] || c).join(' + ');

          setViewerState({
            isSharedView: true,
            result: {
              container: report.packingResult.container,
              placements: report.packingResult.placements || [],
              rejected: report.packingResult.rejected || [],
              odc: report.packingResult.odc || false,
              overWidthMm: report.packingResult.overWidthMm || 0,
              overHeightMm: report.packingResult.overHeightMm || 0,
              overweight: report.packingResult.overweight || false,
              overweightKg: report.packingResult.overweightKg || 0,
            },
            selectedContainer: report.packingResult.container,
            placements: report.packingResult.placements || [],
            cargoItems,
            costAnalysis: report.analysisData,
            costBasedPlan: planLabel || report.costBasedPlan || null,
            secondaryContainerType: report.allAdditionalContainerTypes?.[0] || null,
            secondaryResult: report.allAdditionalResults[0] || null,
            allAdditionalResults: report.allAdditionalResults,
            allAdditionalContainerTypes: report.allAdditionalContainerTypes || [],
            shipmentName: report.shipmentName || '',
            navigationTs: Date.now(),
          });
          return;
        }

        // ── No saved packing — re-pack fresh using the plan ──
        const activePlan = report.selectedPlan || report.costBasedResult?.winner || null;
        const ordered = activePlan ? sortedContainers(activePlan.containers) : [];

        const packOne = async (containerType, items) => {
          const res = await fetch(`${API}/api/calculate-packing`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ container_type: containerType, cargoItems: items }),
          });
          if (!res.ok) throw new Error(`Packing failed for ${containerType}`);
          return res.json();
        };

        if (ordered.length > 0 && cargoItems.length > 0) {
          setLoadingMsg('Packing primary container...');
          let result1 = null;
          try { result1 = await packOne(ordered[0], cargoItems); }
          catch (e) { console.warn('Primary pack failed:', e.message); }
          if (!result1) throw new Error('Primary container packing failed');

          let overflow = result1.rejected || [];
          let secondaryResult = null;
          const additionalResults = [];

          for (let ci = 1; ci < ordered.length; ci++) {
            if (!overflow.length) break;
            try {
              setLoadingMsg(`Packing container ${ci + 1} of ${ordered.length}...`);
              const overflowAsCargo = overflow.map(r => {
                const orig = cargoItems.find(c => c.product_name === (r.product_name || r.name)) || r;
                return { ...orig, product_name: r.product_name || r.name || orig.product_name, quantity: Number(r.count || r.quantity || 1), cargo_type: r.cargo_type || orig.cargo_type || 'Cartons', color: r.color || orig.color || '#1565c0' };
              });
              const resultN = await packOne(ordered[ci], overflowAsCargo);
              if (!secondaryResult) secondaryResult = resultN;
              if ((resultN.placements || []).length > 0) additionalResults.push(resultN);
              overflow = resultN.rejected || [];
            } catch (e) { console.warn(`Pack failed for container ${ci + 1}:`, e.message); }
          }

          const CONTAINER_LABELS = { '20ft': '20ft', '40ft': '40ft', '40ft_hc': '40HC', '45ft_hc': '45HC' };
          const planLabel = ordered.map(c => CONTAINER_LABELS[c] || c).join(' + ');

          setViewerState({
            isSharedView: true,
            result: {
              container: result1.container,
              placements: result1.placements || [],
              rejected: result1.rejected || [],
              odc: result1.odc || false,
              overWidthMm: result1.overWidthMm || 0,
              overHeightMm: result1.overHeightMm || 0,
              overweight: result1.overweight || false,
              overweightKg: result1.overweightKg || 0,
            },
            selectedContainer: result1.container,
            placements: result1.placements || [],
            cargoItems,
            costAnalysis: report.analysisData,
            costBasedPlan: planLabel,
            secondaryContainerType: ordered[1] || null,
            secondaryResult: secondaryResult ? { container: secondaryResult.container || null, placements: secondaryResult.placements || [], rejected: secondaryResult.rejected || [] } : null,
            allAdditionalResults: additionalResults,
            allAdditionalContainerTypes: ordered.slice(1),
            shipmentName: report.shipmentName || '',
            navigationTs: Date.now(),
          });
          return;
        }

        // ── Fallback: no plan, use saved packingResult or layout DB ──
        setLoadingMsg('Loading saved layout...');
        let packingResult = report.packingResult || {};
        let container = packingResult.container || report.selectedContainer || null;
        let placements = packingResult.placements || [];

        if ((!placements || placements.length === 0) && report.shipmentName) {
          try {
            const layoutRes = await fetch(`${API}/api/shipments/layout/${encodeURIComponent(report.shipmentName)}`);
            if (layoutRes.ok) {
              const layoutData = await layoutRes.json();
              if (Array.isArray(layoutData.placements) && layoutData.placements.length > 0) {
                placements = layoutData.placements;
                if (layoutData.container) container = layoutData.container;
              }
            }
          } catch (e) { console.warn("Layout fallback failed:", e.message); }
        }

        setViewerState({
          isSharedView: true,
          result: { container, placements, rejected: packingResult.rejected || [], odc: packingResult.odc || false, overWidthMm: packingResult.overWidthMm || 0, overHeightMm: packingResult.overHeightMm || 0, overweight: packingResult.overweight || false, overweightKg: packingResult.overweightKg || 0 },
          selectedContainer: container,
          placements,
          cargoItems,
          costAnalysis: report.analysisData,
          costBasedPlan: null,
          secondaryContainerType: null,
          secondaryResult: null,
          allAdditionalResults: [],
          allAdditionalContainerTypes: [],
          shipmentName: report.shipmentName || '',
          navigationTs: Date.now(),
        });
      })
      .catch(err => setError(err.message));
  }, [shareId]);

  if (error) return <h2 style={{ padding: 30, color: "red" }}>Error: {error}</h2>;
  if (!viewerState) return <h2 style={{ padding: 30, color: '#64748b' }}>{loadingMsg}</h2>;

  return <ThreeDViewer injectedState={viewerState} />;
}