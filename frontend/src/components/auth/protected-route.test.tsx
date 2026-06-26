import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./protected-route";

type AuthState = {
  hasRole: (role: string | string[]) => boolean;
  isAuthenticated: boolean;
  isBootstrapping: boolean;
};

let authState: AuthState = {
  hasRole: () => false,
  isAuthenticated: false,
  isBootstrapping: false,
};

vi.mock("../../context/auth-context", () => ({
  useAuth: () => authState,
}));

describe("ProtectedRoute", () => {
  it("renders a loading state while bootstrapping", () => {
    authState = {
      hasRole: () => false,
      isAuthenticated: false,
      isBootstrapping: true,
    };

    render(
      <MemoryRouter initialEntries={["/customers"]}>
        <Routes>
          <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
            <Route path="/customers" element={<div>Customers</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Loading session...")).toBeInTheDocument();
  });

  it("redirects unauthenticated users to login", () => {
    authState = {
      hasRole: () => false,
      isAuthenticated: false,
      isBootstrapping: false,
    };

    render(
      <MemoryRouter initialEntries={["/customers"]}>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
            <Route path="/customers" element={<div>Customers</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Login Page")).toBeInTheDocument();
  });

  it("redirects unauthorized users to forbidden", () => {
    authState = {
      hasRole: () => false,
      isAuthenticated: true,
      isBootstrapping: false,
    };

    render(
      <MemoryRouter initialEntries={["/customers"]}>
        <Routes>
          <Route path="/forbidden" element={<div>Forbidden Page</div>} />
          <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
            <Route path="/customers" element={<div>Customers</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Forbidden Page")).toBeInTheDocument();
  });

  it("renders nested routes for authorized users", () => {
    authState = {
      hasRole: (role) => (Array.isArray(role) ? role.includes("ADMIN") : role === "ADMIN"),
      isAuthenticated: true,
      isBootstrapping: false,
    };

    render(
      <MemoryRouter initialEntries={["/customers"]}>
        <Routes>
          <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
            <Route path="/customers" element={<div>Customers</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Customers")).toBeInTheDocument();
  });
});
