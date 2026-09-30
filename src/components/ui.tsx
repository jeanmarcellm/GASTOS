import type { ReactNode } from "react";

export const inputCls =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:bg-zinc-100";
export const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60";
export const btnGhost =
  "inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900";

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

export function Card({
  title,
  action,
  children,
  className = "",
}: {
  title?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-xl border border-zinc-200 bg-white p-5 shadow-sm ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="text-sm font-semibold text-zinc-800">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

const TONES = {
  default: "text-zinc-900",
  positive: "text-emerald-600",
  negative: "text-red-600",
  muted: "text-zinc-500",
};

export function Stat({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: ReactNode;
  tone?: keyof typeof TONES;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</p>
      <p className={`mt-1 text-2xl font-semibold tabular-nums ${TONES[tone]}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-zinc-500">{hint}</p>}
    </div>
  );
}

export function Field({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={`flex flex-col gap-1 text-sm ${className}`}>
      <span className="font-medium text-zinc-700">{label}</span>
      {children}
    </label>
  );
}

export function Progress({ value, color }: { value: number; color?: string }) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  const auto = value > 1 ? "#dc2626" : value >= 0.8 ? "#f59e0b" : "#10b981";
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100">
      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color ?? auto }} />
    </div>
  );
}

export function Dot({ color }: { color: string }) {
  return <span className="inline-block size-2.5 shrink-0 rounded-full" style={{ background: color }} />;
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-lg border border-dashed border-zinc-200 p-6 text-center text-sm text-zinc-500">{children}</p>;
}

export function Badge({ children, tone = "zinc" }: { children: ReactNode; tone?: "zinc" | "emerald" | "amber" | "red" | "sky" }) {
  const tones = {
    zinc: "bg-zinc-100 text-zinc-700",
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
    sky: "bg-sky-50 text-sky-700",
  };
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${tones[tone]}`}>{children}</span>;
}
