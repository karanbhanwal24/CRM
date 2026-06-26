import { render, screen } from "@testing-library/react";
import { DashboardCard } from "./dashboard-card";

describe("DashboardCard", () => {
  it("renders the metric label, value, and detail", () => {
    render(
      <DashboardCard
        metric={{
          label: "Open Opportunities",
          value: 42,
          detail: "Active deals in the pipeline",
        }}
      />
    );

    expect(screen.getByText("Open Opportunities")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("Active deals in the pipeline")).toBeInTheDocument();
  });
});
