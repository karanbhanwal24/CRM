import type { ReactNode } from "react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import type { Opportunity, OpportunityStage } from "../../types/opportunity";
import type { Lead } from "../../types/lead";
import type { SalesRepresentativeOption } from "../../types/lead";

export type OpportunityFormValues = {
  title: string;
  lead_id: string;
  owner_id: string;
  stage: OpportunityStage;
  amount: string;
  probability: string;
  expected_close_date: string;
};

type OpportunityFormProps = {
  initialValues?: Partial<Opportunity>;
  leads: Lead[];
  ownerOptions: SalesRepresentativeOption[];
  isSubmitting: boolean;
  lockLead?: boolean;
  onSubmit: (values: OpportunityFormValues) => Promise<void>;
  submitLabel: string;
};

const stageOptions: OpportunityStage[] = ["QUALIFICATION", "PROPOSAL", "NEGOTIATION", "WON", "LOST"];

export function OpportunityForm({
  initialValues,
  leads,
  ownerOptions,
  isSubmitting,
  lockLead = false,
  onSubmit,
  submitLabel,
}: OpportunityFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<OpportunityFormValues>({
    defaultValues: {
      title: initialValues?.title ?? "",
      lead_id: initialValues?.lead?.id ? String(initialValues.lead.id) : "",
      owner_id: initialValues?.owner?.id ? String(initialValues.owner.id) : "",
      stage: initialValues?.stage ?? "QUALIFICATION",
      amount: initialValues?.amount ?? "0.00",
      probability: initialValues?.probability ? String(initialValues.probability) : "25",
      expected_close_date: initialValues?.expected_close_date ?? "",
    },
  });

  const selectedLeadId = watch("lead_id");

  useEffect(() => {
    if (!selectedLeadId || initialValues?.title) {
      return;
    }
    const selectedLead = leads.find((lead) => String(lead.id) === selectedLeadId);
    if (!selectedLead) {
      return;
    }
    setValue("title", `${selectedLead.company_name} Opportunity`);
    if (selectedLead.representative?.id) {
      setValue("owner_id", String(selectedLead.representative.id));
    }
  }, [initialValues?.title, leads, selectedLeadId, setValue]);

  return (
    <form className="grid gap-5" onSubmit={handleSubmit(onSubmit)}>
      <div className="grid gap-5 md:grid-cols-2">
        <Field
          label="Opportunity Title"
          error={errors.title?.message}
          input={
            <input
              {...register("title", { required: "Opportunity title is required." })}
              className={inputClassName}
              placeholder="Acme Expansion Opportunity"
            />
          }
        />
        <Field
          label="Source Lead"
          error={errors.lead_id?.message}
          input={
            <select
              {...register("lead_id", { required: "Lead selection is required." })}
              className={inputClassName}
              disabled={lockLead}
            >
              <option value="">Select a lead</option>
              {leads.map((lead) => (
                <option key={lead.id} value={lead.id}>
                  {lead.company_name} ({lead.contact_person})
                </option>
              ))}
            </select>
          }
        />
        <Field
          label="Assigned Representative"
          error={errors.owner_id?.message}
          input={
            <select {...register("owner_id", { required: "Representative assignment is required." })} className={inputClassName}>
              <option value="">Select representative</option>
              {ownerOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name} ({option.employee_id})
                </option>
              ))}
            </select>
          }
        />
        <Field
          label="Stage"
          error={errors.stage?.message}
          input={
            <select {...register("stage", { required: "Stage is required." })} className={inputClassName}>
              {stageOptions.map((stage) => (
                <option key={stage} value={stage}>
                  {stage.replace("_", " ")}
                </option>
              ))}
            </select>
          }
        />
        <Field
          label="Amount"
          error={errors.amount?.message}
          input={
            <input
              {...register("amount", {
                required: "Amount is required.",
                validate: (value) => Number(value) >= 0 || "Amount cannot be negative.",
              })}
              className={inputClassName}
              placeholder="15000.00"
              step="0.01"
              type="number"
            />
          }
        />
        <Field
          label="Probability (%)"
          error={errors.probability?.message}
          input={
            <input
              {...register("probability", {
                required: "Probability is required.",
                validate: (value) => {
                  const numeric = Number(value);
                  return (!Number.isNaN(numeric) && numeric >= 0 && numeric <= 100) || "Enter a value between 0 and 100.";
                },
              })}
              className={inputClassName}
              step="1"
              type="number"
            />
          }
        />
        <Field
          label="Expected Close Date"
          error={errors.expected_close_date?.message}
          input={<input {...register("expected_close_date")} className={inputClassName} type="date" />}
        />
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-fit rounded-2xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}

function Field({ label, input, error }: { label: string; input: ReactNode; error?: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-200">{label}</span>
      {input}
      {error ? <span className="mt-2 block text-sm text-rose-300">{error}</span> : null}
    </label>
  );
}

const inputClassName =
  "w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition focus:border-brand-500 disabled:cursor-not-allowed disabled:opacity-70";
