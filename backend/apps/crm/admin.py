from django.contrib import admin

from apps.crm.models import Customer


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ("company_name", "contact_person", "industry", "status", "email", "phone_number")
    list_filter = ("status", "industry")
    search_fields = ("company_name", "contact_person", "email", "phone_number", "industry")
