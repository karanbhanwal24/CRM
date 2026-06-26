import { PropsWithChildren } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "../context/auth-context";
import { ConfirmationDialogProvider } from "../context/confirmation-dialog-context";
import { ThemeProvider } from "../context/theme-context";
import { ToastProvider } from "../context/toast-context";

const queryClient = new QueryClient();

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <ConfirmationDialogProvider>{children}</ConfirmationDialogProvider>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
