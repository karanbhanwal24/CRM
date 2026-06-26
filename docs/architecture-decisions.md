# Architectural Decisions

## Monorepo Layout

- The project uses a single repository with `backend/` and `frontend/` top-level directories.
- This keeps the take-home submission easy to review, run, and package while preserving a clean boundary between API and SPA concerns.

## Django App Structure

- Backend domain logic is separated into `apps/users`, `apps/crm`, and `apps/core`.
- `core` contains cross-cutting primitives, `users` handles authentication/roles, and `crm` owns business entities and workflows.
- This supports modular growth without over-engineering microservices for a take-home scope.

## Custom User Model

- The app uses a custom `User` model early to avoid migration pain later.
- Role data lives directly on the user record for simpler authorization checks and JWT payload decisions.

## Sales Representative as Profile Model

- `SalesRepresentative` is a one-to-one extension of `User`.
- Authentication concerns stay on `User`, while sales-specific metadata stays in a domain-specific profile.

## API Design

- DRF generic views were used where standard CRUD behavior fits.
- Custom `APIView` endpoints were added for workflows such as assignment, stage changes, disable operations, and dashboard summaries.
- This balances speed of development with explicit workflow control.

## Authorization Strategy

- Coarse access is enforced with DRF permission classes.
- Fine-grained access is enforced with queryset scoping and owner checks.
- This avoids leaking records to unauthorized users and keeps object-level rules explicit.

## Validation Placement

- Core business invariants live in Django models via `clean()` and constraints.
- Request-shape and workflow validation live in serializers.
- This keeps invariants enforceable beyond the API layer while preserving good client error messages.

## Frontend Routing

- The frontend uses route-level pages under `src/pages/` and reusable building blocks under `src/components/`.
- This keeps route orchestration, domain UI, and low-level UI primitives clearly separated.

## State Management

- Authentication is handled in context because it is global, session-oriented state.
- React Query is used for dashboard data because it benefits from caching, background refetching, and pagination support.
- Simpler module pages still use local state and Axios directly, which was acceptable for the take-home timeline.

## UI State Standardization

- Reusable skeleton, empty, error, breadcrumb, theme, and confirmation components were added to reduce duplication.
- This improves consistency and makes future modules faster to build.

## Performance

- Lazy-loaded routes reduce the initial JavaScript cost.
- Shared query patterns on the dashboard keep expensive data requests isolated and cacheable.
- Backend dashboard endpoints aggregate data server-side to avoid chatty frontend composition.

## Delivery Artifacts

- Docker enables deterministic local and review environments.
- GitHub Actions enforces repeatable validation on push and pull request.
- OpenAPI and Postman improve reviewer onboarding and API discoverability.
