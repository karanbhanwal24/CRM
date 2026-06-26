import { PropsWithChildren } from "react";
import { Breadcrumbs } from "./breadcrumbs";
import { ThemeToggle } from "./theme-toggle";

type ShellProps = PropsWithChildren<{
  title: string;
  subtitle: string;
}>;

export function Shell({ title, subtitle, children }: ShellProps) {
  return (
    <main className="min-h-screen px-4 py-6 text-slate-900 transition-colors dark:text-slate-100 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-4 flex justify-end">
          <ThemeToggle />
        </div>
        <Breadcrumbs />
        <header className="mb-8 flex flex-col gap-4 lg:mb-10">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.35em] text-brand-700 dark:text-brand-100/80">
            CRM Lite
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-4xl">{title}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">{subtitle}</p>
        </header>
        {children}
      </div>
    </main>
  );
}
