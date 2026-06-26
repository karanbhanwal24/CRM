import type { ReactNode } from "react";

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-slate-200 ${className}`}>{children}</div>;
}
