from decimal import Decimal

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import MaxValueValidator, MinValueValidator, RegexValidator
from django.db import models
from django.db.models import Q
from django.db.models.functions import Lower

from apps.core.models import TimeStampedModel


phone_validator = RegexValidator(
    regex=r"^\+?[1-9]\d{7,14}$",
    message="Phone number must be in E.164-compatible format.",
)


class CustomerStatus(models.TextChoices):
    ACTIVE = "ACTIVE", "Active"
    INACTIVE = "INACTIVE", "Inactive"
    CHURNED = "CHURNED", "Churned"


class RecordSource(models.TextChoices):
    WEBSITE = "WEBSITE", "Website"
    REFERRAL = "REFERRAL", "Referral"
    CAMPAIGN = "CAMPAIGN", "Campaign"
    INBOUND = "INBOUND", "Inbound"
    OUTBOUND = "OUTBOUND", "Outbound"


class LeadStatus(models.TextChoices):
    NEW = "NEW", "New"
    CONTACTED = "CONTACTED", "Contacted"
    QUALIFIED = "QUALIFIED", "Qualified"
    UNQUALIFIED = "UNQUALIFIED", "Unqualified"
    CONVERTED = "CONVERTED", "Converted"
    LOST = "LOST", "Lost"


class LeadPriority(models.TextChoices):
    LOW = "LOW", "Low"
    MEDIUM = "MEDIUM", "Medium"
    HIGH = "HIGH", "High"
    URGENT = "URGENT", "Urgent"


class OpportunityStage(models.TextChoices):
    QUALIFICATION = "QUALIFICATION", "Qualification"
    PROPOSAL = "PROPOSAL", "Proposal"
    NEGOTIATION = "NEGOTIATION", "Negotiation"
    WON = "WON", "Won"
    LOST = "LOST", "Lost"


class FollowUpType(models.TextChoices):
    CALL = "CALL", "Call"
    EMAIL = "EMAIL", "Email"
    MEETING = "MEETING", "Meeting"
    TASK = "TASK", "Task"
    DEMO = "DEMO", "Demo"


class FollowUpStatus(models.TextChoices):
    PENDING = "PENDING", "Pending"
    COMPLETED = "COMPLETED", "Completed"
    CANCELED = "CANCELED", "Canceled"


class Customer(TimeStampedModel):
    company_name = models.CharField(max_length=255)
    contact_person = models.CharField(max_length=255)
    email = models.EmailField(blank=True)
    phone_number = models.CharField(max_length=16, blank=True, validators=[phone_validator])
    industry = models.CharField(max_length=120)
    status = models.CharField(max_length=10, choices=CustomerStatus.choices, default=CustomerStatus.ACTIVE)

    class Meta:
        ordering = ["company_name"]
        indexes = [
            models.Index(fields=["company_name"], name="customer_company_idx"),
            models.Index(fields=["contact_person"], name="customer_contact_idx"),
            models.Index(fields=["industry"], name="customer_industry_idx"),
            models.Index(fields=["status"], name="customer_status_idx"),
        ]
        constraints = [
            models.CheckConstraint(
                condition=~(Q(email="") & Q(phone_number="")),
                name="customer_contact_required",
            ),
            models.UniqueConstraint(
                Lower("email"),
                name="customer_email_ci_unique",
                condition=~Q(email=""),
            ),
        ]

    def clean(self) -> None:
        super().clean()
        if not self.company_name.strip():
            raise ValidationError({"company_name": "Company name is required."})
        if not self.contact_person.strip():
            raise ValidationError({"contact_person": "Contact person is required."})
        if not self.industry.strip():
            raise ValidationError({"industry": "Industry is required."})

    def __str__(self) -> str:
        return self.company_name


class Lead(TimeStampedModel):
    company_name = models.CharField(max_length=255)
    contact_person = models.CharField(max_length=255)
    email = models.EmailField(blank=True)
    phone_number = models.CharField(max_length=16, blank=True, validators=[phone_validator])
    source = models.CharField(max_length=10, choices=RecordSource.choices, default=RecordSource.INBOUND)
    priority = models.CharField(max_length=10, choices=LeadPriority.choices, default=LeadPriority.MEDIUM)
    status = models.CharField(max_length=12, choices=LeadStatus.choices, default=LeadStatus.NEW)
    assigned_to = models.ForeignKey(
        "users.SalesRepresentative",
        on_delete=models.PROTECT,
        related_name="leads",
        null=True,
        blank=True,
    )
    converted_customer = models.OneToOneField(
        "crm.Customer",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="source_lead",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_leads",
    )

    class Meta:
        ordering = ["company_name", "id"]
        indexes = [
            models.Index(fields=["company_name"], name="lead_company_idx"),
            models.Index(fields=["contact_person"], name="lead_contact_idx"),
            models.Index(fields=["status"], name="lead_status_idx"),
            models.Index(fields=["priority"], name="lead_priority_idx"),
            models.Index(fields=["source"], name="lead_source_idx"),
            models.Index(fields=["assigned_to", "status"], name="lead_owner_status_idx"),
        ]
        constraints = [
            models.CheckConstraint(
                condition=~(Q(email="") & Q(phone_number="")),
                name="lead_contact_required",
            ),
        ]

    def clean(self) -> None:
        super().clean()
        if not self.company_name.strip():
            raise ValidationError({"company_name": "Company name is required."})
        if not self.contact_person.strip():
            raise ValidationError({"contact_person": "Contact person is required."})
        if self.status == LeadStatus.CONVERTED and not self.converted_customer:
            raise ValidationError({"converted_customer": "Converted leads must point to a customer."})
        if self.converted_customer and self.status != LeadStatus.CONVERTED:
            raise ValidationError({"status": "Leads linked to a customer must be marked converted."})

    def __str__(self) -> str:
        return self.company_name


