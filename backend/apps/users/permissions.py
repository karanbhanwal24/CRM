from rest_framework.permissions import BasePermission

from apps.users.models import UserRole


class IsAdministrator(BasePermission):
    message = "Administrator access is required."

    def has_permission(self, request, view) -> bool:
        return bool(request.user and request.user.is_authenticated and request.user.role == UserRole.ADMIN)


class IsSalesRepresentative(BasePermission):
    message = "Sales representative access is required."

    def has_permission(self, request, view) -> bool:
        return bool(
            request.user and request.user.is_authenticated and request.user.role == UserRole.SALES_REP
        )


class IsAdministratorOrSalesRepresentative(BasePermission):
    message = "Administrator or sales representative access is required."

    def has_permission(self, request, view) -> bool:
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role in {UserRole.ADMIN, UserRole.SALES_REP}
        )
