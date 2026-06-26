import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ModuleLayout } from "../../components/crm/module-layout";
import { OpportunityForm, type OpportunityFormValues } from "../../components/opportunities/opportunity-form";
import { Panel } from "../../components/ui/panel";
import { useAuth } from "../../context/auth-context";
import { useToast } from "../../context/toast-context";
import { apiClient } from "../../lib/api";
import type { Lead, SalesRepresentativeOption } from "../../types/lead";
import type { Opportunity } from "../../types/opportunity";
import type { PaginatedResponse } from "../../types/customer";

export function OpportunityCreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [ownerOptions, setOwnerOptions] = useState<SalesRepresentativeOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedLeadId = searchParams.get("leadId") ?? "";

  useEffect(() => {
    void Promise.all([loadLeads(), loadOwnerOptions()]);
  }, []);

  async function loadLeads() {
    try {
      const response = await apiClient.get<PaginatedResponse<Lead>>("/leads/", { params: { page_size: 100 } });
      setLeads(response.data.results.filter((lead) => lead.status !== "CONVERTED"));
    } catch {
      showToast("Unable to load lead options.", "error");
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
      const response = await apiClient.post<Opportunity>("/opportunities/", normalizePayload(values, user?.role === "ADMIN"));
      showToast("Opportunity created.");
      navigate(`/opportunities/${response.data.id}`);
    } catch {
      showToast("Unable to create opportunity.", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  const initialLead = selectedLeadId ? leads.find((lead) => String(lead.id) === selectedLeadId) : undefined;

  return (
    <ModuleLayout
      title="Convert Lead"
      subtitle="Create an opportunity by converting a qualified lead into an active deal."
      moduleLinks={[
        { to: "/customers", label: "Customers" },
        { to: "/sales-representatives", label: "Representatives" },
        { to: "/leads", label: "Leads" },
        { to: "/opportunities", label: "Opportunities" },
      ]}
    >
      {isLoading ? (
        <Panel>Loading conversion form...</Panel>
      ) : (
        <Panel>
          <OpportunityForm
            initialValues={
              initialLead
                ? {
                    title: `${initialLead.company_name} Opportunity`,
                    lead: { id: initialLead.id } as Opportunity["lead"],
                    owner: initialLead.representative ?? undefined,
                  }
                : undefined
            }
            leads={leads}
            ownerOptions={ownerOptions}
            isSubmitting={isSubmitting}
            lockLead={Boolean(selectedLeadId)}
            onSubmit={handleSubmit}
            submitLabel="Create Opportunity"
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
