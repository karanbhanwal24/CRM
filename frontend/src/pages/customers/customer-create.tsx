import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CustomerForm, type CustomerFormValues } from "../../components/customers/customer-form";
import { CustomerLayout } from "../../components/customers/customer-layout";
import { useToast } from "../../context/toast-context";
import { apiClient } from "../../lib/api";
import type { Customer } from "../../types/customer";

export function CustomerCreatePage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(values: CustomerFormValues) {
    setIsSubmitting(true);
    try {
      const response = await apiClient.post<Customer>("/customers/", values);
      showToast("Customer created.");
      navigate(`/customers/${response.data.id}`);
    } catch {
      showToast("Unable to create customer.", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <CustomerLayout
      title="Add Customer"
      subtitle="Create a new customer record. Only administrators can access this module."
    >
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
        <CustomerForm isSubmitting={isSubmitting} onSubmit={handleSubmit} submitLabel="Create Customer" />
      </div>
    </CustomerLayout>
  );
}
