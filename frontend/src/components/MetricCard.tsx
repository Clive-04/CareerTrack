import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type MetricTone = "blue" | "indigo" | "violet" | "amber" | "emerald";

const tones: Record<MetricTone, { header: string; icon: string }> = {
  blue: {
    header: "border-blue-100 bg-blue-50 text-blue-950",
    icon: "bg-white/80 text-blue-600 ring-blue-200",
  },
  indigo: {
    header: "border-indigo-100 bg-indigo-50 text-indigo-950",
    icon: "bg-white/80 text-indigo-600 ring-indigo-200",
  },
  violet: {
    header: "border-violet-100 bg-violet-50 text-violet-950",
    icon: "bg-white/80 text-violet-600 ring-violet-200",
  },
  amber: {
    header: "border-amber-100 bg-amber-50 text-amber-950",
    icon: "bg-white/80 text-amber-700 ring-amber-200",
  },
  emerald: {
    header: "border-emerald-100 bg-emerald-50 text-emerald-950",
    icon: "bg-white/80 text-emerald-600 ring-emerald-200",
  },
};

export default function MetricCard({
  label,
  value,
  icon: Icon,
  tone = "indigo",
  compactValue = false,
}: {
  label: string;
  value: ReactNode;
  icon: LucideIcon;
  tone?: MetricTone;
  compactValue?: boolean;
}) {
  const style = tones[tone];

  return (
    <article className="metric-card overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className={`flex items-center justify-between gap-4 border-b px-5 py-3 ${style.header}`}>
        <p className="text-sm font-semibold">{label}</p>
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset ${style.icon}`}
        >
          <Icon className="metric-card-icon" size={18} strokeWidth={1.9} aria-hidden="true" />
        </span>
      </div>
      <div className="px-5 py-4">
        <p
          className={`${compactValue ? "truncate text-xl" : "text-3xl"} font-semibold tabular-nums tracking-[-0.035em] text-slate-950`}
          title={typeof value === "string" ? value : undefined}
        >
          {value}
        </p>
      </div>
    </article>
  );
}
