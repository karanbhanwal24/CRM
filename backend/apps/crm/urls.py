from django.urls import path

from apps.crm.views import (
    AdminDashboardSalesPerformanceView,
    AdminDashboardSummaryView,
    CustomerListCreateView,
    CustomerRetrieveUpdateDestroyView,
    LeadAssignView,
    LeadListCreateView,
    LeadRetrieveUpdateDestroyView,
    SalesDashboardFollowUpQueueView,
    SalesDashboardOpportunityQueueView,
    SalesDashboardSummaryView,
    OpportunityFollowUpListCreateView,
    OpportunityListCreateView,
    OpportunityRetrieveUpdateDestroyView,
    OpportunityStageUpdateView,
    SalesRepresentativeDisableView,
    SalesRepresentativeListCreateView,
    SalesRepresentativeOptionListView,
    SalesRepresentativeRetrieveUpdateView,
)


urlpatterns = [
    path("dashboard/admin/summary/", AdminDashboardSummaryView.as_view(), name="dashboard-admin-summary"),
    path("dashboard/admin/sales-performance/", AdminDashboardSalesPerformanceView.as_view(), name="dashboard-admin-sales-performance"),
    path("dashboard/sales/summary/", SalesDashboardSummaryView.as_view(), name="dashboard-sales-summary"),
    path("dashboard/sales/opportunities/", SalesDashboardOpportunityQueueView.as_view(), name="dashboard-sales-opportunities"),
    path("dashboard/sales/follow-ups/", SalesDashboardFollowUpQueueView.as_view(), name="dashboard-sales-follow-ups"),
    path("customers/", CustomerListCreateView.as_view(), name="customer-list-create"),
    path("customers/<int:pk>/", CustomerRetrieveUpdateDestroyView.as_view(), name="customer-detail"),
    path("leads/", LeadListCreateView.as_view(), name="lead-list-create"),
    path("leads/<int:pk>/", LeadRetrieveUpdateDestroyView.as_view(), name="lead-detail"),
    path("leads/<int:pk>/assign/", LeadAssignView.as_view(), name="lead-assign"),
    path("opportunities/", OpportunityListCreateView.as_view(), name="opportunity-list-create"),
    path("opportunities/<int:pk>/", OpportunityRetrieveUpdateDestroyView.as_view(), name="opportunity-detail"),
    path("opportunities/<int:pk>/stage/", OpportunityStageUpdateView.as_view(), name="opportunity-stage-update"),
    path("opportunities/<int:pk>/follow-ups/", OpportunityFollowUpListCreateView.as_view(), name="opportunity-follow-up-list-create"),
    path("sales-representatives/options/", SalesRepresentativeOptionListView.as_view(), name="sales-representative-options"),
    path("sales-representatives/", SalesRepresentativeListCreateView.as_view(), name="sales-representative-list-create"),
    path("sales-representatives/<int:pk>/", SalesRepresentativeRetrieveUpdateView.as_view(), name="sales-representative-detail"),
    path("sales-representatives/<int:pk>/disable/", SalesRepresentativeDisableView.as_view(), name="sales-representative-disable"),
]
