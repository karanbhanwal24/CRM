import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/auth-context";
import { Shell } from "../ui/shell";

type ModuleLayoutProps = {
  title: string;
  subtitle: string;
  moduleLinks?: Array<{ to: string; label: string }>;
  children: ReactNode;
};

export function ModuleLayout({ title, subtitle, moduleLinks = [], children }: ModuleLayoutProps) {
  const { logout } = useAuth();

  return (
    <Shell title={title} subtitle={subtitle}>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Link to="/" className={pillClassName}>
          Dashboard
        </Link>
        {moduleLinks.map((link) => (
          <Link key={link.to} to={link.to} className={pillClassName}>
            {link.label}
          </Link>
        ))}
        <button type="button" onClick={() => void logout()} className={pillClassName}>
          Logout
        </button>
      </div>
      {children}
    </Shell>
  );
}

const pillClassName =
  "rounded-full border border-black/5 bg-white/70 px-4 py-2 text-sm text-slate-700 transition hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10";
