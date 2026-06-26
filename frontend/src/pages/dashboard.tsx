import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { BarChart } from "../components/dashboard/bar-chart";
import { DashboardCard } from "../components/dashboard/dashboard-card";
import { DonutChart } from "../components/dashboard/donut-chart";
import { TableShell } from "../components/dashboard/table-shell";
import { Shell } from "../components/ui/shell";
import { useAuth } from "../context/auth-context";
import { apiClient } from "../lib/api";
import type {
  AdminDashboardSummary,
  FilteredPaginatedResponse,
  SalesDashboardFollowUpRow,
  SalesDashboardOpportunityRow,
  SalesDashboardSummary,
  SalesPerformanceRow,
} from "../types/dashboard";

type AdminFilters = {
  search: string;
  status: string;
  territory: string;
  sort: string;
  page: number;
};

type SalesOpportunityFilters = {
  search: string;
  stage: string;
  minProbability: string;
  sort: string;
  page: number;
};

type SalesFollowUpFilters = {
  search: string;
  status: string;
  type: string;
  sort: string;
  page: number;
};

type SalesPerformanceFilterOptions = {
  territories: string[];
  statuses: string[];
};

type SalesOpportunityFilterOptions = {
  stages: string[];
  min_probability_options: number[];
};

type SalesFollowUpFilterOptions = {
  statuses: string[];
  types: string[];
};

export function DashboardPage() {
  const { logout, user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  if (!user) {
    return null;
  }

  return (
    <Shell
      title={`${user.role === "ADMIN" ? "Administrator" : "Sales"} Dashboard`}
      subtitle={
        user.role === "ADMIN"
          ? "Monitor CRM volume, representative performance, funnel health, and revenue signals from one control surface."
          : "Track your assigned workload, today's follow-ups, and active pipeline without leaving the dashboard."
      }
    >
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.25em] text-brand-100/90">
          {user.role === "ADMIN" ? "Administrator" : "Sales Representative"}
        </div>
        {user.role === "ADMIN" ? (
          <>
            <NavPill to="/customers" label="Customers" />
            <NavPill to="/sales-representatives" label="Representatives" />
          </>
        ) : null}
        <NavPill to="/leads" label="Leads" />
        <NavPill to="/opportunities" label="Opportunities" />
        <button
          type="button"
          onClick={() => void logout()}
          className={pillClassName}
        >
          Logout
        </button>
      </div>

      {user.role === "ADMIN" ? (
        <AdminDashboard searchParams={searchParams} setSearchParams={setSearchParams} />
      ) : (
        <SalesDashboard searchParams={searchParams} setSearchParams={setSearchParams} />
      )}
    </Shell>
  );
}

