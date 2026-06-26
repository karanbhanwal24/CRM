import type { ChartDatum } from "../../types/dashboard";

type BarChartProps = {
  title: string;
  subtitle: string;
  data: ChartDatum[];
};

export function BarChart({ title, subtitle, data }: BarChartProps) {
  const maxValue = Math.max(...data.map((item) => item.value), 1);

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
      <header className="mb-5">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <p className="mt-1 text-sm text-slate-300">{subtitle}</p>
      </header>
      <div className="grid gap-4">
        {data.length ? (
          data.map((item) => (
            <div key={item.label} className="grid gap-2">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em] text-slate-300">
                <span>{item.label}</span>
                <span>{item.value}</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-900/80">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#68d391_0%,#38b2ac_100%)]"
                  style={{ width: `${(item.value / maxValue) * 100}%` }}
                />
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-300">No chart data available.</p>
        )}
      </div>
    </section>
  );
}
