import { ChevronRight, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type Accent = "indigo" | "purple";

interface PortalCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  footer: ReactNode;
  accent: Accent;
  onClick: () => void;
}

const accentStyles: Record<Accent, { bar: string; iconBox: string; icon: string }> = {
  indigo: {
    bar: "from-brand-500 to-sky-400",
    iconBox: "bg-brand-50",
    icon: "text-brand-600",
  },
  purple: {
    bar: "from-purple-500 to-fuchsia-400",
    iconBox: "bg-purple-50",
    icon: "text-purple-600",
  },
};

export default function PortalCard({
  icon: Icon,
  title,
  description,
  footer,
  accent,
  onClick,
}: PortalCardProps) {
  const styles = accentStyles[accent];

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative w-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-8 text-left shadow-card transition hover:-translate-y-0.5 hover:shadow-card-hover"
    >
      <span
        className={`absolute inset-y-0 left-0 w-1 bg-gradient-to-b ${styles.bar}`}
        aria-hidden="true"
      />

      <ChevronRight
        className="absolute right-7 top-8 h-5 w-5 text-slate-300 transition group-hover:translate-x-1 group-hover:text-slate-400"
        aria-hidden="true"
      />

      <div className={`mb-6 flex h-12 w-12 items-center justify-center rounded-xl ${styles.iconBox}`}>
        <Icon className={`h-6 w-6 ${styles.icon}`} strokeWidth={2} />
      </div>

      <h3 className="mb-3 text-xl font-bold text-slate-900">{title}</h3>
      <p className="mb-8 leading-relaxed text-slate-500">{description}</p>

      <div className="border-t border-slate-100 pt-4 text-sm">{footer}</div>
    </button>
  );
}
