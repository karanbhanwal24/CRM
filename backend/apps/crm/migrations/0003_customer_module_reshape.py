from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("crm", "0002_initial"),
    ]

    operations = [
        migrations.AlterModelOptions(
            name="customer",
            options={"ordering": ["company_name"]},
        ),
        migrations.RemoveIndex(
            model_name="customer",
            name="customer_name_idx",
        ),
        migrations.RemoveIndex(
            model_name="customer",
            name="customer_owner_status_idx",
        ),
        migrations.RemoveField(
            model_name="customer",
            name="customer_type",
        ),
        migrations.RemoveField(
            model_name="customer",
            name="owner",
        ),
        migrations.RemoveField(
            model_name="customer",
            name="source",
        ),
        migrations.RemoveField(
            model_name="customer",
            name="website",
        ),
        migrations.RenameField(
            model_name="customer",
            old_name="name",
            new_name="contact_person",
        ),
        migrations.AddField(
            model_name="customer",
            name="industry",
            field=models.CharField(default="", max_length=120),
            preserve_default=False,
        ),
        migrations.AlterField(
            model_name="customer",
            name="company_name",
            field=models.CharField(max_length=255),
        ),
        migrations.AddIndex(
            model_name="customer",
            index=models.Index(fields=["company_name"], name="customer_company_idx"),
        ),
        migrations.AddIndex(
            model_name="customer",
            index=models.Index(fields=["contact_person"], name="customer_contact_idx"),
        ),
        migrations.AddIndex(
            model_name="customer",
            index=models.Index(fields=["industry"], name="customer_industry_idx"),
        ),
    ]
