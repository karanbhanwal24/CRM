from django.contrib import admin

from apps.users.models import SalesRepresentative, User


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ("email", "username", "role", "is_active", "is_staff")
    list_filter = ("role", "is_active", "is_staff")
    search_fields = ("email", "username", "first_name", "last_name")


@admin.register(SalesRepresentative)
class SalesRepresentativeAdmin(admin.ModelAdmin):
    list_display = ("employee_id", "user", "status", "manager", "territory")
    list_filter = ("status", "territory")
    search_fields = ("employee_id", "user__email", "user__first_name", "user__last_name")
