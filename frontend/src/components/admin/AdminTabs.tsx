import type { LucideIcon } from "lucide-react";
import { ShieldAlert, Download, LayoutGrid, ClipboardList, Users } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

interface TabItem {
  label: string;
  icon: LucideIcon;
  path: string;
  matchPrefix?: string;
}

const tabs: TabItem[] = [
  { label: "Ringkasan Statistik", icon: LayoutGrid, path: "/admin/dashboard" },
  { label: "Manajemen Praktikum", icon: ClipboardList, path: "/admin/praktikum" },
  { label: "Monitor Real-Time", icon: ShieldAlert, path: "/admin/monitor", matchPrefix: "/admin/monitor" },
  { label: "Rekap & Ekspor CSV", icon: Download, path: "/admin/rekap" },
  { label: "Manajemen User", icon: Users, path: "/admin/users" },
];

export default function AdminTabs() {
  const location = useLocation();

  return (
    <nav className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-6">
        {tabs.map((tab) => {
          const isActive = tab.matchPrefix
            ? location.pathname.startsWith(tab.matchPrefix)
            : location.pathname === tab.path;

          return (
            <NavLink
              key={tab.label}
              to={tab.path}
              className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-4 font-mono text-xs font-semibold uppercase tracking-wider transition ${
                isActive
                  ? "border-brand-600 text-brand-700"
                  : "border-transparent text-slate-400 hover:text-slate-700"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
