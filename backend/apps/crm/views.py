from django.db.models import CharField, Count, DecimalField, F, Q, Sum, Value
from django.db.models.functions import Coalesce, Concat
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.crm.dashboard_serializers import (
    AdminDashboardSummarySerializer,
    ChartDatumSerializer,
    SalesDashboardFollowUpRowSerializer,
    SalesDashboardOpportunityRowSerializer,
    SalesDashboardSummarySerializer,
    SalesPerformanceRowSerializer,
)
from apps.crm.models import Customer, FollowUp, Lead, Opportunity
from apps.crm.pagination import CustomerPagination
from apps.crm.serializers import (
    CustomerSerializer,
    LeadAssignSerializer,
    LeadSerializer,
    OpportunityFollowUpSerializer,
    OpportunitySerializer,
    OpportunityStageUpdateSerializer,
    SalesRepresentativeCreateSerializer,
    SalesRepresentativeDisableSerializer,
    SalesRepresentativeSerializer,
    SalesRepresentativeUpdateSerializer,
    SalesRepresentativeOptionSerializer,
)
from apps.users.models import SalesRepresentative, SalesRepresentativeStatus
from apps.users.permissions import IsAdministrator, IsAdministratorOrSalesRepresentative


OPEN_OPPORTUNITY_STAGES = ("QUALIFICATION", "PROPOSAL", "NEGOTIATION")


class DashboardPagination(PageNumberPagination):
    page_size = 5
    page_size_query_param = "page_size"
    max_page_size = 50


class CustomerListCreateView(generics.ListCreateAPIView):
    serializer_class = CustomerSerializer
    permission_classes = [IsAdministrator]
    pagination_class = CustomerPagination

    def get_queryset(self):
        queryset = Customer.objects.all().order_by("company_name", "id")
        search = self.request.query_params.get("search", "").strip()
        status_filter = self.request.query_params.get("status", "").strip()
        industry_filter = self.request.query_params.get("industry", "").strip()

        if search:
            queryset = queryset.filter(
                Q(company_name__icontains=search)
                | Q(contact_person__icontains=search)
                | Q(email__icontains=search)
                | Q(phone_number__icontains=search)
                | Q(industry__icontains=search)
            )
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if industry_filter:
            queryset = queryset.filter(industry__icontains=industry_filter)
        return queryset


class CustomerRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    permission_classes = [IsAdministrator]


class LeadListCreateView(generics.ListCreateAPIView):
    serializer_class = LeadSerializer
    permission_classes = [IsAdministratorOrSalesRepresentative]
    pagination_class = CustomerPagination

    def get_queryset(self):
        queryset = Lead.objects.select_related("assigned_to__user", "created_by").all().order_by("company_name", "id")
        search = self.request.query_params.get("search", "").strip()
        status_filter = self.request.query_params.get("status", "").strip()
        priority_filter = self.request.query_params.get("priority", "").strip()
        source_filter = self.request.query_params.get("source", "").strip()
        assigned_to_filter = self.request.query_params.get("assigned_to", "").strip()

        if search:
            queryset = queryset.filter(
                Q(company_name__icontains=search)
                | Q(contact_person__icontains=search)
                | Q(email__icontains=search)
                | Q(phone_number__icontains=search)
            )
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if priority_filter:
            queryset = queryset.filter(priority=priority_filter)
        if source_filter:
            queryset = queryset.filter(source=source_filter)
        if assigned_to_filter:
            queryset = queryset.filter(assigned_to_id=assigned_to_filter)

        if self.request.user.role != "ADMIN":
            queryset = queryset.filter(Q(assigned_to__user=self.request.user) | Q(created_by=self.request.user))
        return queryset


class LeadRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = LeadSerializer
    permission_classes = [IsAdministratorOrSalesRepresentative]

    def get_queryset(self):
        queryset = Lead.objects.select_related("assigned_to__user", "created_by").all()
        if self.request.user.role != "ADMIN":
            queryset = queryset.filter(Q(assigned_to__user=self.request.user) | Q(created_by=self.request.user))
        return queryset


