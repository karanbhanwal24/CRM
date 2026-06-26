import { useEffect, useState } from "react";
import { Modal } from "../ui/modal";
import type { SalesRepresentativeOption } from "../../types/lead";

type AssignRepresentativeModalProps = {
  isOpen: boolean;
  isSubmitting: boolean;
  representatives: SalesRepresentativeOption[];
  currentRepresentativeId?: number | null;
  onClose: () => void;
  onAssign: (representativeId: number | null) => Promise<void>;
};

export function AssignRepresentativeModal({
  isOpen,
  isSubmitting,
  representatives,
  currentRepresentativeId,
  onClose,
  onAssign,
}: AssignRepresentativeModalProps) {
  const [selectedRepresentativeId, setSelectedRepresentativeId] = useState<string>(
    currentRepresentativeId ? String(currentRepresentativeId) : ""
  );

  useEffect(() => {
    setSelectedRepresentativeId(currentRepresentativeId ? String(currentRepresentativeId) : "");
  }, [currentRepresentativeId, isOpen]);

  return (
    <Modal isOpen={isOpen} title="Assign Representative" onClose={onClose}>
      <div className="grid gap-4">
        <select
          value={selectedRepresentativeId}
          onChange={(event) => setSelectedRepresentativeId(event.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition focus:border-brand-500"
        >
          <option value="">Unassigned</option>
          {representatives.map((representative) => (
            <option key={representative.id} value={representative.id}>
              {representative.name} ({representative.employee_id})
            </option>
          ))}
        </select>
        <div className="flex gap-3">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => void onAssign(selectedRepresentativeId ? Number(selectedRepresentativeId) : null)}
            className="rounded-2xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-70"
          >
            {isSubmitting ? "Saving..." : "Save Assignment"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
