import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CustomerLayout } from "../../components/customers/customer-layout";
import { apiClient } from "../../lib/api";
import { useToast } from "../../context/toast-context";
import type { Customer } from "../../types/customer";

export function CustomerDetailsPage() {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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
      setError("Unable to load customer details.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete() {
    if (!customer || !window.confirm(`Delete ${customer.company_name}?`)) {
      return;
    }
    try {
      await apiClient.delete(`/customers/${customer.id}/`);
      showToast("Customer deleted.");
      navigate("/customers");
    } catch {
      showToast("Unable to delete customer.", "error");
    }
  }

  return (
    <CustomerLayout
      title={customer?.company_name ?? "Customer Details"}
      subtitle="Review an individual customer record and manage it from a single view."
    >
      {isLoading ? (
        <Panel>Loading customer details...</Panel>
      ) : error || !customer ? (
        <Panel>{error || "Customer not found."}</Panel>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_auto]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <dl className="grid gap-5 md:grid-cols-2">
              <Detail label="Company Name" value={customer.company_name} />
              <Detail label="Contact Person" value={customer.contact_person} />
              <Detail label="Email" value={customer.email || "-"} />
              <Detail label="Phone" value={customer.phone || "-"} />
              <Detail label="Industry" value={customer.industry} />
              <Detail label="Status" value={customer.status} />
              <Detail label="Created At" value={new Date(customer.created_at).toLocaleString()} />
              <Detail label="Updated At" value={new Date(customer.updated_at).toLocaleString()} />
            </dl>
          </div>
          <div className="flex flex-col gap-3">
            <Link to={`/customers/${customer.id}/edit`} className="rounded-2xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700">
              Edit Customer
            </Link>
            <button
              type="button"
              onClick={() => void handleDelete()}
              className="rounded-2xl border border-rose-400/20 px-5 py-3 text-sm font-semibold text-rose-100 transition hover:bg-rose-500/10"
            >
              Delete Customer
            </button>
          </div>
        </div>
      )}
    </CustomerLayout>
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

function Panel({ children }: { children: ReactNode }) {
  return <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-slate-200">{children}</div>;
}
