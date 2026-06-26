import type { ChartDatum } from "../../types/dashboard";

type DonutChartProps = {
  title: string;
  subtitle: string;
  data: ChartDatum[];
};

const palette = ["#68d391", "#38b2ac", "#f6ad55", "#63b3ed", "#fc8181", "#b794f4"];

export function DonutChart({ title, subtitle, data }: DonutChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let cumulative = 0;

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
      <header className="mb-5">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <p className="mt-1 text-sm text-slate-300">{subtitle}</p>
      </header>
      <div className="grid gap-6 lg:grid-cols-[220px_1fr] lg:items-center">
        <div className="mx-auto">
          <svg viewBox="0 0 120 120" className="h-56 w-56">
            <circle cx="60" cy="60" r="38" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="18" />
            {total
              ? data.map((item, index) => {
                  const fraction = item.value / total;
                  const dash = fraction * 238.76;
                  const offset = 238.76 - cumulative * 238.76;
                  cumulative += fraction;

                  return (
                    <circle
                      key={item.label}
                      cx="60"
                      cy="60"
                      r="38"
                      fill="none"
                      stroke={palette[index % palette.length]}
                      strokeDasharray={`${dash} 238.76`}
                      strokeDashoffset={offset}
                      strokeLinecap="round"
                      strokeWidth="18"
                      transform="rotate(-90 60 60)"
                    />
                  );
                })
              : null}
            <text x="60" y="56" textAnchor="middle" className="fill-white text-[11px] uppercase tracking-[0.2em]">
              Total
            </text>
            <text x="60" y="72" textAnchor="middle" className="fill-white text-xl font-semibold">
              {total}
            </text>
          </svg>
        </div>
        <div className="grid gap-3">
          {data.length ? (
            data.map((item, index) => (
              <div key={item.label} className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: palette[index % palette.length] }} />
                  <span className="text-sm text-slate-100">{item.label}</span>
                </div>
                <span className="text-sm font-medium text-white">{item.value}</span>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-300">No chart data available.</p>
          )}
        </div>
      </div>
    </section>
  );
}
