import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AddFollowUpModal, type FollowUpFormValues } from "../../components/opportunities/add-follow-up-modal";
import { ModuleLayout } from "../../components/crm/module-layout";
import { Panel } from "../../components/ui/panel";
import { useAuth } from "../../context/auth-context";
import { useToast } from "../../context/toast-context";
import { apiClient } from "../../lib/api";
import type { SalesRepresentativeOption } from "../../types/lead";
import type { Opportunity, OpportunityFollowUp, OpportunityStage } from "../../types/opportunity";

export function OpportunityDetailsPage() {
  const { opportunityId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [representatives, setRepresentatives] = useState<SalesRepresentativeOption[]>([]);
  const [selectedStage, setSelectedStage] = useState<OpportunityStage>("QUALIFICATION");
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingStage, setIsSavingStage] = useState(false);
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [isSubmittingFollowUp, setIsSubmittingFollowUp] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void Promise.all([loadOpportunity(), loadRepresentatives()]);
  }, [opportunityId]);

  async function loadOpportunity() {
    setIsLoading(true);
    setError("");
    try {
      const response = await apiClient.get<Opportunity>(`/opportunities/${opportunityId}/`);
      setOpportunity(response.data);
      setSelectedStage(response.data.stage);
    } catch {
      setError("Unable to load opportunity details.");
    } finally {
      setIsLoading(false);
    }
  }

  async function loadRepresentatives() {
    try {
      const response = await apiClient.get<SalesRepresentativeOption[]>("/sales-representatives/options/");
      setRepresentatives(response.data);
    } catch {
      // Keep modal unavailable if options cannot load.
    }
  }

  async function handleDelete() {
    if (!opportunity || !window.confirm(`Delete ${opportunity.title}?`)) {
      return;
    }
    try {
      await apiClient.delete(`/opportunities/${opportunity.id}/`);
      showToast("Opportunity deleted.");
      navigate("/opportunities");
    } catch {
      showToast("Unable to delete opportunity.", "error");
    }
  }

  async function handleStageUpdate() {
    if (!opportunity) {
      return;
    }
    setIsSavingStage(true);
    try {
      const response = await apiClient.patch<Opportunity>(`/opportunities/${opportunity.id}/stage/`, {
        stage: selectedStage,
      });
      setOpportunity(response.data);
      showToast("Opportunity stage updated.");
    } catch {
      showToast("Unable to update opportunity stage.", "error");
    } finally {
      setIsSavingStage(false);
    }
  }

  async function handleFollowUpSubmit(values: FollowUpFormValues) {
    if (!opportunity) {
      return;
    }
    setIsSubmittingFollowUp(true);
    try {
      await apiClient.post(`/opportunities/${opportunity.id}/follow-ups/`, {
        subject: values.subject.trim(),
        notes: values.notes.trim(),
        follow_up_type: values.follow_up_type,
        status: values.status,
        scheduled_at: new Date(values.scheduled_at).toISOString(),
        assigned_to_id: Number(values.assigned_to_id),
      });
      showToast("Follow-up added.");
      setIsFollowUpModalOpen(false);
      void loadOpportunity();
    } catch {
      showToast("Unable to add follow-up.", "error");
    } finally {
      setIsSubmittingFollowUp(false);
    }
  }

  const canMutate = useMemo(() => {
    if (!opportunity || !user) {
      return false;
    }
    return user.role === "ADMIN" || opportunity.owner.user_id === user.id;
  }, [opportunity, user]);

  const followUps = useMemo(
    () =>
      [...(opportunity?.follow_up_history ?? [])].sort(
        (left, right) => new Date(right.scheduled_at).getTime() - new Date(left.scheduled_at).getTime()
      ),
    [opportunity]
  );

  return (
    <ModuleLayout
      title={opportunity?.title ?? "Opportunity Details"}
      subtitle="Track deal stage, ownership, and follow-up history from a single opportunity view."
      moduleLinks={[
        { to: "/customers", label: "Customers" },
        { to: "/sales-representatives", label: "Representatives" },
        { to: "/leads", label: "Leads" },
        { to: "/opportunities", label: "Opportunities" },
      ]}
    >
      {isLoading ? (
        <Panel>Loading opportunity details...</Panel>
      ) : error || !opportunity ? (
        <Panel>{error || "Opportunity not found."}</Panel>
      ) : (
        <div className="grid gap-6">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <Panel>
              <dl className="grid gap-5 md:grid-cols-2">
                <Detail label="Title" value={opportunity.title} />
                <Detail label="Customer" value={opportunity.customer.company_name} />
                <Detail label="Lead" value={opportunity.lead?.company_name ?? "-"} />
                <Detail label="Representative" value={opportunity.owner.name} />
                <Detail label="Stage" value={opportunity.stage} />
                <Detail label="Amount" value={`$${Number(opportunity.amount).toLocaleString()}`} />
                <Detail label="Probability" value={`${opportunity.probability}%`} />
                <Detail
                  label="Expected Close"
                  value={opportunity.expected_close_date ? new Date(opportunity.expected_close_date).toLocaleDateString() : "-"}
                />
                <Detail
                  label="Closed At"
                  value={opportunity.closed_at ? new Date(opportunity.closed_at).toLocaleString() : "-"}
                />
                <Detail label="Follow-ups" value={String(opportunity.follow_up_count)} />
              </dl>
            </Panel>
            <Panel>
              <div className="grid gap-4">
                <div>
                  <p className="mb-2 text-xs uppercase tracking-[0.25em] text-slate-400">Stage Update</p>
                  <div className="flex flex-col gap-3">
                    <select
                      value={selectedStage}
                      onChange={(event) => setSelectedStage(event.target.value as OpportunityStage)}
                      disabled={!canMutate}
                      className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition focus:border-brand-500 disabled:opacity-60"
                    >
                      {(["QUALIFICATION", "PROPOSAL", "NEGOTIATION", "WON", "LOST"] as OpportunityStage[]).map((stage) => (
                        <option key={stage} value={stage}>
                          {stage.replace("_", " ")}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => void handleStageUpdate()}
                      disabled={!canMutate || isSavingStage}
                      className="rounded-2xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-70"
                    >
                      {isSavingStage ? "Saving..." : "Update Stage"}
                    </button>
                  </div>
                </div>
                <Link
                  to={`/opportunities/${opportunity.id}/edit`}
                  className="rounded-2xl border border-white/10 px-5 py-3 text-center text-sm font-semibold text-slate-100 transition hover:bg-white/10"
                >
                  Edit Opportunity
                </Link>
                <button
                  type="button"
                  onClick={() => setIsFollowUpModalOpen(true)}
                  disabled={!canMutate}
                  className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/10 disabled:opacity-70"
                >
                  Add Follow-up
                </button>
                {user?.role === "ADMIN" ? (
                  <button
                    type="button"
                    onClick={() => void handleDelete()}
                    className="rounded-2xl border border-rose-400/20 px-5 py-3 text-sm font-semibold text-rose-100 transition hover:bg-rose-500/10"
                  >
                    Delete Opportunity
                  </button>
                ) : null}
              </div>
            </Panel>
          </div>

          <Panel>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">Follow-up Timeline</h2>
                <p className="mt-1 text-sm text-slate-300">Scheduled history and notes for the current opportunity.</p>
              </div>
            </div>
            <div className="grid gap-4">
              {followUps.length ? (
                followUps.map((followUp) => <TimelineEntry key={followUp.id} followUp={followUp} />)
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 p-5 text-sm text-slate-300">
                  No follow-up history yet.
                </div>
              )}
            </div>
          </Panel>
        </div>
      )}

      <AddFollowUpModal
        isOpen={isFollowUpModalOpen}
        isSubmitting={isSubmittingFollowUp}
        ownerId={opportunity?.owner.id}
        representatives={representatives}
        onClose={() => setIsFollowUpModalOpen(false)}
        onSubmit={handleFollowUpSubmit}
      />
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

function TimelineEntry({ followUp }: { followUp: OpportunityFollowUp }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-white">{followUp.subject}</h3>
          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">
            {followUp.follow_up_type} • {followUp.status}
          </p>
        </div>
        <p className="text-xs text-slate-400">{new Date(followUp.scheduled_at).toLocaleString()}</p>
      </div>
      <p className="mt-3 text-sm text-slate-200">{followUp.notes || "No notes provided."}</p>
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-400">
        <span>Assigned to {followUp.assigned_to.name}</span>
        <span>Created by {followUp.created_by_name}</span>
        {followUp.completed_at ? <span>Completed {new Date(followUp.completed_at).toLocaleString()}</span> : null}
      </div>
    </article>
  );
}
