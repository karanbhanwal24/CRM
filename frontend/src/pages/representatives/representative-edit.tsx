import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ModuleLayout } from "../../components/crm/module-layout";
import {
  RepresentativeForm,
  type RepresentativeFormValues,
} from "../../components/representatives/representative-form";
import { Panel } from "../../components/ui/panel";
import { useToast } from "../../context/toast-context";
import { apiClient } from "../../lib/api";
import type { SalesRepresentativeOption } from "../../types/lead";
import type { SalesRepresentative } from "../../types/representative";

export function RepresentativeEditPage() {
  const { representativeId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [representative, setRepresentative] = useState<SalesRepresentative | null>(null);
  const [managerOptions, setManagerOptions] = useState<SalesRepresentativeOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void Promise.all([loadRepresentative(), loadManagerOptions()]);
  }, [representativeId]);

  async function loadRepresentative() {
    try {
      const response = await apiClient.get<SalesRepresentative>(`/sales-representatives/${representativeId}/`);
      setRepresentative(response.data);
      setError("");
    } catch {
      setError("Unable to load representative.");
    } finally {
      setIsLoading(false);
    }
  }

  async function loadManagerOptions() {
    try {
      const response = await apiClient.get<SalesRepresentativeOption[]>("/sales-representatives/options/");
      setManagerOptions(response.data);
    } catch {
      showToast("Unable to load manager options.", "error");
    }
  }

  async function handleSubmit(values: RepresentativeFormValues) {
    setIsSubmitting(true);
    try {
      await apiClient.put(`/sales-representatives/${representativeId}/`, normalizePayload(values));
      showToast("Representative updated.");
      navigate(`/sales-representatives/${representativeId}`);
    } catch {
      showToast("Unable to update representative.", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ModuleLayout
      title="Edit Representative"
      subtitle="Update profile, access state, reporting line, and compensation metadata."
      moduleLinks={[
        { to: "/customers", label: "Customers" },
        { to: "/sales-representatives", label: "Representatives" },
        { to: "/leads", label: "Leads" },
      ]}
    >
      {isLoading ? (
        <Panel>Loading representative...</Panel>
      ) : error || !representative ? (
        <Panel>{error || "Representative not found."}</Panel>
      ) : (
        <Panel>
          <RepresentativeForm
            initialValues={representative}
            isSubmitting={isSubmitting}
            managerOptions={managerOptions.filter((option) => option.id !== representative.id)}
            onSubmit={handleSubmit}
            submitLabel="Save Changes"
          />
        </Panel>
      )}
    </ModuleLayout>
  );
}

function normalizePayload(values: RepresentativeFormValues) {
  return {
    first_name: values.first_name.trim(),
    last_name: values.last_name.trim(),
    email: values.email.trim().toLowerCase(),
    phone_number: values.phone_number.trim(),
    employee_id: values.employee_id.trim().toUpperCase(),
    territory: values.territory.trim(),
    status: values.status,
    commission_rate: values.commission_rate,
    hired_at: values.hired_at || null,
    manager_id: values.manager_id ? Number(values.manager_id) : null,
    ...(values.password ? { password: values.password } : {}),
  };
}
