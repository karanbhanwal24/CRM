import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LeadForm, type LeadFormValues } from "../../components/leads/lead-form";
import { ModuleLayout } from "../../components/crm/module-layout";
import { Panel } from "../../components/ui/panel";
import { useToast } from "../../context/toast-context";
import { apiClient } from "../../lib/api";
import type { Lead } from "../../types/lead";

export function LeadCreatePage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(values: LeadFormValues) {
    setIsSubmitting(true);
    try {
      const response = await apiClient.post<Lead>("/leads/", values);
      showToast("Lead created.");
      navigate(`/leads/${response.data.id}`);
    } catch {
      showToast("Unable to create lead.", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ModuleLayout
      title="Add Lead"
      subtitle="Create a lead with validated contact and qualification fields."
      moduleLinks={[
        { to: "/customers", label: "Customers" },
        { to: "/leads", label: "Leads" },
        { to: "/opportunities", label: "Opportunities" },
      ]}
    >
      <Panel>
        <LeadForm isSubmitting={isSubmitting} onSubmit={handleSubmit} submitLabel="Create Lead" />
      </Panel>
    </ModuleLayout>
  );
}
