import type { LucideIcon } from "lucide-react";
import { ShieldAlert, Download, LayoutGrid, ClipboardList } from "lucide-react";
import { NavLink } from "react-router-dom";

interface TabItem {
  label: string;
  icon: LucideIcon;
  path?: string;
}

const tabs: TabItem[] = [
  { label: "Ringkasan Statistik", icon: LayoutGrid, path: "/admin/dashboard" },
  { label: "Manajemen Praktikum", icon: ClipboardList, path: "/admin/praktikum" },
  { label: "Monitor Real-Time", icon: ShieldAlert },
  { label: "Rekap & Ekspor CSV", icon: Download },
];

export default function AdminTabs() {
  return (
    <nav className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl gap-2 px-6">
        {tabs.map((tab) =>
          tab.path ? (
            <NavLink
              key={tab.label}
              to={tab.path}
              className={({ isActive }) =>
                `flex items-center gap-2 border-b-2 px-4 py-4 font-mono text-xs font-semibold uppercase tracking-wider transition ${
                  isActive
                    ? "border-brand-600 text-brand-700"
                    : "border-transparent text-slate-400 hover:text-slate-700"
                }`
              }
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </NavLink>
          ) : (
            <button
              key={tab.label}
              type="button"
              disabled
              title="Segera hadir"
              className="flex cursor-not-allowed items-center gap-2 border-b-2 border-transparent px-4 py-4 font-mono text-xs font-semibold uppercase tracking-wider text-slate-300"
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          )
        )}
      </div>
    </nav>
  );
}
