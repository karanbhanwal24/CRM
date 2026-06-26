import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ModuleLayout } from "../../components/crm/module-layout";
import { Panel } from "../../components/ui/panel";
import { useToast } from "../../context/toast-context";
import { apiClient } from "../../lib/api";
import type { RepresentativeStatus, SalesRepresentative } from "../../types/representative";

export function RepresentativeDetailsPage() {
  const { representativeId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [representative, setRepresentative] = useState<SalesRepresentative | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void loadRepresentative();
  }, [representativeId]);

  async function loadRepresentative() {
    setIsLoading(true);
    setError("");
    try {
      const response = await apiClient.get<SalesRepresentative>(`/sales-representatives/${representativeId}/`);
      setRepresentative(response.data);
    } catch {
      setError("Unable to load representative details.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDisable() {
    if (!representative || !window.confirm(`Disable ${representative.full_name}?`)) {
      return;
    }
    try {
      await apiClient.patch(`/sales-representatives/${representative.id}/disable/`, {});
      showToast("Representative disabled.");
      navigate("/sales-representatives");
    } catch {
      showToast("Unable to disable representative.", "error");
    }
  }

  return (
    <ModuleLayout
      title={representative?.full_name ?? "Representative Details"}
      subtitle="Review the sales account, reporting structure, and current availability for a single representative."
      moduleLinks={[
        { to: "/customers", label: "Customers" },
        { to: "/sales-representatives", label: "Representatives" },
        { to: "/leads", label: "Leads" },
      ]}
    >
      {isLoading ? (
        <Panel>Loading representative details...</Panel>
      ) : error || !representative ? (
        <Panel>{error || "Representative not found."}</Panel>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_auto]">
          <Panel>
            <dl className="grid gap-5 md:grid-cols-2">
              <Detail label="Name" value={representative.full_name} />
              <Detail label="Email" value={representative.email} />
              <Detail label="Phone" value={representative.phone_number || "-"} />
              <Detail label="Employee ID" value={representative.employee_id} />
              <Detail label="Territory" value={representative.territory || "-"} />
              <Detail label="Status" value={formatStatus(representative.status)} />
              <Detail label="Account State" value={representative.is_active ? "Active" : "Disabled"} />
              <Detail label="Commission Rate" value={`${representative.commission_rate}%`} />
              <Detail label="Manager" value={representative.manager?.name ?? "-"} />
              <Detail label="Direct Reports" value={String(representative.direct_reports_count)} />
              <Detail label="Assigned Leads" value={String(representative.lead_count)} />
              <Detail
                label="Hire Date"
                value={representative.hired_at ? new Date(representative.hired_at).toLocaleDateString() : "-"}
              />
              <Detail label="Created At" value={new Date(representative.created_at).toLocaleString()} />
              <Detail label="Updated At" value={new Date(representative.updated_at).toLocaleString()} />
            </dl>
          </Panel>
          <div className="flex flex-col gap-3">
            <Link
              to={`/sales-representatives/${representative.id}/edit`}
              className="rounded-2xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              Edit Representative
            </Link>
            {representative.status !== "INACTIVE" ? (
              <button
                type="button"
                onClick={() => void handleDisable()}
                className="rounded-2xl border border-rose-400/20 px-5 py-3 text-sm font-semibold text-rose-100 transition hover:bg-rose-500/10"
              >
                Disable Representative
              </button>
            ) : null}
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

function formatStatus(status: RepresentativeStatus) {
  return status.replace("_", " ");
}
