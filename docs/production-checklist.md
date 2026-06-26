# Production Checklist

- Replace `DJANGO_SECRET_KEY` with a secure secret.
- Set `DJANGO_DEBUG=False`.
- Restrict `DJANGO_ALLOWED_HOSTS` to real domains.
- Restrict `DJANGO_CORS_ALLOWED_ORIGINS` to trusted frontends.
- Use a managed PostgreSQL database with backups enabled.
- Enforce HTTPS and TLS termination at the proxy/load balancer.
- Review JWT token lifetimes for your risk profile.
- Add structured logging and centralized log aggregation.
- Add monitoring and uptime checks for backend, frontend, and database.
- Configure error reporting such as Sentry.
- Run `python manage.py check` and the full test suite before deployment.
- Run `npm run test:run` and `npm run build` before deployment.
- Generate and verify `docs/openapi.yaml`.
- Review admin credentials and seed/demo accounts.
- Verify static assets and cache headers.
- Confirm database migration rollback strategy.
