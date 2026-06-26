import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { LeadForm, type LeadFormValues } from "../../components/leads/lead-form";
import { ModuleLayout } from "../../components/crm/module-layout";
import { Panel } from "../../components/ui/panel";
import { useToast } from "../../context/toast-context";
import { apiClient } from "../../lib/api";
import type { Lead } from "../../types/lead";

export function LeadEditPage() {
  const { leadId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [lead, setLead] = useState<Lead | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
      setError("Unable to load lead.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(values: LeadFormValues) {
    setIsSubmitting(true);
    try {
      await apiClient.put(`/leads/${leadId}/`, values);
      showToast("Lead updated.");
      navigate(`/leads/${leadId}`);
    } catch {
      showToast("Unable to update lead.", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ModuleLayout
      title="Edit Lead"
      subtitle="Update lead details using the shared lead form."
      moduleLinks={[
        { to: "/customers", label: "Customers" },
        { to: "/leads", label: "Leads" },
        { to: "/opportunities", label: "Opportunities" },
      ]}
    >
      {isLoading ? (
        <Panel>Loading lead...</Panel>
      ) : error || !lead ? (
        <Panel>{error || "Lead not found."}</Panel>
      ) : (
        <Panel>
          <LeadForm initialValues={lead} isSubmitting={isSubmitting} onSubmit={handleSubmit} submitLabel="Save Changes" />
        </Panel>
      )}
    </ModuleLayout>
  );
}
