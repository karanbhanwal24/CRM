import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ModuleLayout } from "../../components/crm/module-layout";
import { Panel } from "../../components/ui/panel";
import { useAuth } from "../../context/auth-context";
import { useToast } from "../../context/toast-context";
import { apiClient } from "../../lib/api";
import type { PaginatedResponse } from "../../types/customer";
import type { Opportunity, OpportunityStage } from "../../types/opportunity";

export function OpportunityListPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const page = Number(searchParams.get("page") ?? "1");
  const search = searchParams.get("search") ?? "";
  const stage = searchParams.get("stage") ?? "";

  useEffect(() => {
    void loadOpportunities();
  }, [page, search, stage]);

  async function loadOpportunities() {
    setIsLoading(true);
    setError("");
    try {
      const response = await apiClient.get<PaginatedResponse<Opportunity>>("/opportunities/", {
        params: {
          page,
          search: search || undefined,
          stage: stage || undefined,
        },
      });
      setOpportunities(response.data.results);
      setCount(response.data.count);
    } catch {
      setError("Unable to load opportunities.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete(opportunity: Opportunity) {
    if (!window.confirm(`Delete ${opportunity.title}?`)) {
      return;
    }
    try {
      await apiClient.delete(`/opportunities/${opportunity.id}/`);
      showToast("Opportunity deleted.");
      void loadOpportunities();
    } catch {
      showToast("Unable to delete opportunity.", "error");
    }
  }

  const totalPages = Math.max(1, Math.ceil(count / 10));

  return (
    <ModuleLayout
      title="Opportunity Module"
      subtitle="Lead conversion, stage progression, and follow-up tracking for active deals."
      moduleLinks={[
        { to: "/customers", label: "Customers" },
        { to: "/sales-representatives", label: "Representatives" },
        { to: "/leads", label: "Leads" },
        { to: "/opportunities", label: "Opportunities" },
      ]}
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="grid gap-3 md:grid-cols-2">
          <input
            defaultValue={search}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                setSearchParams(buildParams({ search: event.currentTarget.value, stage, page: 1 }));
              }
            }}
            className={filterClassName}
            placeholder="Search title, company, representative..."
          />
          <select
            value={stage}
            onChange={(event) => setSearchParams(buildParams({ search, stage: event.target.value, page: 1 }))}
            className={filterClassName}
          >
            <option value="">All stages</option>
            {(["QUALIFICATION", "PROPOSAL", "NEGOTIATION", "WON", "LOST"] as OpportunityStage[]).map((value) => (
              <option key={value} value={value}>
                {value.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>
        <Link
          to="/opportunities/new"
          className="rounded-2xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          Convert Lead
        </Link>
      </div>

      {isLoading ? (
        <Panel>Loading opportunities...</Panel>
      ) : error ? (
        <Panel>{error}</Panel>
      ) : (
        <Panel className="p-4">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-200">
              <thead className="text-xs uppercase tracking-[0.2em] text-slate-400">
                <tr>
                  <th className="px-3 py-3">Title</th>
                  <th className="px-3 py-3">Customer</th>
                  <th className="px-3 py-3">Representative</th>
                  <th className="px-3 py-3">Stage</th>
                  <th className="px-3 py-3">Amount</th>
                  <th className="px-3 py-3">Follow-ups</th>
                  <th className="px-3 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {opportunities.map((opportunity) => (
                  <tr key={opportunity.id} className="border-t border-white/5">
                    <td className="px-3 py-4">
                      <div className="font-medium text-white">{opportunity.title}</div>
                      <div className="text-xs text-slate-400">
                        {opportunity.lead?.company_name ?? opportunity.customer.company_name}
                      </div>
                    </td>
                    <td className="px-3 py-4">{opportunity.customer.company_name}</td>
                    <td className="px-3 py-4">{opportunity.owner.name}</td>
                    <td className="px-3 py-4">
                      <StageBadge stage={opportunity.stage} />
                    </td>
                    <td className="px-3 py-4">${Number(opportunity.amount).toLocaleString()}</td>
                    <td className="px-3 py-4">{opportunity.follow_up_count}</td>
                    <td className="px-3 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Link to={`/opportunities/${opportunity.id}`} className={actionLinkClassName}>
                          View
                        </Link>
                        <Link to={`/opportunities/${opportunity.id}/edit`} className={actionLinkClassName}>
                          Edit
                        </Link>
                        {user?.role === "ADMIN" ? (
                          <button
                            type="button"
                            onClick={() => void handleDelete(opportunity)}
                            className="rounded-full border border-rose-400/20 px-3 py-1 text-xs text-rose-200 transition hover:bg-rose-500/10"
                          >
                            Delete
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
              {count} opportunity{count === 1 ? "" : "ies"}
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setSearchParams(buildParams({ search, stage, page: page - 1 }))}
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
                onClick={() => setSearchParams(buildParams({ search, stage, page: page + 1 }))}
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

function buildParams(values: { search: string; stage: string; page: number }) {
  const params = new URLSearchParams();
  if (values.search) params.set("search", values.search);
  if (values.stage) params.set("stage", values.stage);
  params.set("page", String(values.page));
  return params;
}

function StageBadge({ stage }: { stage: OpportunityStage }) {
  const className =
    stage === "WON"
      ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-200"
      : stage === "LOST"
        ? "border-rose-400/20 bg-rose-500/10 text-rose-200"
        : "border-sky-400/20 bg-sky-500/10 text-sky-200";

  return <span className={`rounded-full border px-3 py-1 text-xs font-medium ${className}`}>{stage}</span>;
}

const filterClassName =
  "rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-brand-500";

const actionLinkClassName =
  "rounded-full border border-white/10 px-3 py-1 text-xs text-slate-100 transition hover:bg-white/10";
