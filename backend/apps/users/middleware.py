class UserRoleMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request.auth_role = getattr(getattr(request, "user", None), "role", None)
        return self.get_response(request)
