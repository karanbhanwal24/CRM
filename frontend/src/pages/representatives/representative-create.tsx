import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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

export function RepresentativeCreatePage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [managerOptions, setManagerOptions] = useState<SalesRepresentativeOption[]>([]);
  const [isLoadingManagers, setIsLoadingManagers] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    void loadManagerOptions();
  }, []);

  async function loadManagerOptions() {
    try {
      const response = await apiClient.get<SalesRepresentativeOption[]>("/sales-representatives/options/");
      setManagerOptions(response.data);
    } catch {
      showToast("Unable to load manager options.", "error");
    } finally {
      setIsLoadingManagers(false);
    }
  }

  async function handleSubmit(values: RepresentativeFormValues) {
    setIsSubmitting(true);
    try {
      const response = await apiClient.post<SalesRepresentative>("/sales-representatives/", normalizePayload(values, true));
      showToast("Representative created.");
      navigate(`/sales-representatives/${response.data.id}`);
    } catch {
      showToast("Unable to create representative.", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ModuleLayout
      title="Add Representative"
      subtitle="Provision a sales representative account and profile in a single admin workflow."
      moduleLinks={[
        { to: "/customers", label: "Customers" },
        { to: "/sales-representatives", label: "Representatives" },
        { to: "/leads", label: "Leads" },
      ]}
    >
      {isLoadingManagers ? (
        <Panel>Loading form dependencies...</Panel>
      ) : (
        <Panel>
          <RepresentativeForm
            isSubmitting={isSubmitting}
            managerOptions={managerOptions}
            onSubmit={handleSubmit}
            requirePassword
            submitLabel="Create Representative"
          />
        </Panel>
      )}
    </ModuleLayout>
  );
}

function normalizePayload(values: RepresentativeFormValues, requirePassword: boolean) {
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
    ...(requirePassword || values.password ? { password: values.password } : {}),
  };
}
