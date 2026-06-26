import { useForm } from "react-hook-form";
import { Modal } from "../ui/modal";
import type { FollowUpStatus, FollowUpType } from "../../types/opportunity";
import type { SalesRepresentativeOption } from "../../types/lead";

export type FollowUpFormValues = {
  subject: string;
  notes: string;
  follow_up_type: FollowUpType;
  status: FollowUpStatus;
  scheduled_at: string;
  assigned_to_id: string;
};

type AddFollowUpModalProps = {
  isOpen: boolean;
  isSubmitting: boolean;
  ownerId?: number;
  representatives: SalesRepresentativeOption[];
  onClose: () => void;
  onSubmit: (values: FollowUpFormValues) => Promise<void>;
};

const typeOptions: FollowUpType[] = ["CALL", "EMAIL", "MEETING", "TASK", "DEMO"];
const statusOptions: FollowUpStatus[] = ["PENDING", "COMPLETED", "CANCELED"];

export function AddFollowUpModal({
  isOpen,
  isSubmitting,
  ownerId,
  representatives,
  onClose,
  onSubmit,
}: AddFollowUpModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FollowUpFormValues>({
    defaultValues: {
      subject: "",
      notes: "",
      follow_up_type: "CALL",
      status: "PENDING",
      scheduled_at: "",
      assigned_to_id: ownerId ? String(ownerId) : "",
    },
  });

  return (
    <Modal isOpen={isOpen} title="Add Follow-up" onClose={onClose}>
      <form
        className="grid gap-4"
        onSubmit={handleSubmit(async (values) => {
          await onSubmit(values);
          reset({
            subject: "",
            notes: "",
            follow_up_type: "CALL",
            status: "PENDING",
            scheduled_at: "",
            assigned_to_id: ownerId ? String(ownerId) : "",
          });
        })}
      >
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-200">Subject</span>
          <input
            {...register("subject", { required: "Subject is required." })}
            className={inputClassName}
            placeholder="Discovery call"
          />
          {errors.subject ? <span className="mt-2 block text-sm text-rose-300">{errors.subject.message}</span> : null}
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-200">Notes</span>
          <textarea {...register("notes")} className={`${inputClassName} min-h-28`} placeholder="Add follow-up context" />
        </label>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-200">Type</span>
            <select {...register("follow_up_type")} className={inputClassName}>
              {typeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-200">Status</span>
            <select {...register("status")} className={inputClassName}>
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-200">Scheduled At</span>
            <input
              {...register("scheduled_at", { required: "Schedule time is required." })}
              className={inputClassName}
              type="datetime-local"
            />
            {errors.scheduled_at ? (
              <span className="mt-2 block text-sm text-rose-300">{errors.scheduled_at.message}</span>
            ) : null}
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-200">Assigned To</span>
            <select
              {...register("assigned_to_id", { required: "Representative assignment is required." })}
              className={inputClassName}
            >
              <option value="">Select representative</option>
              {representatives.map((representative) => (
                <option key={representative.id} value={representative.id}>
                  {representative.name} ({representative.employee_id})
                </option>
              ))}
            </select>
            {errors.assigned_to_id ? (
              <span className="mt-2 block text-sm text-rose-300">{errors.assigned_to_id.message}</span>
            ) : null}
          </label>
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-2xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-70"
        >
          {isSubmitting ? "Saving..." : "Save Follow-up"}
        </button>
      </form>
    </Modal>
  );
}

const inputClassName =
  "w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition focus:border-brand-500";
