import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ModuleLayout } from "../../components/crm/module-layout";
import { OpportunityForm, type OpportunityFormValues } from "../../components/opportunities/opportunity-form";
import { Panel } from "../../components/ui/panel";
import { useAuth } from "../../context/auth-context";
import { useToast } from "../../context/toast-context";
import { apiClient } from "../../lib/api";
import type { Lead, SalesRepresentativeOption } from "../../types/lead";
import type { Opportunity } from "../../types/opportunity";

export function OpportunityEditPage() {
  const { opportunityId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [ownerOptions, setOwnerOptions] = useState<SalesRepresentativeOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void Promise.all([loadOpportunity(), loadOwnerOptions()]);
  }, [opportunityId]);

  async function loadOpportunity() {
    try {
      const response = await apiClient.get<Opportunity>(`/opportunities/${opportunityId}/`);
      setOpportunity(response.data);
      setError("");
    } catch {
      setError("Unable to load opportunity.");
    } finally {
      setIsLoading(false);
    }
  }

  async function loadOwnerOptions() {
    try {
      const response = await apiClient.get<SalesRepresentativeOption[]>("/sales-representatives/options/");
      setOwnerOptions(response.data);
    } catch {
      showToast("Unable to load representative options.", "error");
    }
  }

  async function handleSubmit(values: OpportunityFormValues) {
    setIsSubmitting(true);
    try {
      await apiClient.put(`/opportunities/${opportunityId}/`, normalizePayload(values, user?.role === "ADMIN"));
      showToast("Opportunity updated.");
      navigate(`/opportunities/${opportunityId}`);
    } catch {
      showToast("Unable to update opportunity.", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ModuleLayout
      title="Edit Opportunity"
      subtitle="Update opportunity value, ownership, and stage while preserving conversion history."
      moduleLinks={[
        { to: "/customers", label: "Customers" },
        { to: "/sales-representatives", label: "Representatives" },
        { to: "/leads", label: "Leads" },
        { to: "/opportunities", label: "Opportunities" },
      ]}
    >
      {isLoading ? (
        <Panel>Loading opportunity...</Panel>
      ) : error || !opportunity ? (
        <Panel>{error || "Opportunity not found."}</Panel>
      ) : (
        <Panel>
          <OpportunityForm
            initialValues={opportunity}
            leads={[
              {
                id: opportunity.lead?.id ?? 0,
                company_name: opportunity.lead?.company_name ?? opportunity.customer.company_name,
                contact_person: opportunity.lead?.contact_person ?? opportunity.customer.contact_person,
                email: "",
                phone: "",
                source: "INBOUND",
                priority: opportunity.lead?.priority ?? "MEDIUM",
                status: opportunity.lead?.status ?? "QUALIFIED",
                representative: opportunity.owner,
                created_by_id: 0,
                created_at: opportunity.created_at,
                updated_at: opportunity.updated_at,
              } as Lead,
            ]}
            ownerOptions={ownerOptions}
            isSubmitting={isSubmitting}
            lockLead
            onSubmit={handleSubmit}
            submitLabel="Save Changes"
          />
        </Panel>
      )}
    </ModuleLayout>
  );
}

function normalizePayload(values: OpportunityFormValues, includeOwner: boolean) {
  return {
    title: values.title.trim(),
    lead_id: Number(values.lead_id),
    ...(includeOwner ? { owner_id: Number(values.owner_id) } : {}),
    stage: values.stage,
    amount: values.amount,
    probability: Number(values.probability),
    expected_close_date: values.expected_close_date || null,
  };
}
