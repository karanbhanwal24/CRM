import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ModuleLayout } from "../../components/crm/module-layout";
import { AssignRepresentativeModal } from "../../components/leads/assign-representative-modal";
import { Panel } from "../../components/ui/panel";
import { useAuth } from "../../context/auth-context";
import { useToast } from "../../context/toast-context";
import { apiClient } from "../../lib/api";
import type { PaginatedResponse } from "../../types/customer";
import type { Lead, LeadPriority, LeadSource, LeadStatus, SalesRepresentativeOption } from "../../types/lead";

export function LeadListPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [representatives, setRepresentatives] = useState<SalesRepresentativeOption[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isAssigning, setIsAssigning] = useState(false);
  const [error, setError] = useState("");

  const page = Number(searchParams.get("page") ?? "1");
  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status") ?? "";
  const priority = searchParams.get("priority") ?? "";
  const source = searchParams.get("source") ?? "";

  useEffect(() => {
    void Promise.all([loadLeads(), loadRepresentatives()]);
  }, [page, search, status, priority, source]);

  async function loadLeads() {
    setIsLoading(true);
    setError("");
    try {
      const response = await apiClient.get<PaginatedResponse<Lead>>("/leads/", {
        params: {
          page,
          search: search || undefined,
          status: status || undefined,
          priority: priority || undefined,
          source: source || undefined,
        },
      });
      setLeads(response.data.results);
      setCount(response.data.count);
    } catch {
      setError("Unable to load leads.");
    } finally {
      setIsLoading(false);
    }
  }

  async function loadRepresentatives() {
    try {
      const response = await apiClient.get<SalesRepresentativeOption[]>("/sales-representatives/options/");
      setRepresentatives(response.data);
    } catch {
      // Non-admin users may not need assignment controls.
    }
  }

  async function handleDelete(lead: Lead) {
    if (!window.confirm(`Delete ${lead.company_name}?`)) {
      return;
    }
    try {
      await apiClient.delete(`/leads/${lead.id}/`);
      showToast("Lead deleted.");
      void loadLeads();
    } catch {
      showToast("Unable to delete lead.", "error");
    }
  }

  async function handleAssign(representativeId: number | null) {
    if (!selectedLead) {
      return;
    }
    setIsAssigning(true);
    try {
      await apiClient.patch(`/leads/${selectedLead.id}/assign/`, { assigned_to_id: representativeId });
      showToast("Lead assignment updated.");
      setSelectedLead(null);
      void loadLeads();
    } catch {
      showToast("Unable to assign representative.", "error");
    } finally {
      setIsAssigning(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(count / 10));

  return (
    <ModuleLayout
      title="Lead Module"
      subtitle="RESTful lead management with search, filters, pagination, validation, and assignment."
      moduleLinks={[
        { to: "/customers", label: "Customers" },
        { to: "/sales-representatives", label: "Representatives" },
        { to: "/leads", label: "Leads" },
        { to: "/opportunities", label: "Opportunities" },
      ]}
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="grid gap-3 md:grid-cols-4">
          <input
            defaultValue={search}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                setSearchParams(buildParams({ search: event.currentTarget.value, status, priority, source, page: 1 }));
              }
            }}
            className={filterClassName}
            placeholder="Search company, contact, email..."
          />
          <select
            value={status}
            onChange={(event) =>
              setSearchParams(buildParams({ search, status: event.target.value, priority, source, page: 1 }))
            }
            className={filterClassName}
          >
            <option value="">All statuses</option>
            {(["NEW", "CONTACTED", "QUALIFIED", "UNQUALIFIED", "CONVERTED", "LOST"] as LeadStatus[]).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <select
            value={priority}
            onChange={(event) =>
              setSearchParams(buildParams({ search, status, priority: event.target.value, source, page: 1 }))
            }
            className={filterClassName}
          >
            <option value="">All priorities</option>
            {(["LOW", "MEDIUM", "HIGH", "URGENT"] as LeadPriority[]).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <select
            value={source}
            onChange={(event) =>
              setSearchParams(buildParams({ search, status, priority, source: event.target.value, page: 1 }))
            }
            className={filterClassName}
          >
            <option value="">All sources</option>
            {(["WEBSITE", "REFERRAL", "CAMPAIGN", "INBOUND", "OUTBOUND"] as LeadSource[]).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
        <Link to="/leads/new" className="rounded-2xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700">
          Add Lead
        </Link>
      </div>

      {isLoading ? (
        <Panel>Loading leads...</Panel>
      ) : error ? (
        <Panel>{error}</Panel>
      ) : (
        <Panel className="p-4">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-200">
              <thead className="text-xs uppercase tracking-[0.2em] text-slate-400">
                <tr>
                  <th className="px-3 py-3">Company</th>
                  <th className="px-3 py-3">Contact</th>
                  <th className="px-3 py-3">Source</th>
                  <th className="px-3 py-3">Priority</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Representative</th>
                  <th className="px-3 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id} className="border-t border-white/5">
                    <td className="px-3 py-4">{lead.company_name}</td>
                    <td className="px-3 py-4">{lead.contact_person}</td>
                    <td className="px-3 py-4">{lead.source}</td>
                    <td className="px-3 py-4">{lead.priority}</td>
                    <td className="px-3 py-4">{lead.status}</td>
                    <td className="px-3 py-4">{lead.representative?.name ?? "Unassigned"}</td>
                    <td className="px-3 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Link to={`/leads/${lead.id}`} className={actionLinkClassName}>
                          View
                        </Link>
                        <Link to={`/leads/${lead.id}/edit`} className={actionLinkClassName}>
                          Edit
                        </Link>
                        {user?.role === "ADMIN" ? (
                          <button type="button" onClick={() => setSelectedLead(lead)} className={actionLinkClassName}>
                            Assign
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => void handleDelete(lead)}
                          className="rounded-full border border-rose-400/20 px-3 py-1 text-xs text-rose-200 transition hover:bg-rose-500/10"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-slate-300">
              {count} lead{count === 1 ? "" : "s"}
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setSearchParams(buildParams({ search, status, priority, source, page: page - 1 }))}
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
                onClick={() => setSearchParams(buildParams({ search, status, priority, source, page: page + 1 }))}
                className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-100 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </Panel>
      )}

      <AssignRepresentativeModal
        isOpen={Boolean(selectedLead)}
        isSubmitting={isAssigning}
        representatives={representatives}
        currentRepresentativeId={selectedLead?.representative?.id}
        onClose={() => setSelectedLead(null)}
        onAssign={handleAssign}
      />
    </ModuleLayout>
  );
}

function buildParams(values: {
  search: string;
  status: string;
  priority: string;
  source: string;
  page: number;
}) {
  const params = new URLSearchParams();
  if (values.search) params.set("search", values.search);
  if (values.status) params.set("status", values.status);
  if (values.priority) params.set("priority", values.priority);
  if (values.source) params.set("source", values.source);
  params.set("page", String(values.page));
  return params;
}

const filterClassName =
  "rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-brand-500";
const actionLinkClassName =
  "rounded-full border border-white/10 px-3 py-1 text-xs text-slate-100 transition hover:bg-white/10";
