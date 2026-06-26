import { Link } from "react-router-dom";
import { Shell } from "../components/ui/shell";

export function ForbiddenPage() {
  return (
    <Shell title="Access Denied" subtitle="Your account does not have permission to access this page.">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur">
        <p className="text-sm text-slate-300">If you believe this is incorrect, verify your role or contact an administrator.</p>
        <Link
          to="/"
          className="mt-5 inline-flex rounded-2xl border border-white/10 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
        >
          Back to Dashboard
        </Link>
      </div>
    </Shell>
  );
}
