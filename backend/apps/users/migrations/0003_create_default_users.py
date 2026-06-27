from django.db import migrations


def create_users(apps, schema_editor):
    User = apps.get_model("users", "User")
    SalesRepresentative = apps.get_model("users", "SalesRepresentative")

    # Create Admin User
    admin_user = User.objects.create_user(
        email="admin@example.com",
        username="admin",
        password="Admin@123",
        role="ADMIN",
        is_staff=True,
        is_superuser=True,
    )

    # Create Sales Representative User
    sales_rep_user = User.objects.create_user(
        email="salesrep@example.com",
        username="salesrep",
        password="Sales@123",
        role="SALES_REP",
        is_staff=False,
        is_superuser=False,
    )

    SalesRepresentative.objects.create(
        user=sales_rep_user,
        employee_id="SR001",
    )


def reverse_users(apps, schema_editor):
    User = apps.get_model("users", "User")
    User.objects.filter(
        email__in=["admin@example.com", "salesrep@example.com"]
    ).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0002_alter_user_role"),
    ]

    operations = [
        migrations.RunPython(create_users, reverse_users),
    ]