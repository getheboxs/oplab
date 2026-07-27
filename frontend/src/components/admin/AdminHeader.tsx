import { RefreshCw, LogOut, RotateCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

interface AdminHeaderProps {
  onRefresh?: () => void;
}

export default function AdminHeader({ onRefresh }: AdminHeaderProps) {
  const navigate = useNavigate();
  const { admin, clearSession } = useAuth();

  function handleLogout() {
    clearSession();
    navigate("/admin/login");
  }

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-purple-500 text-white shadow-sm">
            <RotateCw className="h-5 w-5" strokeWidth={2.2} />
          </div>
          <div>
            <p className="text-lg font-extrabold leading-tight text-slate-900">
              OPLab Admin Panel
            </p>
            <p className="font-mono text-[11px] uppercase tracking-widest text-brand-500">
              {admin ? `Halo, ${admin.nama_lengkap}` : "Pusat Kendali Pengawasan Real-Time"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            title="Muat ulang data"
            onClick={onRefresh}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <LogOut className="h-4 w-4" />
            Keluar Portal
          </button>
        </div>
      </div>
    </header>
  );
}
