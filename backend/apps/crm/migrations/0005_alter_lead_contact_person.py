from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("crm", "0004_lead_module_reshape"),
    ]

    operations = [
        migrations.AlterField(
            model_name="lead",
            name="contact_person",
            field=models.CharField(max_length=255),
        ),
    ]