class LeadAssignView(APIView):
    permission_classes = [IsAdministrator]

    def patch(self, request, pk: int):
        lead = generics.get_object_or_404(Lead.objects.select_related("assigned_to__user"), pk=pk)
        serializer = LeadAssignSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        lead.assigned_to = serializer.validated_data["assigned_to"]
        lead.save(update_fields=["assigned_to", "updated_at"])
        return Response(LeadSerializer(lead, context={"request": request}).data, status=status.HTTP_200_OK)


class SalesRepresentativeOptionListView(generics.ListAPIView):
    serializer_class = SalesRepresentativeOptionSerializer
    permission_classes = [IsAdministratorOrSalesRepresentative]
    pagination_class = None

    def get_queryset(self):
        return SalesRepresentative.objects.select_related("user").filter(
            status=SalesRepresentativeStatus.ACTIVE,
            user__is_active=True,
        ).order_by("employee_id")


class SalesRepresentativeListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAdministrator]
    pagination_class = CustomerPagination

    def get_serializer_class(self):
        if self.request.method == "POST":
            return SalesRepresentativeCreateSerializer
        return SalesRepresentativeSerializer

    def get_queryset(self):
        search = self.request.query_params.get("search", "").strip()
        status_filter = self.request.query_params.get("status", "").strip()
        territory_filter = self.request.query_params.get("territory", "").strip()

        queryset = SalesRepresentative.objects.select_related("user", "manager__user").annotate(
            lead_count=Count("leads", distinct=True),
            direct_reports_count=Count("direct_reports", distinct=True),
        ).order_by("employee_id", "id")

        if search:
            queryset = queryset.filter(
                Q(employee_id__icontains=search)
                | Q(territory__icontains=search)
                | Q(user__email__icontains=search)
                | Q(user__first_name__icontains=search)
                | Q(user__last_name__icontains=search)
                | Q(manager__employee_id__icontains=search)
                | Q(manager__user__first_name__icontains=search)
                | Q(manager__user__last_name__icontains=search)
            )
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if territory_filter:
            queryset = queryset.filter(territory__icontains=territory_filter)
        return queryset


class SalesRepresentativeRetrieveUpdateView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAdministrator]

    def get_serializer_class(self):
        if self.request.method in {"PUT", "PATCH"}:
            return SalesRepresentativeUpdateSerializer
        return SalesRepresentativeSerializer

    def get_queryset(self):
        return SalesRepresentative.objects.select_related("user", "manager__user").annotate(
            lead_count=Count("leads", distinct=True),
            direct_reports_count=Count("direct_reports", distinct=True),
        )


class SalesRepresentativeDisableView(APIView):
    permission_classes = [IsAdministrator]

    def patch(self, request, pk: int):
        representative = generics.get_object_or_404(
            SalesRepresentative.objects.select_related("user", "manager__user").annotate(
                lead_count=Count("leads", distinct=True),
                direct_reports_count=Count("direct_reports", distinct=True),
            ),
            pk=pk,
        )
        serializer = SalesRepresentativeDisableSerializer(instance=representative, data=request.data or {})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            SalesRepresentativeSerializer(representative, context={"request": request}).data,
            status=status.HTTP_200_OK,
        )


class OpportunityAccessMixin:
    def get_opportunity_queryset(self):
        queryset = (
            Opportunity.objects.select_related(
                "customer",
                "lead__assigned_to__user",
                "lead__converted_customer",
                "owner__user",
            )
            .prefetch_related("follow_ups__assigned_to__user", "follow_ups__created_by")
            .annotate(follow_up_count=Count("follow_ups", distinct=True))
            .order_by("-created_at", "-id")
        )
        if self.request.user.role == "ADMIN":
            return queryset
        return queryset.filter(owner__user=self.request.user)

    def get_queryset(self):
        return self.get_opportunity_queryset()

    def ensure_owner_or_admin(self, opportunity: Opportunity):
        if self.request.user.role == "ADMIN":
            return
        if opportunity.owner.user_id != self.request.user.id:
            raise PermissionDenied("Only the assigned sales representative can update this opportunity.")


