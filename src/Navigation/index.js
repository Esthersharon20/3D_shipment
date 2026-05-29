import { Routes, Route } from "react-router-dom";
import { Dashboard, Login, CargoConfig, CargoList, ThreeDViewer, Shipments, CostAnalysis } from "../Pages";
import SharedReport from "../Pages/ShareReport/ShareReport";
import SharedThreeD from "../Pages/SharedThreeD/SharedThreeD";
export default function Navigation() {
  return (
    <Routes>
      <Route path="/"            element={<Login />} />
      <Route path="/login"       element={<Login />} />
      <Route path="/dashboard"   element={<Dashboard />} />
      <Route path="/shipments"   element={<Shipments />} />
      <Route path="/cargo-config" element={<CargoConfig />} />
      <Route path="/cargo-list"  element={<CargoList />} />
      <Route path="/3d-viewer"   element={<ThreeDViewer />} />
      <Route path="/cost-analysis" element={<CostAnalysis />} />
      <Route path="/CostAnalysis" element={<CostAnalysis />} />
      <Route path="/share/:shareId" element={<SharedReport />} />
      <Route path="/share/:shareId/3d" element={<SharedThreeD />} />
    </Routes>
  );
}