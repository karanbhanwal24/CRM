import type { ReactNode } from "react";

type TableShellProps = {
  title: string;
  subtitle: string;
  controls?: ReactNode;
  children: ReactNode;
};

export function TableShell({ title, subtitle, controls, children }: TableShellProps) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <p className="mt-1 text-sm text-slate-300">{subtitle}</p>
        </div>
        {controls}
      </div>
      {children}
    </section>
  );
}
