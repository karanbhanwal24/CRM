import { lazy, Suspense } from "react";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { ProtectedRoute } from "../components/auth/protected-route";
import { PageSectionSkeleton } from "../components/ui/states";

const DashboardPage = lazy(async () => ({ default: (await import("../pages/dashboard")).DashboardPage }));
const LoginPage = lazy(async () => ({ default: (await import("../pages/login")).LoginPage }));
const ForbiddenPage = lazy(async () => ({ default: (await import("../pages/forbidden")).ForbiddenPage }));
const NotFoundPage = lazy(async () => ({ default: (await import("../pages/not-found")).NotFoundPage }));
const CustomerCreatePage = lazy(async () => ({ default: (await import("../pages/customers/customer-create")).CustomerCreatePage }));
const CustomerDetailsPage = lazy(async () => ({ default: (await import("../pages/customers/customer-details")).CustomerDetailsPage }));
const CustomerEditPage = lazy(async () => ({ default: (await import("../pages/customers/customer-edit")).CustomerEditPage }));
const CustomerListPage = lazy(async () => ({ default: (await import("../pages/customers/customer-list")).CustomerListPage }));
const LeadCreatePage = lazy(async () => ({ default: (await import("../pages/leads/lead-create")).LeadCreatePage }));
const LeadDetailsPage = lazy(async () => ({ default: (await import("../pages/leads/lead-details")).LeadDetailsPage }));
const LeadEditPage = lazy(async () => ({ default: (await import("../pages/leads/lead-edit")).LeadEditPage }));
const LeadListPage = lazy(async () => ({ default: (await import("../pages/leads/lead-list")).LeadListPage }));
const OpportunityCreatePage = lazy(async () => ({ default: (await import("../pages/opportunities/opportunity-create")).OpportunityCreatePage }));
const OpportunityDetailsPage = lazy(async () => ({ default: (await import("../pages/opportunities/opportunity-details")).OpportunityDetailsPage }));
const OpportunityEditPage = lazy(async () => ({ default: (await import("../pages/opportunities/opportunity-edit")).OpportunityEditPage }));
const OpportunityListPage = lazy(async () => ({ default: (await import("../pages/opportunities/opportunity-list")).OpportunityListPage }));
const RepresentativeCreatePage = lazy(async () => ({ default: (await import("../pages/representatives/representative-create")).RepresentativeCreatePage }));
const RepresentativeDetailsPage = lazy(async () => ({ default: (await import("../pages/representatives/representative-details")).RepresentativeDetailsPage }));
const RepresentativeEditPage = lazy(async () => ({ default: (await import("../pages/representatives/representative-edit")).RepresentativeEditPage }));
const RepresentativeListPage = lazy(async () => ({ default: (await import("../pages/representatives/representative-list")).RepresentativeListPage }));

const router = createBrowserRouter([
  {
    path: "/login",
    element: withSuspense(<LoginPage />),
  },
  {
    path: "/forbidden",
    element: withSuspense(<ForbiddenPage />),
  },
  {
    element: <ProtectedRoute allowedRoles={["ADMIN", "SALES_REP"]} />,
    children: [
      {
        path: "/",
        element: withSuspense(<DashboardPage />),
      },
      {
        path: "/leads",
        element: withSuspense(<LeadListPage />),
      },
      {
        path: "/leads/new",
        element: withSuspense(<LeadCreatePage />),
      },
      {
        path: "/leads/:leadId",
        element: withSuspense(<LeadDetailsPage />),
      },
      {
        path: "/leads/:leadId/edit",
        element: withSuspense(<LeadEditPage />),
      },
      {
        path: "/opportunities",
        element: withSuspense(<OpportunityListPage />),
      },
      {
        path: "/opportunities/new",
        element: withSuspense(<OpportunityCreatePage />),
      },
      {
        path: "/opportunities/:opportunityId",
        element: withSuspense(<OpportunityDetailsPage />),
      },
      {
        path: "/opportunities/:opportunityId/edit",
        element: withSuspense(<OpportunityEditPage />),
      },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={["ADMIN"]} />,
    children: [
      {
        path: "/customers",
        element: withSuspense(<CustomerListPage />),
      },
      {
        path: "/customers/new",
        element: withSuspense(<CustomerCreatePage />),
      },
      {
        path: "/customers/:customerId",
        element: withSuspense(<CustomerDetailsPage />),
      },
      {
        path: "/customers/:customerId/edit",
        element: withSuspense(<CustomerEditPage />),
      },
      {
        path: "/sales-representatives",
        element: withSuspense(<RepresentativeListPage />),
      },
      {
        path: "/sales-representatives/new",
        element: withSuspense(<RepresentativeCreatePage />),
      },
      {
        path: "/sales-representatives/:representativeId",
        element: withSuspense(<RepresentativeDetailsPage />),
      },
      {
        path: "/sales-representatives/:representativeId/edit",
        element: withSuspense(<RepresentativeEditPage />),
      },
    ],
  },
  {
    path: "*",
    element: withSuspense(<NotFoundPage />),
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}

function withSuspense(element: React.ReactNode) {
  return (
    <Suspense
      fallback={
        <div className="px-4 py-6 sm:px-6 lg:px-8">
          <PageSectionSkeleton lines={6} />
        </div>
      }
    >
      {element}
    </Suspense>
  );
}
