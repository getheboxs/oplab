import type { LucideIcon } from "lucide-react";

type Accent = "rose" | "emerald" | "amber" | "violet";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  caption: string;
  accent: Accent;
  captionTone?: "default" | "danger";
}

const barStyles: Record<Accent, string> = {
  rose: "from-rose-500 to-pink-400",
  emerald: "from-emerald-500 to-teal-400",
  amber: "from-amber-500 to-orange-400",
  violet: "from-violet-500 to-indigo-400",
};

const iconBoxStyles: Record<Accent, string> = {
  rose: "bg-rose-50 text-rose-600",
  emerald: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  violet: "bg-violet-50 text-violet-600",
};

export default function StatCard({
  icon: Icon,
  label,
  value,
  caption,
  accent,
  captionTone = "default",
}: StatCardProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
      <span
        className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${barStyles[accent]}`}
        aria-hidden="true"
      />

      <div className="mb-6 flex items-center justify-between">
        <p className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-400">
          {label}
        </p>
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${iconBoxStyles[accent]}`}>
          <Icon className="h-4.5 w-4.5" strokeWidth={2} />
        </div>
      </div>

      <p className="text-4xl font-extrabold text-slate-900">{value}</p>
      <p
        className={`mt-2 text-sm ${
          captionTone === "danger" ? "text-rose-500" : "text-slate-500"
        }`}
      >
        {caption}
      </p>
    </div>
  );
}
