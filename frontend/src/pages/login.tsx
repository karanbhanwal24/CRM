import { FormEvent, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ThemeToggle } from "../components/ui/theme-toggle";
import { useAuth } from "../context/auth-context";

type LocationState = {
  from?: {
    pathname?: string;
  };
};

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await login({ email, password });
      const destination = (location.state as LocationState | null)?.from?.pathname ?? "/";
      navigate(destination, { replace: true });
    } catch {
      setError("Invalid email or password.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen px-4 py-6 text-slate-900 dark:text-slate-100 sm:px-6 sm:py-8">
      <div className="mx-auto mb-6 flex max-w-5xl justify-end">
        <ThemeToggle />
      </div>
      <div className="mx-auto grid min-h-[80vh] max-w-5xl items-center gap-10 lg:grid-cols-[1.2fr_0.8fr]">
        <section>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.35em] text-brand-700 dark:text-brand-100/80">
            CRM Lite Authentication
          </p>
          <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-5xl">
            Secure sign-in for administrators and sales representatives.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            JWT access and refresh tokens, persistent login, role-aware route protection, and automatic token refresh
            are wired into this foundation.
          </p>
        </section>

        <section className="rounded-3xl border border-black/5 bg-white/80 p-8 shadow-2xl shadow-black/10 backdrop-blur dark:border-white/10 dark:bg-white/5">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 dark:border-white/10 dark:bg-slate-950/60 dark:text-white"
                placeholder="admin@example.com"
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 dark:border-white/10 dark:bg-slate-950/60 dark:text-white"
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />
            </div>

            {error ? <p className="text-sm text-rose-300">{error}</p> : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-2xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
