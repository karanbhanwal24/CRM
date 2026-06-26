import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ModuleLayout } from "../../components/crm/module-layout";
import { Panel } from "../../components/ui/panel";
import { useToast } from "../../context/toast-context";
import { apiClient } from "../../lib/api";
import type { Lead } from "../../types/lead";

export function LeadDetailsPage() {
  const { leadId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [lead, setLead] = useState<Lead | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void loadLead();
  }, [leadId]);

  async function loadLead() {
    setIsLoading(true);
    setError("");
    try {
      const response = await apiClient.get<Lead>(`/leads/${leadId}/`);
      setLead(response.data);
    } catch {
      setError("Unable to load lead details.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete() {
    if (!lead || !window.confirm(`Delete ${lead.company_name}?`)) {
      return;
    }
    try {
      await apiClient.delete(`/leads/${lead.id}/`);
      showToast("Lead deleted.");
      navigate("/leads");
    } catch {
      showToast("Unable to delete lead.", "error");
    }
  }

  return (
    <ModuleLayout
      title={lead?.company_name ?? "Lead Details"}
      subtitle="View lead information, assignment state, and management actions."
      moduleLinks={[
        { to: "/customers", label: "Customers" },
        { to: "/leads", label: "Leads" },
        { to: "/opportunities", label: "Opportunities" },
      ]}
    >
      {isLoading ? (
        <Panel>Loading lead details...</Panel>
      ) : error || !lead ? (
        <Panel>{error || "Lead not found."}</Panel>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_auto]">
          <Panel>
            <dl className="grid gap-5 md:grid-cols-2">
              <Detail label="Company" value={lead.company_name} />
              <Detail label="Contact" value={lead.contact_person} />
              <Detail label="Email" value={lead.email || "-"} />
              <Detail label="Phone" value={lead.phone || "-"} />
              <Detail label="Source" value={lead.source} />
              <Detail label="Priority" value={lead.priority} />
              <Detail label="Status" value={lead.status} />
              <Detail label="Representative" value={lead.representative?.name ?? "Unassigned"} />
            </dl>
          </Panel>
          <div className="flex flex-col gap-3">
            {lead.status !== "CONVERTED" ? (
              <Link
                to={`/opportunities/new?leadId=${lead.id}`}
                className="rounded-2xl border border-white/10 px-5 py-3 text-center text-sm font-semibold text-slate-100 transition hover:bg-white/10"
              >
                Convert to Opportunity
              </Link>
            ) : null}
            <Link to={`/leads/${lead.id}/edit`} className="rounded-2xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700">
              Edit Lead
            </Link>
            <button
              type="button"
              onClick={() => void handleDelete()}
              className="rounded-2xl border border-rose-400/20 px-5 py-3 text-sm font-semibold text-rose-100 transition hover:bg-rose-500/10"
            >
              Delete Lead
            </button>
          </div>
        </div>
      )}
    </ModuleLayout>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="mb-1 text-xs uppercase tracking-[0.25em] text-slate-400">{label}</dt>
      <dd className="text-sm text-slate-100">{value}</dd>
    </div>
  );
}
