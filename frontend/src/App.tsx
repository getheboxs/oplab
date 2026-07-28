import { Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import AdminLoginPage from "./pages/admin/LoginPage";
import AdminDashboardPage from "./pages/admin/DashboardPage";
import PraktikumManagementPage from "./pages/admin/PraktikumManagementPage";
import RekapPage from "./pages/admin/RekapPage";
import PraktikumLobiPage from "./pages/mahasiswa/PraktikumLobiPage";
import PraktikumMulaiPlaceholder from "./pages/mahasiswa/PraktikumMulaiPlaceholder";
import RequireAdminAuth from "./routes/RequireAdminAuth";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/praktikum" element={<PraktikumLobiPage />} />
      <Route path="/praktikum/mulai" element={<PraktikumMulaiPlaceholder />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route
        path="/admin/dashboard"
        element={
          <RequireAdminAuth>
            <AdminDashboardPage />
          </RequireAdminAuth>
        }
      />
      <Route
        path="/admin/praktikum"
        element={
          <RequireAdminAuth>
            <PraktikumManagementPage />
          </RequireAdminAuth>
        }
      />
      <Route
        path="/admin/rekap"
        element={
          <RequireAdminAuth>
            <RekapPage />
          </RequireAdminAuth>
        }
      />
    </Routes>
  );
}
