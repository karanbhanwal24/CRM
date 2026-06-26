import { Link } from "react-router-dom";
import { Shell } from "../components/ui/shell";

export function NotFoundPage() {
  return (
    <Shell title="Page Not Found" subtitle="The page you requested does not exist or is no longer available.">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur">
        <p className="text-sm text-slate-300">Check the URL or head back to the dashboard.</p>
        <Link
          to="/"
          className="mt-5 inline-flex rounded-2xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          Return to Dashboard
        </Link>
      </div>
    </Shell>
  );
}