class Opportunity(TimeStampedModel):
    title = models.CharField(max_length=255)
    customer = models.ForeignKey(
        "crm.Customer",
        on_delete=models.PROTECT,
        related_name="opportunities",
    )
    lead = models.ForeignKey(
        "crm.Lead",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="opportunities",
    )
    owner = models.ForeignKey(
        "users.SalesRepresentative",
        on_delete=models.PROTECT,
        related_name="opportunities",
    )
    stage = models.CharField(
        max_length=15,
        choices=OpportunityStage.choices,
        default=OpportunityStage.QUALIFICATION,
    )
    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.00"))],
    )
    probability = models.PositiveSmallIntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
    )
    expected_close_date = models.DateField(null=True, blank=True)
    closed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["stage"], name="opportunity_stage_idx"),
            models.Index(fields=["owner", "stage"], name="opportunity_owner_stage_idx"),
            models.Index(fields=["customer", "stage"], name="opportunity_customer_stage_idx"),
        ]
        constraints = [
            models.CheckConstraint(
                condition=Q(amount__gte=0),
                name="opportunity_amount_non_negative",
            ),
            models.CheckConstraint(
                condition=Q(probability__gte=0) & Q(probability__lte=100),
                name="opportunity_probability_range",
            ),
        ]

    def clean(self) -> None:
        super().clean()
        if self.stage in {OpportunityStage.WON, OpportunityStage.LOST} and not self.closed_at:
            raise ValidationError({"closed_at": "Closed opportunities must include a closed timestamp."})
        if self.closed_at and self.stage not in {OpportunityStage.WON, OpportunityStage.LOST}:
            raise ValidationError({"stage": "Only won or lost opportunities can have a closed timestamp."})
        if self.lead and self.lead.converted_customer and self.lead.converted_customer_id != self.customer_id:
            raise ValidationError({"customer": "Opportunity customer must match the lead's converted customer."})

    def __str__(self) -> str:
        return self.title


class FollowUp(TimeStampedModel):
    subject = models.CharField(max_length=255)
    notes = models.TextField(blank=True)
    follow_up_type = models.CharField(max_length=10, choices=FollowUpType.choices)
    status = models.CharField(max_length=10, choices=FollowUpStatus.choices, default=FollowUpStatus.PENDING)
    scheduled_at = models.DateTimeField()
    completed_at = models.DateTimeField(null=True, blank=True)
    assigned_to = models.ForeignKey(
        "users.SalesRepresentative",
        on_delete=models.PROTECT,
        related_name="follow_ups",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_follow_ups",
    )
    customer = models.ForeignKey(
        "crm.Customer",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="follow_ups",
    )
    lead = models.ForeignKey(
        "crm.Lead",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="follow_ups",
    )
    opportunity = models.ForeignKey(
        "crm.Opportunity",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="follow_ups",
    )

    class Meta:
        ordering = ["scheduled_at"]
        indexes = [
            models.Index(fields=["status", "scheduled_at"], name="followup_status_scheduled_idx"),
            models.Index(fields=["assigned_to", "status"], name="followup_assignee_status_idx"),
            models.Index(fields=["follow_up_type"], name="followup_type_idx"),
        ]
        constraints = [
            models.CheckConstraint(
                condition=(
                    (Q(customer__isnull=False) & Q(lead__isnull=True) & Q(opportunity__isnull=True))
                    | (Q(customer__isnull=True) & Q(lead__isnull=False) & Q(opportunity__isnull=True))
                    | (Q(customer__isnull=True) & Q(lead__isnull=True) & Q(opportunity__isnull=False))
                ),
                name="followup_exactly_one_target",
            ),
        ]

    def clean(self) -> None:
        super().clean()
        targets = [self.customer_id, self.lead_id, self.opportunity_id]
        if sum(1 for target in targets if target) != 1:
            raise ValidationError("Follow-up must be linked to exactly one target record.")
        if self.status == FollowUpStatus.COMPLETED and not self.completed_at:
            raise ValidationError({"completed_at": "Completed follow-ups must include a completion timestamp."})
        if self.completed_at and self.status != FollowUpStatus.COMPLETED:
            raise ValidationError({"status": "Only completed follow-ups can have a completion timestamp."})
        if self.completed_at and self.completed_at < self.scheduled_at:
            raise ValidationError({"completed_at": "Completion time cannot be earlier than scheduled time."})

    def __str__(self) -> str:
        return self.subject
