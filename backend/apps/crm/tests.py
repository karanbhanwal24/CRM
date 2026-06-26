from django.core.exceptions import ValidationError
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.crm.models import Customer, FollowUp, Lead, Opportunity, OpportunityStage
from apps.users.models import SalesRepresentative, SalesRepresentativeStatus, User, UserRole


class SalesRepresentativeManagementApiTests(APITestCase):
    def setUp(self):
        self.admin_user = User.objects.create_user(
            username="admin@example.com",
            email="admin@example.com",
            password="AdminPass123",
            role=UserRole.ADMIN,
            is_staff=True,
        )
        self.sales_user = User.objects.create_user(
            username="rep@example.com",
            email="rep@example.com",
            password="SalesPass123",
            role=UserRole.SALES_REP,
        )
        self.sales_rep = SalesRepresentative.objects.create(
            user=self.sales_user,
            employee_id="REP-1001",
            status=SalesRepresentativeStatus.ACTIVE,
        )

    def test_admin_can_create_sales_representative(self):
        self.client.force_authenticate(user=self.admin_user)

        response = self.client.post(
            reverse("sales-representative-list-create"),
            {
                "first_name": "Mina",
                "last_name": "Shaw",
                "email": "mina.shaw@example.com",
                "phone_number": "+14155550123",
                "employee_id": "REP-2001",
                "territory": "North America",
                "status": SalesRepresentativeStatus.ACTIVE,
                "commission_rate": "8.50",
                "hired_at": "2026-01-15",
                "manager_id": self.sales_rep.id,
                "password": "StrongPass123",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        created_rep = SalesRepresentative.objects.select_related("user", "manager").get(employee_id="REP-2001")
        self.assertEqual(created_rep.user.email, "mina.shaw@example.com")
        self.assertEqual(created_rep.user.username, "mina.shaw@example.com")
        self.assertTrue(created_rep.user.check_password("StrongPass123"))
        self.assertEqual(created_rep.manager_id, self.sales_rep.id)

    def test_admin_can_disable_sales_representative(self):
        self.client.force_authenticate(user=self.admin_user)

        response = self.client.patch(
            reverse("sales-representative-disable", kwargs={"pk": self.sales_rep.id}),
            {},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.sales_rep.refresh_from_db()
        self.sales_user.refresh_from_db()
        self.assertEqual(self.sales_rep.status, SalesRepresentativeStatus.INACTIVE)
        self.assertFalse(self.sales_user.is_active)

    def test_sales_representative_cannot_access_admin_management_list(self):
        self.client.force_authenticate(user=self.sales_user)

        response = self.client.get(reverse("sales-representative-list-create"))

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class CrmModelUnitTests(APITestCase):
    def test_customer_requires_email_or_phone(self):
        customer = Customer(
            company_name="Atlas",
            contact_person="Jamie",
            email="",
            phone_number="",
            industry="SaaS",
            status="ACTIVE",
        )

        with self.assertRaises(ValidationError):
            customer.full_clean()

    def test_closed_opportunity_requires_closed_timestamp(self):
        owner_user = User.objects.create_user(
            username="unit-owner@example.com",
            email="unit-owner@example.com",
            password="StrongPass123",
            role=UserRole.SALES_REP,
        )
        owner_rep = SalesRepresentative.objects.create(
            user=owner_user,
            employee_id="REP-2100",
            status=SalesRepresentativeStatus.ACTIVE,
        )
        customer = Customer.objects.create(
            company_name="Unit Customer",
            contact_person="Taylor",
            email="unit.customer@example.com",
            phone_number="+14155550001",
            industry="Software",
            status="ACTIVE",
        )
        opportunity = Opportunity(
            title="Closed Deal",
            customer=customer,
            owner=owner_rep,
            stage=OpportunityStage.WON,
            amount="1000.00",
            probability=100,
        )

        with self.assertRaises(ValidationError):
            opportunity.full_clean()


class OpportunityManagementApiTests(APITestCase):
    def setUp(self):
        self.admin_user = User.objects.create_user(
            username="admin2@example.com",
            email="admin2@example.com",
            password="AdminPass123",
            role=UserRole.ADMIN,
            is_staff=True,
        )
        self.owner_user = User.objects.create_user(
            username="owner@example.com",
            email="owner@example.com",
            password="SalesPass123",
            role=UserRole.SALES_REP,
        )
        self.other_user = User.objects.create_user(
            username="other@example.com",
            email="other@example.com",
            password="SalesPass123",
            role=UserRole.SALES_REP,
        )
        self.owner_rep = SalesRepresentative.objects.create(
            user=self.owner_user,
            employee_id="REP-3001",
            status=SalesRepresentativeStatus.ACTIVE,
        )
        self.other_rep = SalesRepresentative.objects.create(
            user=self.other_user,
            employee_id="REP-3002",
            status=SalesRepresentativeStatus.ACTIVE,
        )
        self.lead = Lead.objects.create(
            company_name="Acme Labs",
            contact_person="Jamie Doe",
            email="jamie@acme.test",
            phone_number="+14155550124",
            source="INBOUND",
            priority="HIGH",
            status="QUALIFIED",
            assigned_to=self.owner_rep,
            created_by=self.admin_user,
        )

    def create_opportunity(self) -> Opportunity:
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post(
            reverse("opportunity-list-create"),
            {
                "title": "Acme Expansion",
                "lead_id": self.lead.id,
                "owner_id": self.owner_rep.id,
                "stage": OpportunityStage.QUALIFICATION,
                "amount": "25000.00",
                "probability": 40,
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        return Opportunity.objects.select_related("customer", "owner__user", "lead").get(pk=response.data["id"])

    def test_admin_can_convert_lead_to_opportunity(self):
        opportunity = self.create_opportunity()

        self.lead.refresh_from_db()
        self.assertEqual(opportunity.customer.company_name, self.lead.company_name)
        self.assertEqual(opportunity.owner_id, self.owner_rep.id)
        self.assertEqual(self.lead.status, "CONVERTED")
        self.assertEqual(self.lead.converted_customer_id, opportunity.customer_id)

    def test_non_owner_sales_representative_cannot_update_opportunity(self):
        opportunity = self.create_opportunity()
        self.client.force_authenticate(user=self.other_user)

        response = self.client.put(
            reverse("opportunity-detail", kwargs={"pk": opportunity.id}),
            {
                "title": "Blocked Update",
                "lead_id": self.lead.id,
                "stage": OpportunityStage.PROPOSAL,
                "amount": "28000.00",
                "probability": 50,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_closed_opportunity_cannot_move_back(self):
        opportunity = self.create_opportunity()
        self.client.force_authenticate(user=self.owner_user)

        close_response = self.client.patch(
            reverse("opportunity-stage-update", kwargs={"pk": opportunity.id}),
            {"stage": OpportunityStage.WON},
            format="json",
        )
        self.assertEqual(close_response.status_code, status.HTTP_200_OK)

        reopen_response = self.client.patch(
            reverse("opportunity-stage-update", kwargs={"pk": opportunity.id}),
            {"stage": OpportunityStage.NEGOTIATION},
            format="json",
        )
        self.assertEqual(reopen_response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_owner_can_add_follow_up_to_opportunity(self):
        opportunity = self.create_opportunity()
        self.client.force_authenticate(user=self.owner_user)

        response = self.client.post(
            reverse("opportunity-follow-up-list-create", kwargs={"pk": opportunity.id}),
            {
                "subject": "Proposal review",
                "notes": "Walk through pricing with stakeholder.",
                "follow_up_type": "MEETING",
                "status": "PENDING",
                "scheduled_at": "2026-07-01T10:00:00Z",
                "assigned_to_id": self.owner_rep.id,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(FollowUp.objects.filter(opportunity=opportunity).count(), 1)


class DashboardApiTests(APITestCase):
    def setUp(self):
        self.admin_user = User.objects.create_user(
            username="dashboard-admin@example.com",
            email="dashboard-admin@example.com",
            password="AdminPass123",
            role=UserRole.ADMIN,
            is_staff=True,
        )
        self.sales_user = User.objects.create_user(
            username="dashboard-rep@example.com",
            email="dashboard-rep@example.com",
            password="SalesPass123",
            role=UserRole.SALES_REP,
        )
        self.sales_rep = SalesRepresentative.objects.create(
            user=self.sales_user,
            employee_id="REP-4001",
            status=SalesRepresentativeStatus.ACTIVE,
            territory="West",
        )
        self.lead = Lead.objects.create(
            company_name="Northwind",
            contact_person="Sam Hill",
            email="sam@northwind.test",
            phone_number="+14155550125",
            source="REFERRAL",
            priority="HIGH",
            status="QUALIFIED",
            assigned_to=self.sales_rep,
            created_by=self.admin_user,
        )
        self.customer = Customer.objects.create(
            company_name="Northwind",
            contact_person="Sam Hill",
            email="sam.customer@northwind.test",
            phone_number="+14155550126",
            industry="Software",
            status="ACTIVE",
        )
        self.opportunity = Opportunity.objects.create(
            title="Northwind Renewal",
            customer=self.customer,
            lead=self.lead,
            owner=self.sales_rep,
            stage=OpportunityStage.PROPOSAL,
            amount="5000.00",
            probability=60,
        )
        FollowUp.objects.create(
            subject="Today's check-in",
            notes="Confirm proposal receipt.",
            follow_up_type="CALL",
            status="PENDING",
            scheduled_at=timezone.now(),
            assigned_to=self.sales_rep,
            created_by=self.admin_user,
            opportunity=self.opportunity,
        )

    def test_admin_dashboard_summary_returns_metrics(self):
        self.client.force_authenticate(user=self.admin_user)

        response = self.client.get(reverse("dashboard-admin-summary"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["metrics"]), 4)

    def test_admin_sales_performance_returns_paginated_rows(self):
        self.client.force_authenticate(user=self.admin_user)

        response = self.client.get(reverse("dashboard-admin-sales-performance"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)
        self.assertIn("filters", response.data)

    def test_sales_dashboard_summary_returns_assigned_metrics(self):
        self.client.force_authenticate(user=self.sales_user)

        response = self.client.get(reverse("dashboard-sales-summary"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["metrics"]), 4)

    def test_sales_dashboard_follow_ups_is_owner_scoped(self):
        self.client.force_authenticate(user=self.sales_user)

        response = self.client.get(reverse("dashboard-sales-follow-ups"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)
