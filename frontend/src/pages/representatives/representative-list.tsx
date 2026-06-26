import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ModuleLayout } from "../../components/crm/module-layout";
import { Panel } from "../../components/ui/panel";
import { useToast } from "../../context/toast-context";
import { apiClient } from "../../lib/api";
import type { PaginatedResponse } from "../../types/customer";
import type { RepresentativeStatus, SalesRepresentative } from "../../types/representative";

export function RepresentativeListPage() {
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [representatives, setRepresentatives] = useState<SalesRepresentative[]>([]);
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const page = Number(searchParams.get("page") ?? "1");
  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status") ?? "";

  useEffect(() => {
    void loadRepresentatives();
  }, [page, search, status]);

  async function loadRepresentatives() {
    setIsLoading(true);
    setError("");
    try {
      const response = await apiClient.get<PaginatedResponse<SalesRepresentative>>("/sales-representatives/", {
        params: {
          page,
          search: search || undefined,
          status: status || undefined,
        },
      });
      setRepresentatives(response.data.results);
      setCount(response.data.count);
    } catch {
      setError("Unable to load representatives.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDisable(representative: SalesRepresentative) {
    if (!window.confirm(`Disable ${representative.full_name}?`)) {
      return;
    }
    try {
      await apiClient.patch(`/sales-representatives/${representative.id}/disable/`, {});
      showToast("Representative disabled.");
      void loadRepresentatives();
    } catch {
      showToast("Unable to disable representative.", "error");
    }
  }

  const totalPages = Math.max(1, Math.ceil(count / 10));

  return (
    <ModuleLayout
      title="Sales Representative Module"
      subtitle="Admin-only sales representative management with account provisioning, search, pagination, and disable controls."
      moduleLinks={[
        { to: "/customers", label: "Customers" },
        { to: "/sales-representatives", label: "Representatives" },
        { to: "/leads", label: "Leads" },
      ]}
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="grid gap-3 md:grid-cols-2">
          <input
            defaultValue={search}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                setSearchParams(buildParams({ search: event.currentTarget.value, status, page: 1 }));
              }
            }}
            className={filterClassName}
            placeholder="Search employee, name, email..."
          />
          <select
            value={status}
            onChange={(event) => setSearchParams(buildParams({ search, status: event.target.value, page: 1 }))}
            className={filterClassName}
          >
            <option value="">All statuses</option>
            {(["ACTIVE", "ON_LEAVE", "INACTIVE"] as RepresentativeStatus[]).map((value) => (
              <option key={value} value={value}>
                {value.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>
        <Link
          to="/sales-representatives/new"
          className="rounded-2xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          Add Representative
        </Link>
      </div>

      {isLoading ? (
        <Panel>Loading representatives...</Panel>
      ) : error ? (
        <Panel>{error}</Panel>
      ) : (
        <Panel className="p-4">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-200">
              <thead className="text-xs uppercase tracking-[0.2em] text-slate-400">
                <tr>
                  <th className="px-3 py-3">Employee</th>
                  <th className="px-3 py-3">Representative</th>
                  <th className="px-3 py-3">Territory</th>
                  <th className="px-3 py-3">Manager</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Leads</th>
                  <th className="px-3 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {representatives.map((representative) => (
                  <tr key={representative.id} className="border-t border-white/5">
                    <td className="px-3 py-4">{representative.employee_id}</td>
                    <td className="px-3 py-4">
                      <div className="font-medium text-white">{representative.full_name}</div>
                      <div className="text-xs text-slate-400">{representative.email}</div>
                    </td>
                    <td className="px-3 py-4">{representative.territory || "-"}</td>
                    <td className="px-3 py-4">{representative.manager?.name ?? "-"}</td>
                    <td className="px-3 py-4">
                      <StatusBadge status={representative.status} />
                    </td>
                    <td className="px-3 py-4">{representative.lead_count}</td>
                    <td className="px-3 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Link to={`/sales-representatives/${representative.id}`} className={actionLinkClassName}>
                          View
                        </Link>
                        <Link to={`/sales-representatives/${representative.id}/edit`} className={actionLinkClassName}>
                          Edit
                        </Link>
                        {representative.status !== "INACTIVE" ? (
                          <button
                            type="button"
                            onClick={() => void handleDisable(representative)}
                            className="rounded-full border border-rose-400/20 px-3 py-1 text-xs text-rose-200 transition hover:bg-rose-500/10"
                          >
                            Disable
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-slate-300">
              {count} representative{count === 1 ? "" : "s"}
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setSearchParams(buildParams({ search, status, page: page - 1 }))}
                className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-100 disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-sm text-slate-300">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setSearchParams(buildParams({ search, status, page: page + 1 }))}
                className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-100 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </Panel>
      )}
    </ModuleLayout>
  );
}

function buildParams(values: { search: string; status: string; page: number }) {
  const params = new URLSearchParams();
  if (values.search) params.set("search", values.search);
  if (values.status) params.set("status", values.status);
  params.set("page", String(values.page));
  return params;
}

function StatusBadge({ status }: { status: RepresentativeStatus }) {
  const className =
    status === "ACTIVE"
      ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-200"
      : status === "ON_LEAVE"
        ? "border-amber-400/20 bg-amber-500/10 text-amber-200"
        : "border-slate-400/20 bg-slate-500/10 text-slate-200";

  return <span className={`rounded-full border px-3 py-1 text-xs font-medium ${className}`}>{status.replace("_", " ")}</span>;
}

const filterClassName =
  "rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-brand-500";

const actionLinkClassName =
  "rounded-full border border-white/10 px-3 py-1 text-xs text-slate-100 transition hover:bg-white/10";
