import { Link } from "react-router-dom";
import { Panel } from "./panel";
import { Skeleton } from "./skeleton";

export function PageSectionSkeleton({
  lines = 4,
  showHeader = true,
}: {
  lines?: number;
  showHeader?: boolean;
}) {
  return (
    <Panel>
      <div className="grid gap-4">
        {showHeader ? <Skeleton className="h-6 w-48" /> : null}
        {Array.from({ length: lines }).map((_, index) => (
          <Skeleton key={index} className="h-12 w-full" />
        ))}
      </div>
    </Panel>
  );
}

export function ErrorState({
  title = "Something went wrong",
  message,
  actionLabel,
  actionTo,
}: {
  title?: string;
  message: string;
  actionLabel?: string;
  actionTo?: string;
}) {
  return (
    <Panel className="text-center">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <p className="mt-2 text-sm text-slate-300">{message}</p>
      {actionLabel && actionTo ? (
        <Link
          to={actionTo}
          className="mt-5 inline-flex rounded-2xl border border-white/10 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
        >
          {actionLabel}
        </Link>
      ) : null}
    </Panel>
  );
}

export function EmptyState({
  title,
  message,
  actionLabel,
  actionTo,
}: {
  title: string;
  message: string;
  actionLabel?: string;
  actionTo?: string;
}) {
  return (
    <Panel className="border-dashed text-center">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <p className="mt-2 text-sm text-slate-300">{message}</p>
      {actionLabel && actionTo ? (
        <Link
          to={actionTo}
          className="mt-5 inline-flex rounded-2xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          {actionLabel}
        </Link>
      ) : null}
    </Panel>
  );
}
