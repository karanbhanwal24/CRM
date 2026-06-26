import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CustomerForm, type CustomerFormValues } from "../../components/customers/customer-form";
import { CustomerLayout } from "../../components/customers/customer-layout";
import { useToast } from "../../context/toast-context";
import { apiClient } from "../../lib/api";
import type { Customer } from "../../types/customer";

export function CustomerEditPage() {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void loadCustomer();
  }, [customerId]);

  async function loadCustomer() {
    setIsLoading(true);
    setError("");
    try {
      const response = await apiClient.get<Customer>(`/customers/${customerId}/`);
      setCustomer(response.data);
    } catch {
      setError("Unable to load customer.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(values: CustomerFormValues) {
    setIsSubmitting(true);
    try {
      await apiClient.put(`/customers/${customerId}/`, values);
      showToast("Customer updated.");
      navigate(`/customers/${customerId}`);
    } catch {
      showToast("Unable to update customer.", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <CustomerLayout title="Edit Customer" subtitle="Update customer information with validated form inputs.">
      {isLoading ? (
        <Panel>Loading customer...</Panel>
      ) : error || !customer ? (
        <Panel>{error || "Customer not found."}</Panel>
      ) : (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
          <CustomerForm
            initialValues={customer}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
            submitLabel="Save Changes"
          />
        </div>
      )}
    </CustomerLayout>
  );
}

function Panel({ children }: { children: ReactNode }) {
  return <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-slate-200">{children}</div>;
}
