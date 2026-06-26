# Interview Questions

## Product and Domain

- Why did you separate customers, leads, opportunities, and follow-ups into distinct models?
- How does the lead-to-opportunity conversion flow preserve auditability?
- Why are won/lost opportunities immutable with respect to reopening?

## Backend

- Why did you choose Django REST Framework for this take-home?
- Why is authorization enforced both through permissions and filtered querysets?
- How would you scale the dashboard queries if the dataset grew significantly?
- Why did you keep modules inside `apps/` rather than a flatter Django project layout?
- How would you extend the API to support background jobs or async workflows?

## Frontend

- Why did you keep route pages separate from reusable components?
- Why was React Query introduced for dashboard data but not yet generalized across all modules?
- How do lazy loading and Suspense improve perceived performance here?
- Why did you create dedicated UI-state components for errors, empties, and skeletons?
- How does the theme provider persist dark/light mode safely?

## Delivery and Operations

- Why did you include Docker, GitHub Actions, Postman, and OpenAPI together?
- What would be your next production hardening steps after this take-home?
- How would you split this monorepo for a larger team or longer-lived product?
