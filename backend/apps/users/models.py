from decimal import Decimal

from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError
from django.core.validators import MaxValueValidator, MinValueValidator, RegexValidator
from django.db import models
from django.db.models import F, Q

from apps.core.models import TimeStampedModel


phone_validator = RegexValidator(
    regex=r"^\+?[1-9]\d{7,14}$",
    message="Phone number must be in E.164-compatible format.",
)

employee_id_validator = RegexValidator(
    regex=r"^[A-Z0-9-]{4,30}$",
    message="Employee ID must contain 4-30 uppercase letters, numbers, or hyphens.",
)


class UserRole(models.TextChoices):
    ADMIN = "ADMIN", "Admin"
    SALES_REP = "SALES_REP", "Sales Representative"


class User(TimeStampedModel, AbstractUser):
    email = models.EmailField(unique=True)
    phone_number = models.CharField(max_length=16, blank=True, validators=[phone_validator])
    role = models.CharField(max_length=20, choices=UserRole.choices, default=UserRole.SALES_REP)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    class Meta:
        ordering = ["email"]
        indexes = [
            models.Index(fields=["email"], name="user_email_idx"),
            models.Index(fields=["role"], name="user_role_idx"),
            models.Index(fields=["is_active"], name="user_active_idx"),
        ]

    def __str__(self) -> str:
        return self.email


class SalesRepresentativeStatus(models.TextChoices):
    ACTIVE = "ACTIVE", "Active"
    ON_LEAVE = "ON_LEAVE", "On Leave"
    INACTIVE = "INACTIVE", "Inactive"


class SalesRepresentative(TimeStampedModel):
    user = models.OneToOneField(
        "users.User",
        on_delete=models.CASCADE,
        related_name="sales_profile",
    )
    employee_id = models.CharField(max_length=30, unique=True, validators=[employee_id_validator])
    manager = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="direct_reports",
    )
    territory = models.CharField(max_length=120, blank=True)
    status = models.CharField(
        max_length=15,
        choices=SalesRepresentativeStatus.choices,
        default=SalesRepresentativeStatus.ACTIVE,
    )
    commission_rate = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal("0.00"),
        validators=[MinValueValidator(Decimal("0.00")), MaxValueValidator(Decimal("100.00"))],
    )
    hired_at = models.DateField(null=True, blank=True)

    class Meta:
        ordering = ["employee_id"]
        indexes = [
            models.Index(fields=["employee_id"], name="salesrep_emp_id_idx"),
            models.Index(fields=["status"], name="salesrep_status_idx"),
            models.Index(fields=["manager"], name="salesrep_manager_idx"),
        ]
        constraints = [
            models.CheckConstraint(
                condition=Q(commission_rate__gte=0) & Q(commission_rate__lte=100),
                name="salesrep_commission_range",
            ),
            models.CheckConstraint(
                condition=~Q(pk=F("manager")),
                name="salesrep_manager_not_self",
            ),
        ]

    def clean(self) -> None:
        super().clean()
        if self.user.role != UserRole.SALES_REP:
            raise ValidationError({"user": "Sales representatives must use a sales role."})

    def __str__(self) -> str:
        return f"{self.employee_id} - {self.user.get_full_name() or self.user.email}"
