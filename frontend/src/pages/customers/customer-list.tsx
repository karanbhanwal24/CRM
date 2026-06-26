import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CustomerLayout } from "../../components/customers/customer-layout";
import { apiClient } from "../../lib/api";
import { useToast } from "../../context/toast-context";
import type { Customer, PaginatedResponse } from "../../types/customer";

export function CustomerListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const { showToast } = useToast();

  const page = Number(searchParams.get("page") ?? "1");
  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status") ?? "";
  const industry = searchParams.get("industry") ?? "";

  useEffect(() => {
    void loadCustomers();
  }, [page, search, status, industry]);

  async function loadCustomers() {
    setIsLoading(true);
    setError("");
    try {
      const response = await apiClient.get<PaginatedResponse<Customer>>("/customers/", {
        params: {
          page,
          search: search || undefined,
          status: status || undefined,
          industry: industry || undefined,
        },
      });
      setCustomers(response.data.results);
      setCount(response.data.count);
    } catch {
      setError("Unable to load customers.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete(customer: Customer) {
    const confirmed = window.confirm(`Delete ${customer.company_name}?`);
    if (!confirmed) {
      return;
    }
    try {
      await apiClient.delete(`/customers/${customer.id}/`);
      showToast("Customer deleted.");
      void loadCustomers();
    } catch {
      showToast("Unable to delete customer.", "error");
    }
  }

  const totalPages = Math.max(1, Math.ceil(count / 10));

  return (
    <CustomerLayout
      title="Customer Module"
      subtitle="Admin-only customer management with search, filtering, pagination, validation, and CRUD operations."
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="grid gap-3 md:grid-cols-3">
          <input
            defaultValue={search}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                setSearchParams(buildParams({ search: event.currentTarget.value, status, industry, page: 1 }));
              }
            }}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-brand-500"
            placeholder="Search company, contact, email..."
          />
          <select
            value={status}
            onChange={(event) =>
              setSearchParams(buildParams({ search, status: event.target.value, industry, page: 1 }))
            }
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-brand-500"
          >
            <option value="">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="CHURNED">Churned</option>
          </select>
          <input
            value={industry}
            onChange={(event) =>
              setSearchParams(buildParams({ search, status, industry: event.target.value, page: 1 }))
            }
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-brand-500"
            placeholder="Filter by industry"
          />
        </div>
        <Link
          to="/customers/new"
          className="rounded-2xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          Add Customer
        </Link>
      </div>

      {isLoading ? (
        <Panel>Loading customers...</Panel>
      ) : error ? (
        <Panel>{error}</Panel>
      ) : (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-200">
              <thead className="text-xs uppercase tracking-[0.2em] text-slate-400">
                <tr>
                  <th className="px-3 py-3">Company</th>
                  <th className="px-3 py-3">Contact</th>
                  <th className="px-3 py-3">Email</th>
                  <th className="px-3 py-3">Phone</th>
                  <th className="px-3 py-3">Industry</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id} className="border-t border-white/5">
                    <td className="px-3 py-4">{customer.company_name}</td>
                    <td className="px-3 py-4">{customer.contact_person}</td>
                    <td className="px-3 py-4">{customer.email || "-"}</td>
                    <td className="px-3 py-4">{customer.phone || "-"}</td>
                    <td className="px-3 py-4">{customer.industry}</td>
                    <td className="px-3 py-4">{customer.status}</td>
                    <td className="px-3 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Link to={`/customers/${customer.id}`} className={actionLinkClassName}>
                          View
                        </Link>
                        <Link to={`/customers/${customer.id}/edit`} className={actionLinkClassName}>
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => void handleDelete(customer)}
                          className="rounded-full border border-rose-400/20 px-3 py-1 text-xs text-rose-200 transition hover:bg-rose-500/10"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-slate-300">
              {count} customer{count === 1 ? "" : "s"}
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setSearchParams(buildParams({ search, status, industry, page: page - 1 }))}
                className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-100 disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-sm text-slate-300">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setSearchParams(buildParams({ search, status, industry, page: page + 1 }))}
                className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-100 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </CustomerLayout>
  );
}

function buildParams(values: { search: string; status: string; industry: string; page: number }) {
  const params = new URLSearchParams();
  if (values.search) params.set("search", values.search);
  if (values.status) params.set("status", values.status);
  if (values.industry) params.set("industry", values.industry);
  params.set("page", String(values.page));
  return params;
}

function Panel({ children }: { children: ReactNode }) {
  return <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-slate-200">{children}</div>;
}

const actionLinkClassName =
  "rounded-full border border-white/10 px-3 py-1 text-xs text-slate-100 transition hover:bg-white/10";
