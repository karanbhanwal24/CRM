import type { ReactNode } from "react";
import { ModuleLayout } from "../crm/module-layout";

type CustomerLayoutProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

export function CustomerLayout({ title, subtitle, children }: CustomerLayoutProps) {
  return (
    <ModuleLayout
      title={title}
      subtitle={subtitle}
      moduleLinks={[
        { to: "/customers", label: "Customers" },
        { to: "/sales-representatives", label: "Representatives" },
        { to: "/opportunities", label: "Opportunities" },
      ]}
    >
      {children}
    </ModuleLayout>
  );
}