class OpportunityListCreateView(OpportunityAccessMixin, generics.ListCreateAPIView):
    serializer_class = OpportunitySerializer
    permission_classes = [IsAdministratorOrSalesRepresentative]
    pagination_class = CustomerPagination

    def get_queryset(self):
        queryset = super().get_queryset()
        search = self.request.query_params.get("search", "").strip()
        stage_filter = self.request.query_params.get("stage", "").strip()

        if search:
            queryset = queryset.filter(
                Q(title__icontains=search)
                | Q(customer__company_name__icontains=search)
                | Q(owner__user__first_name__icontains=search)
                | Q(owner__user__last_name__icontains=search)
                | Q(owner__employee_id__icontains=search)
                | Q(lead__company_name__icontains=search)
            )
        if stage_filter:
            queryset = queryset.filter(stage=stage_filter)
        return queryset


class OpportunityRetrieveUpdateDestroyView(OpportunityAccessMixin, generics.RetrieveUpdateDestroyAPIView):
    serializer_class = OpportunitySerializer
    permission_classes = [IsAdministratorOrSalesRepresentative]

    def update(self, request, *args, **kwargs):
        opportunity = self.get_object()
        self.ensure_owner_or_admin(opportunity)
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        opportunity = self.get_object()
        self.ensure_owner_or_admin(opportunity)
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if request.user.role != "ADMIN":
            raise PermissionDenied("Only administrators can delete opportunities.")
        return super().destroy(request, *args, **kwargs)


