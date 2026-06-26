export type DashboardMetric = {
  label: string;
  value: number;
  detail?: string;
};

export type ChartDatum = {
  label: string;
  value: number;
};

export type AdminDashboardSummary = {
  metrics: DashboardMetric[];
  opportunity_stage_chart: ChartDatum[];
  lead_status_chart: ChartDatum[];
};

export type SalesPerformanceRow = {
  id: number;
  employee_id: string;
  name: string;
  email: string;
  territory: string;
  status: string;
  assigned_customers: number;
  active_leads: number;
  open_opportunities: number;
  won_revenue: string;
  followups_today: number;
};

export type SalesDashboardSummary = {
  metrics: DashboardMetric[];
  pipeline_stage_chart: ChartDatum[];
  follow_up_status_chart: ChartDatum[];
};

export type SalesDashboardOpportunityRow = {
  id: number;
  title: string;
  customer_name: string;
  stage: string;
  amount: string;
  probability: number;
  expected_close_date: string | null;
  created_at: string;
};

export type SalesDashboardFollowUpRow = {
  id: number;
  subject: string;
  target_name: string;
  follow_up_type: string;
  status: string;
  scheduled_at: string;
  completed_at: string | null;
  notes: string;
};

export type FilteredPaginatedResponse<T, F extends Record<string, unknown>> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
  filters: F;
};