function AdminDashboard({
  searchParams,
  setSearchParams,
}: {
  searchParams: URLSearchParams;
  setSearchParams: (nextInit: URLSearchParams) => void;
}) {
  const filters: AdminFilters = {
    search: searchParams.get("admin_search") ?? "",
    status: searchParams.get("admin_status") ?? "",
    territory: searchParams.get("admin_territory") ?? "",
    sort: searchParams.get("admin_sort") ?? "-won_revenue",
    page: Number(searchParams.get("admin_page") ?? "1"),
  };

  const summaryQuery = useQuery({
    queryKey: ["dashboard", "admin", "summary"],
    queryFn: async () => (await apiClient.get<AdminDashboardSummary>("/dashboard/admin/summary/")).data,
    staleTime: 60_000,
  });

  const salesQuery = useQuery({
    queryKey: ["dashboard", "admin", "sales-performance", filters],
    queryFn: async () =>
      (
        await apiClient.get<FilteredPaginatedResponse<SalesPerformanceRow, SalesPerformanceFilterOptions>>(
          "/dashboard/admin/sales-performance/",
          {
            params: {
              page: filters.page,
              search: filters.search || undefined,
              status: filters.status || undefined,
              territory: filters.territory || undefined,
              sort: filters.sort,
            },
          }
        )
      ).data,
    placeholderData: keepPreviousData,
  });

  return (
    <div className="grid gap-8">
      <MetricGrid isLoading={summaryQuery.isLoading} metrics={summaryQuery.data?.metrics ?? []} />

      <div className="grid gap-6 xl:grid-cols-2">
        <BarChart
          title="Opportunity Stages"
          subtitle="Stage distribution across the entire sales pipeline."
          data={summaryQuery.data?.opportunity_stage_chart ?? []}
        />
        <DonutChart
          title="Lead Status Mix"
          subtitle="Current lead inventory broken down by status."
          data={summaryQuery.data?.lead_status_chart ?? []}
        />
      </div>

      <TableShell
        title="Sales Table"
        subtitle="Representative-level performance with search, advanced filters, sorting, and pagination."
        controls={
          <div className="grid gap-3 md:grid-cols-4">
            <input
              defaultValue={filters.search}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  setSearchParams(buildAdminParams({ ...filters, search: event.currentTarget.value, page: 1 }));
                }
              }}
              className={controlClassName}
              placeholder="Search rep, email, employee..."
            />
            <select
              value={filters.status}
              onChange={(event) =>
                setSearchParams(buildAdminParams({ ...filters, status: event.target.value, page: 1 }))
              }
              className={controlClassName}
            >
              <option value="">All statuses</option>
              {(salesQuery.data?.filters.statuses ?? []).map((value) => (
                <option key={value} value={value}>
                  {value.replace("_", " ")}
                </option>
              ))}
            </select>
            <select
              value={filters.territory}
              onChange={(event) =>
                setSearchParams(buildAdminParams({ ...filters, territory: event.target.value, page: 1 }))
              }
              className={controlClassName}
            >
              <option value="">All territories</option>
              {(salesQuery.data?.filters.territories ?? []).map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
            <select
              value={filters.sort}
              onChange={(event) => setSearchParams(buildAdminParams({ ...filters, sort: event.target.value }))}
              className={controlClassName}
            >
              <option value="-won_revenue">Sort by revenue</option>
              <option value="-open_opportunities">Most open opportunities</option>
              <option value="-active_leads">Most active leads</option>
              <option value="-assigned_customers">Most customers</option>
              <option value="-followups_today">Most follow-ups today</option>
              <option value="name">Name A-Z</option>
            </select>
          </div>
        }
      >
        {salesQuery.isLoading ? (
          <EmptyState message="Loading sales performance..." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm text-slate-200">
                <thead className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  <tr>
                    <th className="px-3 py-3">Representative</th>
                    <th className="px-3 py-3">Territory</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Customers</th>
                    <th className="px-3 py-3">Active Leads</th>
                    <th className="px-3 py-3">Open Opps</th>
                    <th className="px-3 py-3">Won Revenue</th>
                    <th className="px-3 py-3">Today&apos;s Follow-ups</th>
                  </tr>
                </thead>
                <tbody>
                  {(salesQuery.data?.results ?? []).map((row) => (
                    <tr key={row.id} className="border-t border-white/5">
                      <td className="px-3 py-4">
                        <div className="font-medium text-white">{row.name.trim() || row.email}</div>
                        <div className="text-xs text-slate-400">
                          {row.employee_id} · {row.email}
                        </div>
                      </td>
                      <td className="px-3 py-4">{row.territory || "-"}</td>
                      <td className="px-3 py-4">{row.status}</td>
                      <td className="px-3 py-4">{row.assigned_customers}</td>
                      <td className="px-3 py-4">{row.active_leads}</td>
                      <td className="px-3 py-4">{row.open_opportunities}</td>
                      <td className="px-3 py-4">${Number(row.won_revenue).toLocaleString()}</td>
                      <td className="px-3 py-4">{row.followups_today}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              count={salesQuery.data?.count ?? 0}
              page={filters.page}
              pageSize={5}
              onPageChange={(page) => setSearchParams(buildAdminParams({ ...filters, page }))}
            />
          </>
        )}
      </TableShell>
    </div>
  );
}

function SalesDashboard({
  searchParams,
  setSearchParams,
}: {
  searchParams: URLSearchParams;
  setSearchParams: (nextInit: URLSearchParams) => void;
}) {
  const opportunityFilters: SalesOpportunityFilters = {
    search: searchParams.get("sales_opp_search") ?? "",
    stage: searchParams.get("sales_opp_stage") ?? "",
    minProbability: searchParams.get("sales_opp_min_probability") ?? "",
    sort: searchParams.get("sales_opp_sort") ?? "-expected_close_date",
    page: Number(searchParams.get("sales_opp_page") ?? "1"),
  };

  const followUpFilters: SalesFollowUpFilters = {
    search: searchParams.get("sales_fu_search") ?? "",
    status: searchParams.get("sales_fu_status") ?? "",
    type: searchParams.get("sales_fu_type") ?? "",
    sort: searchParams.get("sales_fu_sort") ?? "scheduled_at",
    page: Number(searchParams.get("sales_fu_page") ?? "1"),
  };

  const summaryQuery = useQuery({
    queryKey: ["dashboard", "sales", "summary"],
    queryFn: async () => (await apiClient.get<SalesDashboardSummary>("/dashboard/sales/summary/")).data,
    staleTime: 60_000,
  });

  const opportunitiesQuery = useQuery({
    queryKey: ["dashboard", "sales", "opportunities", opportunityFilters],
    queryFn: async () =>
      (
        await apiClient.get<
          FilteredPaginatedResponse<SalesDashboardOpportunityRow, SalesOpportunityFilterOptions>
        >("/dashboard/sales/opportunities/", {
          params: {
            page: opportunityFilters.page,
            search: opportunityFilters.search || undefined,
            stage: opportunityFilters.stage || undefined,
            min_probability: opportunityFilters.minProbability || undefined,
            sort: opportunityFilters.sort,
          },
        })
      ).data,
    placeholderData: keepPreviousData,
  });

  const followUpsQuery = useQuery({
    queryKey: ["dashboard", "sales", "follow-ups", followUpFilters],
    queryFn: async () =>
      (
        await apiClient.get<
          FilteredPaginatedResponse<SalesDashboardFollowUpRow, SalesFollowUpFilterOptions>
        >("/dashboard/sales/follow-ups/", {
          params: {
            page: followUpFilters.page,
            search: followUpFilters.search || undefined,
            status: followUpFilters.status || undefined,
            type: followUpFilters.type || undefined,
            sort: followUpFilters.sort,
          },
        })
      ).data,
    placeholderData: keepPreviousData,
  });

  return (
    <div className="grid gap-8">
      <MetricGrid isLoading={summaryQuery.isLoading} metrics={summaryQuery.data?.metrics ?? []} />

      <div className="grid gap-6 xl:grid-cols-2">
        <BarChart
          title="Pipeline Distribution"
          subtitle="Your opportunity workload by current stage."
          data={summaryQuery.data?.pipeline_stage_chart ?? []}
        />
        <DonutChart
          title="Today's Follow-up Status"
          subtitle="Scheduled follow-ups for today by completion state."
          data={summaryQuery.data?.follow_up_status_chart ?? []}
        />
      </div>

      <div className="grid gap-6">
        <TableShell
          title="Open Opportunities"
          subtitle="Search, filter, sort, and page through your active deals."
          controls={
            <div className="grid gap-3 md:grid-cols-4">
              <input
                defaultValue={opportunityFilters.search}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    setSearchParams(
                      buildSalesOpportunityParams({ ...opportunityFilters, search: event.currentTarget.value, page: 1 }, followUpFilters)
                    );
                  }
                }}
                className={controlClassName}
                placeholder="Search title or customer..."
              />
              <select
                value={opportunityFilters.stage}
                onChange={(event) =>
                  setSearchParams(
                    buildSalesOpportunityParams({ ...opportunityFilters, stage: event.target.value, page: 1 }, followUpFilters)
                  )
                }
                className={controlClassName}
              >
                <option value="">All stages</option>
                {(opportunitiesQuery.data?.filters.stages ?? []).map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
              <select
                value={opportunityFilters.minProbability}
                onChange={(event) =>
                  setSearchParams(
                    buildSalesOpportunityParams(
                      { ...opportunityFilters, minProbability: event.target.value, page: 1 },
                      followUpFilters
                    )
                  )
                }
                className={controlClassName}
              >
                <option value="">Any probability</option>
                {(opportunitiesQuery.data?.filters.min_probability_options ?? []).map((value) => (
                  <option key={value} value={value}>
                    {value}%+
                  </option>
                ))}
              </select>
              <select
                value={opportunityFilters.sort}
                onChange={(event) =>
                  setSearchParams(buildSalesOpportunityParams({ ...opportunityFilters, sort: event.target.value }, followUpFilters))
                }
                className={controlClassName}
              >
                <option value="-expected_close_date">Closest close date</option>
                <option value="-amount">Highest value</option>
                <option value="-probability">Highest probability</option>
                <option value="title">Title A-Z</option>
              </select>
            </div>
          }
        >
          {opportunitiesQuery.isLoading ? (
            <EmptyState message="Loading your open opportunities..." />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm text-slate-200">
                  <thead className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    <tr>
                      <th className="px-3 py-3">Title</th>
                      <th className="px-3 py-3">Customer</th>
                      <th className="px-3 py-3">Stage</th>
                      <th className="px-3 py-3">Amount</th>
                      <th className="px-3 py-3">Probability</th>
                      <th className="px-3 py-3">Expected Close</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(opportunitiesQuery.data?.results ?? []).map((row) => (
                      <tr key={row.id} className="border-t border-white/5">
                        <td className="px-3 py-4">
                          <Link to={`/opportunities/${row.id}`} className="font-medium text-white hover:text-brand-100">
                            {row.title}
                          </Link>
                        </td>
                        <td className="px-3 py-4">{row.customer_name}</td>
                        <td className="px-3 py-4">{row.stage}</td>
                        <td className="px-3 py-4">${Number(row.amount).toLocaleString()}</td>
                        <td className="px-3 py-4">{row.probability}%</td>
                        <td className="px-3 py-4">
                          {row.expected_close_date ? new Date(row.expected_close_date).toLocaleDateString() : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                count={opportunitiesQuery.data?.count ?? 0}
                page={opportunityFilters.page}
                pageSize={5}
                onPageChange={(page) =>
                  setSearchParams(buildSalesOpportunityParams({ ...opportunityFilters, page }, followUpFilters))
                }
              />
            </>
          )}
        </TableShell>

        <TableShell
          title="Today's Follow-ups"
          subtitle="Your scheduled follow-ups for today with advanced filters and paging."
          controls={
            <div className="grid gap-3 md:grid-cols-4">
              <input
                defaultValue={followUpFilters.search}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    setSearchParams(
                      buildSalesOpportunityParams(opportunityFilters, { ...followUpFilters, search: event.currentTarget.value, page: 1 })
                    );
                  }
                }}
                className={controlClassName}
                placeholder="Search subject or notes..."
              />
              <select
                value={followUpFilters.status}
                onChange={(event) =>
                  setSearchParams(
                    buildSalesOpportunityParams(opportunityFilters, { ...followUpFilters, status: event.target.value, page: 1 })
                  )
                }
                className={controlClassName}
              >
                <option value="">All statuses</option>
                {(followUpsQuery.data?.filters.statuses ?? []).map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
              <select
                value={followUpFilters.type}
                onChange={(event) =>
                  setSearchParams(
                    buildSalesOpportunityParams(opportunityFilters, { ...followUpFilters, type: event.target.value, page: 1 })
                  )
                }
                className={controlClassName}
              >
                <option value="">All types</option>
                {(followUpsQuery.data?.filters.types ?? []).map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
              <select
                value={followUpFilters.sort}
                onChange={(event) =>
                  setSearchParams(buildSalesOpportunityParams(opportunityFilters, { ...followUpFilters, sort: event.target.value }))
                }
                className={controlClassName}
              >
                <option value="scheduled_at">Earliest first</option>
                <option value="-scheduled_at">Latest first</option>
                <option value="status">Status</option>
                <option value="follow_up_type">Type</option>
              </select>
            </div>
          }
        >
          {followUpsQuery.isLoading ? (
            <EmptyState message="Loading today's follow-ups..." />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm text-slate-200">
                  <thead className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    <tr>
                      <th className="px-3 py-3">Subject</th>
                      <th className="px-3 py-3">Target</th>
                      <th className="px-3 py-3">Type</th>
                      <th className="px-3 py-3">Status</th>
                      <th className="px-3 py-3">Scheduled</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(followUpsQuery.data?.results ?? []).map((row) => (
                      <tr key={row.id} className="border-t border-white/5">
                        <td className="px-3 py-4">
                          <div className="font-medium text-white">{row.subject}</div>
                          <div className="text-xs text-slate-400">{row.notes || "No notes"}</div>
                        </td>
                        <td className="px-3 py-4">{row.target_name}</td>
                        <td className="px-3 py-4">{row.follow_up_type}</td>
                        <td className="px-3 py-4">{row.status}</td>
                        <td className="px-3 py-4">{new Date(row.scheduled_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                count={followUpsQuery.data?.count ?? 0}
                page={followUpFilters.page}
                pageSize={5}
                onPageChange={(page) =>
                  setSearchParams(buildSalesOpportunityParams(opportunityFilters, { ...followUpFilters, page }))
                }
              />
            </>
          )}
        </TableShell>
      </div>
    </div>
  );
}

function MetricGrid({ metrics, isLoading }: { metrics: Array<{ label: string; value: number; detail?: string }>; isLoading: boolean }) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {isLoading
        ? Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-40 animate-pulse rounded-3xl border border-white/10 bg-white/5" />)
        : metrics.map((metric) => <DashboardCard key={metric.label} metric={metric} />)}
    </section>
  );
}

function Pagination({
  count,
  page,
  pageSize,
  onPageChange,
}: {
  count: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(count / pageSize));

  return (
    <div className="mt-6 flex items-center justify-between">
      <p className="text-sm text-slate-300">{count} record{count === 1 ? "" : "s"}</p>
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
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
          onClick={() => onPageChange(page + 1)}
          className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-100 disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}

function NavPill({ to, label }: { to: string; label: string }) {
  return (
    <Link to={to} className={pillClassName}>
      {label}
    </Link>
  );
}

function EmptyState({ message }: { message: string }) {
  return <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-5 text-sm text-slate-300">{message}</div>;
}

function buildAdminParams(filters: AdminFilters) {
  const params = new URLSearchParams();
  if (filters.search) params.set("admin_search", filters.search);
  if (filters.status) params.set("admin_status", filters.status);
  if (filters.territory) params.set("admin_territory", filters.territory);
  if (filters.sort) params.set("admin_sort", filters.sort);
  params.set("admin_page", String(filters.page));
  return params;
}

function buildSalesOpportunityParams(opportunityFilters: SalesOpportunityFilters, followUpFilters: SalesFollowUpFilters) {
  const params = new URLSearchParams();
  if (opportunityFilters.search) params.set("sales_opp_search", opportunityFilters.search);
  if (opportunityFilters.stage) params.set("sales_opp_stage", opportunityFilters.stage);
  if (opportunityFilters.minProbability) params.set("sales_opp_min_probability", opportunityFilters.minProbability);
  if (opportunityFilters.sort) params.set("sales_opp_sort", opportunityFilters.sort);
  params.set("sales_opp_page", String(opportunityFilters.page));

  if (followUpFilters.search) params.set("sales_fu_search", followUpFilters.search);
  if (followUpFilters.status) params.set("sales_fu_status", followUpFilters.status);
  if (followUpFilters.type) params.set("sales_fu_type", followUpFilters.type);
  if (followUpFilters.sort) params.set("sales_fu_sort", followUpFilters.sort);
  params.set("sales_fu_page", String(followUpFilters.page));
  return params;
}

const pillClassName =
  "rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-100 transition hover:bg-white/10";

const controlClassName =
  "rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition focus:border-brand-500";