class OpportunityStageUpdateView(OpportunityAccessMixin, APIView):
    permission_classes = [IsAdministratorOrSalesRepresentative]

    def patch(self, request, pk: int):
        opportunity = generics.get_object_or_404(self.get_queryset(), pk=pk)
        self.ensure_owner_or_admin(opportunity)
        serializer = OpportunityStageUpdateSerializer(instance=opportunity, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(OpportunitySerializer(opportunity, context={"request": request}).data, status=status.HTTP_200_OK)


class OpportunityFollowUpListCreateView(OpportunityAccessMixin, generics.ListCreateAPIView):
    serializer_class = OpportunityFollowUpSerializer
    permission_classes = [IsAdministratorOrSalesRepresentative]
    pagination_class = None

    def get_opportunity(self):
        return generics.get_object_or_404(self.get_opportunity_queryset(), pk=self.kwargs["pk"])

    def get_queryset(self):
        opportunity = self.get_opportunity()
        return FollowUp.objects.select_related("assigned_to__user", "created_by").filter(opportunity=opportunity).order_by(
            "-scheduled_at", "-id"
        )

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def perform_create(self, serializer):
        opportunity = self.get_opportunity()
        self.ensure_owner_or_admin(opportunity)
        serializer.save(opportunity=opportunity, created_by=self.request.user)


class AdminDashboardSummaryView(APIView):
    permission_classes = [IsAdministrator]

    def get(self, request):
        metrics = [
            {"label": "Total Customers", "value": Customer.objects.count(), "detail": "All customer records"},
            {"label": "Total Leads", "value": Lead.objects.count(), "detail": "Across the full funnel"},
            {
                "label": "Open Opportunities",
                "value": Opportunity.objects.filter(stage__in=OPEN_OPPORTUNITY_STAGES).count(),
                "detail": "Qualification, proposal, and negotiation",
            },
            {
                "label": "Active Representatives",
                "value": SalesRepresentative.objects.filter(
                    status=SalesRepresentativeStatus.ACTIVE,
                    user__is_active=True,
                ).count(),
                "detail": "Currently available sales reps",
            },
        ]

        opportunity_stage_chart = [
            {"label": row["stage"], "value": row["count"]}
            for row in Opportunity.objects.values("stage").annotate(count=Count("id")).order_by("stage")
        ]
        lead_status_chart = [
            {"label": row["status"], "value": row["count"]}
            for row in Lead.objects.values("status").annotate(count=Count("id")).order_by("status")
        ]

        serializer = AdminDashboardSummarySerializer(
            {
                "metrics": metrics,
                "opportunity_stage_chart": opportunity_stage_chart,
                "lead_status_chart": lead_status_chart,
            }
        )
        return Response(serializer.data, status=status.HTTP_200_OK)


class AdminDashboardSalesPerformanceView(generics.ListAPIView):
    permission_classes = [IsAdministrator]
    serializer_class = SalesPerformanceRowSerializer
    pagination_class = DashboardPagination

    def get_queryset(self):
        today = timezone.localdate()
        search = self.request.query_params.get("search", "").strip()
        status_filter = self.request.query_params.get("status", "").strip()
        territory_filter = self.request.query_params.get("territory", "").strip()
        sort = self.request.query_params.get("sort", "-won_revenue").strip()

        queryset = (
            SalesRepresentative.objects.select_related("user")
            .annotate(
                name=Concat(
                    F("user__first_name"),
                    Value(" "),
                    F("user__last_name"),
                    output_field=CharField(),
                ),
                email=F("user__email"),
                assigned_customers=Count(
                    "opportunities__customer",
                    distinct=True,
                    filter=Q(opportunities__customer__isnull=False),
                ),
                active_leads=Count(
                    "leads",
                    distinct=True,
                    filter=Q(leads__status__in=("NEW", "CONTACTED", "QUALIFIED")),
                ),
                open_opportunities=Count(
                    "opportunities",
                    distinct=True,
                    filter=Q(opportunities__stage__in=OPEN_OPPORTUNITY_STAGES),
                ),
                won_revenue=Coalesce(
                    Sum(
                        "opportunities__amount",
                        filter=Q(opportunities__stage="WON"),
                        output_field=DecimalField(max_digits=12, decimal_places=2),
                    ),
                    Value(0),
                    output_field=DecimalField(max_digits=12, decimal_places=2),
                ),
                followups_today=Count(
                    "follow_ups",
                    distinct=True,
                    filter=Q(follow_ups__scheduled_at__date=today),
                ),
            )
            .order_by("employee_id")
        )

        if search:
            queryset = queryset.filter(
                Q(employee_id__icontains=search)
                | Q(user__email__icontains=search)
                | Q(user__first_name__icontains=search)
                | Q(user__last_name__icontains=search)
            )
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if territory_filter:
            queryset = queryset.filter(territory__icontains=territory_filter)

        allowed_sorts = {
            "employee_id",
            "-employee_id",
            "name",
            "-name",
            "territory",
            "-territory",
            "status",
            "-status",
            "assigned_customers",
            "-assigned_customers",
            "active_leads",
            "-active_leads",
            "open_opportunities",
            "-open_opportunities",
            "won_revenue",
            "-won_revenue",
            "followups_today",
            "-followups_today",
        }
        return queryset.order_by(sort if sort in allowed_sorts else "-won_revenue", "employee_id")

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        territories = list(
            SalesRepresentative.objects.exclude(territory="").order_by("territory").values_list("territory", flat=True).distinct()
        )
        response.data["filters"] = {
            "territories": territories,
            "statuses": [choice[0] for choice in SalesRepresentativeStatus.choices],
        }
        return response


class SalesDashboardSummaryView(APIView):
    permission_classes = [IsAdministratorOrSalesRepresentative]

    def get(self, request):
        if request.user.role == "ADMIN":
            raise PermissionDenied("Use the administrator dashboard endpoint.")

        today = timezone.localdate()
        sales_profile = request.user.sales_profile

        assigned_customers = Customer.objects.filter(opportunities__owner=sales_profile).distinct().count()
        assigned_leads = Lead.objects.filter(assigned_to=sales_profile).count()
        open_opportunities = Opportunity.objects.filter(owner=sales_profile, stage__in=OPEN_OPPORTUNITY_STAGES).count()
        todays_followups = FollowUp.objects.filter(assigned_to=sales_profile, scheduled_at__date=today).count()

        pipeline_stage_chart = [
            {"label": row["stage"], "value": row["count"]}
            for row in Opportunity.objects.filter(owner=sales_profile)
            .values("stage")
            .annotate(count=Count("id"))
            .order_by("stage")
        ]
        follow_up_status_chart = [
            {"label": row["status"], "value": row["count"]}
            for row in FollowUp.objects.filter(assigned_to=sales_profile, scheduled_at__date=today)
            .values("status")
            .annotate(count=Count("id"))
            .order_by("status")
        ]

        serializer = SalesDashboardSummarySerializer(
            {
                "metrics": [
                    {"label": "Assigned Customers", "value": assigned_customers, "detail": "Distinct opportunity customers"},
                    {"label": "Assigned Leads", "value": assigned_leads, "detail": "Currently routed to you"},
                    {"label": "Open Opportunities", "value": open_opportunities, "detail": "Active deals in pipeline"},
                    {"label": "Today's Follow-ups", "value": todays_followups, "detail": "Scheduled for today"},
                ],
                "pipeline_stage_chart": pipeline_stage_chart,
                "follow_up_status_chart": follow_up_status_chart,
            }
        )
        return Response(serializer.data, status=status.HTTP_200_OK)


class SalesDashboardOpportunityQueueView(generics.ListAPIView):
    permission_classes = [IsAdministratorOrSalesRepresentative]
    serializer_class = SalesDashboardOpportunityRowSerializer
    pagination_class = DashboardPagination

    def get_queryset(self):
        if self.request.user.role == "ADMIN":
            raise PermissionDenied("Use the administrator dashboard endpoint.")

        sales_profile = self.request.user.sales_profile
        search = self.request.query_params.get("search", "").strip()
        stage_filter = self.request.query_params.get("stage", "").strip()
        min_probability = self.request.query_params.get("min_probability", "").strip()
        sort = self.request.query_params.get("sort", "-expected_close_date").strip()

        queryset = Opportunity.objects.filter(
            owner=sales_profile,
            stage__in=OPEN_OPPORTUNITY_STAGES,
        ).select_related("customer")

        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | Q(customer__company_name__icontains=search)
            )
        if stage_filter:
            queryset = queryset.filter(stage=stage_filter)
        if min_probability.isdigit():
            queryset = queryset.filter(probability__gte=int(min_probability))

        allowed_sorts = {
            "title",
            "-title",
            "stage",
            "-stage",
            "amount",
            "-amount",
            "probability",
            "-probability",
            "expected_close_date",
            "-expected_close_date",
            "created_at",
            "-created_at",
        }
        order_by = sort if sort in allowed_sorts else "-expected_close_date"
        return queryset.annotate(customer_name=F("customer__company_name")).order_by(order_by, "-id")

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        response.data["filters"] = {
            "stages": list(OPEN_OPPORTUNITY_STAGES),
            "min_probability_options": [0, 25, 50, 75],
        }
        return response


