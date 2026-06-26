import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("crm", "0003_customer_module_reshape"),
    ]

    operations = [
        migrations.AlterModelOptions(
            name="lead",
            options={"ordering": ["company_name", "id"]},
        ),
        migrations.RemoveIndex(
            model_name="lead",
            name="lead_status_idx",
        ),
        migrations.RemoveIndex(
            model_name="lead",
            name="lead_source_idx",
        ),
        migrations.RemoveIndex(
            model_name="lead",
            name="lead_owner_status_idx",
        ),
        migrations.RemoveConstraint(
            model_name="lead",
            name="lead_estimated_value_non_negative",
        ),
        migrations.RemoveField(
            model_name="lead",
            name="estimated_value",
        ),
        migrations.RemoveField(
            model_name="lead",
            name="last_name",
        ),
        migrations.RenameField(
            model_name="lead",
            old_name="first_name",
            new_name="contact_person",
        ),
        migrations.AlterField(
            model_name="lead",
            name="contact_person",
            field=models.CharField(max_length=255),
        ),
        migrations.AddField(
            model_name="lead",
            name="priority",
            field=models.CharField(
                choices=[("LOW", "Low"), ("MEDIUM", "Medium"), ("HIGH", "High"), ("URGENT", "Urgent")],
                default="MEDIUM",
                max_length=10,
            ),
        ),
        migrations.AlterField(
            model_name="lead",
            name="assigned_to",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="leads",
                to="users.salesrepresentative",
            ),
        ),
        migrations.AlterField(
            model_name="lead",
            name="company_name",
            field=models.CharField(max_length=255),
        ),
        migrations.AddIndex(
            model_name="lead",
            index=models.Index(fields=["company_name"], name="lead_company_idx"),
        ),
        migrations.AddIndex(
            model_name="lead",
            index=models.Index(fields=["contact_person"], name="lead_contact_idx"),
        ),
        migrations.AddIndex(
            model_name="lead",
            index=models.Index(fields=["status"], name="lead_status_idx"),
        ),
        migrations.AddIndex(
            model_name="lead",
            index=models.Index(fields=["priority"], name="lead_priority_idx"),
        ),
        migrations.AddIndex(
            model_name="lead",
            index=models.Index(fields=["source"], name="lead_source_idx"),
        ),
        migrations.AddIndex(
            model_name="lead",
            index=models.Index(fields=["assigned_to", "status"], name="lead_owner_status_idx"),
        ),
    ]
