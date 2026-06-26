import type { DashboardMetric } from "../../types/dashboard";

export function DashboardCard({ metric }: { metric: DashboardMetric }) {
  return (
    <article className="rounded-3xl border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-5 backdrop-blur">
      <p className="text-xs uppercase tracking-[0.25em] text-brand-100/80">{metric.label}</p>
      <p className="mt-4 text-4xl font-semibold tracking-tight text-white">{metric.value.toLocaleString()}</p>
      {metric.detail ? <p className="mt-3 text-sm text-slate-300">{metric.detail}</p> : null}
    </article>
  );
}