class SalesDashboardFollowUpQueueView(generics.ListAPIView):
    permission_classes = [IsAdministratorOrSalesRepresentative]
    serializer_class = SalesDashboardFollowUpRowSerializer
    pagination_class = DashboardPagination

    def get_queryset(self):
        if self.request.user.role == "ADMIN":
            raise PermissionDenied("Use the administrator dashboard endpoint.")

        sales_profile = self.request.user.sales_profile
        today = timezone.localdate()
        search = self.request.query_params.get("search", "").strip()
        status_filter = self.request.query_params.get("status", "").strip()
        type_filter = self.request.query_params.get("type", "").strip()
        sort = self.request.query_params.get("sort", "scheduled_at").strip()

        queryset = FollowUp.objects.filter(
            assigned_to=sales_profile,
            scheduled_at__date=today,
        ).select_related("opportunity", "lead", "customer")

        if search:
            queryset = queryset.filter(Q(subject__icontains=search) | Q(notes__icontains=search))
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if type_filter:
            queryset = queryset.filter(follow_up_type=type_filter)

        target_name_annotation = Coalesce(
            F("opportunity__title"),
            F("lead__company_name"),
            F("customer__company_name"),
        )

        allowed_sorts = {
            "scheduled_at",
            "-scheduled_at",
            "status",
            "-status",
            "follow_up_type",
            "-follow_up_type",
            "subject",
            "-subject",
        }
        order_by = sort if sort in allowed_sorts else "scheduled_at"
        return queryset.annotate(target_name=target_name_annotation).order_by(order_by, "id")

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        response.data["filters"] = {
            "statuses": ["PENDING", "COMPLETED", "CANCELED"],
            "types": ["CALL", "EMAIL", "MEETING", "TASK", "DEMO"],
        }
        return response
