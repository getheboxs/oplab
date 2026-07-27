import { TerminalSquare, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Header() {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-10 border-b border-slate-100 bg-white/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-purple-500 text-white shadow-sm">
            <TerminalSquare className="h-6 w-6" strokeWidth={2.2} />
          </div>
          <div>
            <p className="text-lg font-extrabold leading-tight text-slate-900">OPLab</p>
            <p className="font-mono text-[11px] uppercase tracking-widest text-slate-400">
              Online Programming Lab
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate("/admin/login")}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
        >
          <ShieldCheck className="h-4 w-4" />
          Portal Admin
        </button>
      </div>
    </header>
  );
}
