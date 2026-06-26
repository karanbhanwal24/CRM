from rest_framework import serializers


class DashboardMetricSerializer(serializers.Serializer):
    label = serializers.CharField()
    value = serializers.IntegerField()
    detail = serializers.CharField(required=False, allow_blank=True)


class ChartDatumSerializer(serializers.Serializer):
    label = serializers.CharField()
    value = serializers.FloatField()


class SalesPerformanceRowSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    employee_id = serializers.CharField()
    name = serializers.CharField()
    email = serializers.EmailField()
    territory = serializers.CharField(allow_blank=True)
    status = serializers.CharField()
    assigned_customers = serializers.IntegerField()
    active_leads = serializers.IntegerField()
    open_opportunities = serializers.IntegerField()
    won_revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    followups_today = serializers.IntegerField()


class AdminDashboardSummarySerializer(serializers.Serializer):
    metrics = DashboardMetricSerializer(many=True)
    opportunity_stage_chart = ChartDatumSerializer(many=True)
    lead_status_chart = ChartDatumSerializer(many=True)


class SalesDashboardSummarySerializer(serializers.Serializer):
    metrics = DashboardMetricSerializer(many=True)
    pipeline_stage_chart = ChartDatumSerializer(many=True)
    follow_up_status_chart = ChartDatumSerializer(many=True)


class SalesDashboardOpportunityRowSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    title = serializers.CharField()
    customer_name = serializers.CharField()
    stage = serializers.CharField()
    amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    probability = serializers.IntegerField()
    expected_close_date = serializers.DateField(allow_null=True)
    created_at = serializers.DateTimeField()


class SalesDashboardFollowUpRowSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    subject = serializers.CharField()
    target_name = serializers.CharField()
    follow_up_type = serializers.CharField()
    status = serializers.CharField()
    scheduled_at = serializers.DateTimeField()
    completed_at = serializers.DateTimeField(allow_null=True)
    notes = serializers.CharField(allow_blank=True)
