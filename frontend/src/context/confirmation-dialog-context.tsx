import { PropsWithChildren, createContext, useContext, useMemo, useState } from "react";
import { Modal } from "../components/ui/modal";

type ConfirmationDialogOptions = {
  title: string;
  description: string;
  confirmLabel?: string;
  confirmTone?: "default" | "danger";
};

type PendingConfirmation = ConfirmationDialogOptions & {
  resolve: (result: boolean) => void;
};

type ConfirmationDialogContextValue = {
  confirm: (options: ConfirmationDialogOptions) => Promise<boolean>;
};

const ConfirmationDialogContext = createContext<ConfirmationDialogContextValue | undefined>(undefined);

export function ConfirmationDialogProvider({ children }: PropsWithChildren) {
  const [pendingConfirmation, setPendingConfirmation] = useState<PendingConfirmation | null>(null);

  const value = useMemo(
    () => ({
      confirm(options: ConfirmationDialogOptions) {
        return new Promise<boolean>((resolve) => {
          setPendingConfirmation({ ...options, resolve });
        });
      },
    }),
    []
  );

  function close(result: boolean) {
    if (!pendingConfirmation) {
      return;
    }
    pendingConfirmation.resolve(result);
    setPendingConfirmation(null);
  }

  return (
    <ConfirmationDialogContext.Provider value={value}>
      {children}
      <Modal
        isOpen={Boolean(pendingConfirmation)}
        title={pendingConfirmation?.title ?? ""}
        description={pendingConfirmation?.description}
        onClose={() => close(false)}
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => close(false)} className={secondaryButtonClassName}>
              Cancel
            </button>
            <button
              type="button"
              onClick={() => close(true)}
              className={
                pendingConfirmation?.confirmTone === "danger" ? dangerButtonClassName : primaryButtonClassName
              }
            >
              {pendingConfirmation?.confirmLabel ?? "Confirm"}
            </button>
          </div>
        </div>
      </Modal>
    </ConfirmationDialogContext.Provider>
  );
}

export function useConfirmationDialog() {
  const context = useContext(ConfirmationDialogContext);
  if (!context) {
    throw new Error("useConfirmationDialog must be used within a ConfirmationDialogProvider.");
  }
  return context;
}

const primaryButtonClassName =
  "rounded-2xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700";

const secondaryButtonClassName =
  "rounded-2xl border border-white/10 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/10";

const dangerButtonClassName =
  "rounded-2xl border border-rose-400/20 bg-rose-500/10 px-5 py-3 text-sm font-semibold text-rose-100 transition hover:bg-rose-500/20";
