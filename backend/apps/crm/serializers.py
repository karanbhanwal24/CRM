from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from rest_framework import serializers

from apps.crm.models import (
    Customer,
    CustomerStatus,
    FollowUp,
    FollowUpStatus,
    FollowUpType,
    Lead,
    LeadStatus,
    Opportunity,
    OpportunityStage,
)
from apps.users.models import (
    SalesRepresentative,
    SalesRepresentativeStatus,
    User,
    UserRole,
)


class CustomerSerializer(serializers.ModelSerializer):
    phone = serializers.CharField(source="phone_number", required=False, allow_blank=True)

    class Meta:
        model = Customer
        fields = [
            "id",
            "company_name",
            "contact_person",
            "email",
            "phone",
            "industry",
            "status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate(self, attrs):
        instance = self.instance
        email = attrs.get("email", instance.email if instance else "")
        phone_number = attrs.get("phone_number", instance.phone_number if instance else "")
        company_name = attrs.get("company_name", instance.company_name if instance else "")
        contact_person = attrs.get("contact_person", instance.contact_person if instance else "")
        industry = attrs.get("industry", instance.industry if instance else "")

        if not email and not phone_number:
            raise serializers.ValidationError("At least one contact method is required: email or phone.")
        if not str(company_name).strip():
            raise serializers.ValidationError({"company_name": "Company name is required."})
        if not str(contact_person).strip():
            raise serializers.ValidationError({"contact_person": "Contact person is required."})
        if not str(industry).strip():
            raise serializers.ValidationError({"industry": "Industry is required."})
        return attrs


class SalesRepresentativeOptionSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)
    user_id = serializers.IntegerField(source="user.id", read_only=True)
    name = serializers.SerializerMethodField()
    email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = SalesRepresentative
        fields = ["id", "user_id", "employee_id", "name", "email", "status", "territory"]
        read_only_fields = fields

    def get_name(self, obj: SalesRepresentative) -> str:
        return obj.user.get_full_name() or obj.user.email


class SalesRepresentativeSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source="user.id", read_only=True)
    first_name = serializers.CharField(source="user.first_name")
    last_name = serializers.CharField(source="user.last_name", allow_blank=True, required=False)
    full_name = serializers.SerializerMethodField()
    email = serializers.EmailField(source="user.email")
    phone_number = serializers.CharField(source="user.phone_number", allow_blank=True, required=False)
    is_active = serializers.BooleanField(source="user.is_active", read_only=True)
    manager_id = serializers.PrimaryKeyRelatedField(
        source="manager",
        queryset=SalesRepresentative.objects.select_related("user").all(),
        allow_null=True,
        required=False,
        write_only=True,
    )
    manager = serializers.SerializerMethodField(read_only=True)
    lead_count = serializers.IntegerField(read_only=True)
    direct_reports_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = SalesRepresentative
        fields = [
            "id",
            "user_id",
            "first_name",
            "last_name",
            "full_name",
            "email",
            "phone_number",
            "employee_id",
            "territory",
            "status",
            "commission_rate",
            "hired_at",
            "manager_id",
            "manager",
            "is_active",
            "lead_count",
            "direct_reports_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "user_id",
            "full_name",
            "manager",
            "is_active",
            "lead_count",
            "direct_reports_count",
            "created_at",
            "updated_at",
        ]

    def get_full_name(self, obj: SalesRepresentative) -> str:
        return obj.user.get_full_name() or obj.user.email

    def get_manager(self, obj: SalesRepresentative) -> dict[str, str | int] | None:
        if not obj.manager_id:
            return None

        manager_user = obj.manager.user
        return {
            "id": obj.manager_id,
            "employee_id": obj.manager.employee_id,
            "name": manager_user.get_full_name() or manager_user.email,
        }

    def validate_email(self, value: str) -> str:
        normalized_email = value.strip().lower()
        queryset = User.objects.filter(email__iexact=normalized_email)
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.user_id)
        if queryset.exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return normalized_email

    def validate_employee_id(self, value: str) -> str:
        normalized_employee_id = value.strip().upper()
        queryset = SalesRepresentative.objects.filter(employee_id__iexact=normalized_employee_id)
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
        if queryset.exists():
            raise serializers.ValidationError("A representative with this employee ID already exists.")
        return normalized_employee_id

    def validate_first_name(self, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise serializers.ValidationError("First name is required.")
        return cleaned

    def validate_last_name(self, value: str) -> str:
        return value.strip()

    def validate_phone_number(self, value: str) -> str:
        return value.strip()

    def validate_territory(self, value: str) -> str:
        return value.strip()

    def validate(self, attrs):
        instance = self.instance
        manager = attrs.get("manager", instance.manager if instance else None)
        status_value = attrs.get("status", instance.status if instance else SalesRepresentativeStatus.ACTIVE)

        if instance and manager and manager.pk == instance.pk:
            raise serializers.ValidationError({"manager_id": "A representative cannot manage themselves."})

        if manager and manager.status == SalesRepresentativeStatus.INACTIVE:
            raise serializers.ValidationError({"manager_id": "Inactive representatives cannot be assigned as managers."})

        attrs["status"] = status_value
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        password = validated_data.pop("password")
        user_data = validated_data.pop("user")
        user = User.objects.create(
            username=user_data["email"],
            email=user_data["email"],
            first_name=user_data["first_name"],
            last_name=user_data.get("last_name", ""),
            phone_number=user_data.get("phone_number", ""),
            role=UserRole.SALES_REP,
            is_active=validated_data.get("status") != SalesRepresentativeStatus.INACTIVE,
        )
        user.set_password(password)
        user.save(update_fields=["password"])

        representative = SalesRepresentative.objects.create(user=user, **validated_data)
        return representative

    @transaction.atomic
    def update(self, instance: SalesRepresentative, validated_data):
        user_data = validated_data.pop("user", {})
        user = instance.user

        for field in ["first_name", "last_name", "email", "phone_number"]:
            if field in user_data:
                value = user_data[field]
                setattr(user, field, value)
                if field == "email":
                    user.username = value

        user.role = UserRole.SALES_REP
        next_status = validated_data.get("status", instance.status)
        user.is_active = next_status != SalesRepresentativeStatus.INACTIVE

        password = self.context["request"].data.get("password", "").strip()
        if password:
            user.set_password(password)

        user.save()

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


class SalesRepresentativeCreateSerializer(SalesRepresentativeSerializer):
    password = serializers.CharField(write_only=True, min_length=8, trim_whitespace=False)

    class Meta(SalesRepresentativeSerializer.Meta):
        fields = SalesRepresentativeSerializer.Meta.fields + ["password"]
        read_only_fields = SalesRepresentativeSerializer.Meta.read_only_fields


class SalesRepresentativeUpdateSerializer(SalesRepresentativeSerializer):
    password = serializers.CharField(write_only=True, min_length=8, trim_whitespace=False, required=False)

    class Meta(SalesRepresentativeSerializer.Meta):
        fields = SalesRepresentativeSerializer.Meta.fields + ["password"]
        read_only_fields = SalesRepresentativeSerializer.Meta.read_only_fields


class SalesRepresentativeDisableSerializer(serializers.Serializer):
    status = serializers.ChoiceField(
        choices=[SalesRepresentativeStatus.INACTIVE],
        default=SalesRepresentativeStatus.INACTIVE,
    )

    def update(self, instance: SalesRepresentative, validated_data):
        instance.status = SalesRepresentativeStatus.INACTIVE
        instance.save(update_fields=["status", "updated_at"])
        instance.user.is_active = False
        instance.user.save(update_fields=["is_active"])
        return instance

    def create(self, validated_data):
        raise NotImplementedError


class LeadSerializer(serializers.ModelSerializer):
    phone = serializers.CharField(source="phone_number", required=False, allow_blank=True)
    representative = SalesRepresentativeOptionSerializer(source="assigned_to", read_only=True)
    assigned_to_id = serializers.PrimaryKeyRelatedField(
        source="assigned_to",
        queryset=SalesRepresentative.objects.filter(
            Q(status=SalesRepresentativeStatus.ACTIVE) & Q(user__is_active=True)
        ),
        required=False,
        allow_null=True,
        write_only=True,
    )
    created_by_id = serializers.IntegerField(read_only=True)

    class Meta:
        model = Lead
        fields = [
            "id",
            "company_name",
            "contact_person",
            "email",
            "phone",
            "source",
            "priority",
            "status",
            "assigned_to_id",
            "representative",
            "created_by_id",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "representative", "created_by_id", "created_at", "updated_at"]

    def validate(self, attrs):
        instance = self.instance
        email = attrs.get("email", instance.email if instance else "")
        phone_number = attrs.get("phone_number", instance.phone_number if instance else "")
        company_name = attrs.get("company_name", instance.company_name if instance else "")
        contact_person = attrs.get("contact_person", instance.contact_person if instance else "")

        if not email and not phone_number:
            raise serializers.ValidationError("At least one contact method is required: email or phone.")
        if not str(company_name).strip():
            raise serializers.ValidationError({"company_name": "Company name is required."})
        if not str(contact_person).strip():
            raise serializers.ValidationError({"contact_person": "Contact person is required."})
        return attrs

    def create(self, validated_data):
        validated_data["created_by"] = self.context["request"].user
        return super().create(validated_data)


class LeadAssignSerializer(serializers.Serializer):
    assigned_to_id = serializers.PrimaryKeyRelatedField(
        source="assigned_to",
        queryset=SalesRepresentative.objects.filter(
            Q(status=SalesRepresentativeStatus.ACTIVE) & Q(user__is_active=True)
        ),
        allow_null=True,
    )


class OpportunityLeadSummarySerializer(serializers.ModelSerializer):
    representative = SalesRepresentativeOptionSerializer(source="assigned_to", read_only=True)

    class Meta:
        model = Lead
        fields = ["id", "company_name", "contact_person", "status", "priority", "representative"]
        read_only_fields = fields


class OpportunityCustomerSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = ["id", "company_name", "contact_person", "status"]
        read_only_fields = fields


class OpportunityFollowUpSerializer(serializers.ModelSerializer):
    assigned_to = SalesRepresentativeOptionSerializer(read_only=True)
    assigned_to_id = serializers.PrimaryKeyRelatedField(
        source="assigned_to",
        queryset=SalesRepresentative.objects.filter(
            Q(status=SalesRepresentativeStatus.ACTIVE) & Q(user__is_active=True)
        ),
        write_only=True,
    )
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = FollowUp
        fields = [
            "id",
            "subject",
            "notes",
            "follow_up_type",
            "status",
            "scheduled_at",
            "completed_at",
            "assigned_to",
            "assigned_to_id",
            "created_by_name",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "assigned_to", "created_by_name", "created_at", "updated_at"]

    def get_created_by_name(self, obj: FollowUp) -> str:
        if not obj.created_by:
            return "System"
        return obj.created_by.get_full_name() or obj.created_by.email

    def validate(self, attrs):
        status_value = attrs.get("status", getattr(self.instance, "status", FollowUpStatus.PENDING))
        scheduled_at = attrs.get("scheduled_at", getattr(self.instance, "scheduled_at", None))
        completed_at = attrs.get("completed_at", getattr(self.instance, "completed_at", None))

        if status_value == FollowUpStatus.COMPLETED and not completed_at:
            attrs["completed_at"] = timezone.now()
        elif status_value != FollowUpStatus.COMPLETED:
            attrs["completed_at"] = None

        if scheduled_at and attrs.get("completed_at") and attrs["completed_at"] < scheduled_at:
            raise serializers.ValidationError({"completed_at": "Completion time cannot be earlier than scheduled time."})
        return attrs


class OpportunitySerializer(serializers.ModelSerializer):
    customer = OpportunityCustomerSummarySerializer(read_only=True)
    lead = OpportunityLeadSummarySerializer(read_only=True)
    owner = SalesRepresentativeOptionSerializer(read_only=True)
    customer_id = serializers.PrimaryKeyRelatedField(
        queryset=Customer.objects.all(),
        source="customer",
        write_only=True,
        required=False,
        allow_null=True,
    )
    lead_id = serializers.PrimaryKeyRelatedField(
        queryset=Lead.objects.select_related("assigned_to__user", "converted_customer").all(),
        source="lead",
        write_only=True,
        required=False,
        allow_null=True,
    )
    owner_id = serializers.PrimaryKeyRelatedField(
        queryset=SalesRepresentative.objects.filter(
            Q(status=SalesRepresentativeStatus.ACTIVE) & Q(user__is_active=True)
        ),
        source="owner",
        write_only=True,
        required=False,
    )
    follow_up_history = OpportunityFollowUpSerializer(source="follow_ups", many=True, read_only=True)
    follow_up_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Opportunity
        fields = [
            "id",
            "title",
            "customer",
            "customer_id",
            "lead",
            "lead_id",
            "owner",
            "owner_id",
            "stage",
            "amount",
            "probability",
            "expected_close_date",
            "closed_at",
            "follow_up_count",
            "follow_up_history",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "customer",
            "lead",
            "owner",
            "closed_at",
            "follow_up_count",
            "follow_up_history",
            "created_at",
            "updated_at",
        ]

    def validate_stage(self, value: str) -> str:
        allowed_stages = {
            OpportunityStage.QUALIFICATION,
            OpportunityStage.PROPOSAL,
            OpportunityStage.NEGOTIATION,
            OpportunityStage.WON,
            OpportunityStage.LOST,
        }
        if value not in allowed_stages:
            raise serializers.ValidationError("Invalid opportunity stage.")
        return value

    def validate(self, attrs):
        request = self.context["request"]
        instance = self.instance
        lead = attrs.get("lead", getattr(instance, "lead", None))
        customer = attrs.get("customer", getattr(instance, "customer", None))
        owner = attrs.get("owner", getattr(instance, "owner", None))
        next_stage = attrs.get("stage", getattr(instance, "stage", OpportunityStage.QUALIFICATION))

        if not lead and not customer:
            raise serializers.ValidationError("An opportunity requires a lead conversion or an existing customer.")

        if request.user.role == UserRole.SALES_REP:
            sales_profile = getattr(request.user, "sales_profile", None)
            if not sales_profile:
                raise serializers.ValidationError("Sales representative profile is required.")
            if owner and owner.pk != sales_profile.pk:
                raise serializers.ValidationError({"owner_id": "You can only create or update your own opportunities."})
            attrs["owner"] = sales_profile
            if lead and lead.assigned_to_id and lead.assigned_to_id != sales_profile.pk:
                raise serializers.ValidationError({"lead_id": "You can only convert leads assigned to you."})

        if lead and not owner:
            if lead.assigned_to:
                attrs["owner"] = lead.assigned_to
            elif request.user.role == UserRole.SALES_REP:
                attrs["owner"] = request.user.sales_profile

        if not attrs.get("owner", owner):
            raise serializers.ValidationError({"owner_id": "An assigned sales representative is required."})

        if instance and instance.stage in {OpportunityStage.WON, OpportunityStage.LOST} and next_stage != instance.stage:
            raise serializers.ValidationError({"stage": "Won or lost opportunities cannot move back to an open stage."})

        if next_stage in {OpportunityStage.WON, OpportunityStage.LOST}:
            attrs["closed_at"] = instance.closed_at if instance and instance.closed_at else timezone.now()
        else:
            attrs["closed_at"] = None

        return attrs

    @transaction.atomic
    def create(self, validated_data):
        lead = validated_data.get("lead")
        customer = validated_data.get("customer")

        if lead:
            if lead.status == LeadStatus.CONVERTED or lead.opportunities.exists():
                raise serializers.ValidationError({"lead_id": "This lead has already been converted into an opportunity."})

            if lead.converted_customer:
                validated_data["customer"] = lead.converted_customer
            elif not customer:
                validated_data["customer"] = Customer.objects.create(
                    company_name=lead.company_name,
                    contact_person=lead.contact_person,
                    email=lead.email,
                    phone_number=lead.phone_number,
                    industry="General",
                    status=CustomerStatus.ACTIVE,
                )

            lead.converted_customer = validated_data["customer"]
            lead.status = LeadStatus.CONVERTED
            lead.save(update_fields=["converted_customer", "status", "updated_at"])

        return super().create(validated_data)


class OpportunityStageUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Opportunity
        fields = ["stage"]

    def validate_stage(self, value: str) -> str:
        if self.instance.stage in {OpportunityStage.WON, OpportunityStage.LOST} and value != self.instance.stage:
            raise serializers.ValidationError("Won or lost opportunities cannot move back.")
        return value

    def update(self, instance: Opportunity, validated_data):
        instance.stage = validated_data["stage"]
        instance.closed_at = timezone.now() if instance.stage in {OpportunityStage.WON, OpportunityStage.LOST} else None
        instance.save(update_fields=["stage", "closed_at", "updated_at"])
        return instance
