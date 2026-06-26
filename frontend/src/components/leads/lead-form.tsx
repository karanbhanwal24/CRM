import type { ReactNode } from "react";
import { useForm } from "react-hook-form";
import type { Lead, LeadPriority, LeadSource, LeadStatus } from "../../types/lead";

export type LeadFormValues = {
  company_name: string;
  contact_person: string;
  email: string;
  phone: string;
  source: LeadSource;
  priority: LeadPriority;
  status: LeadStatus;
};

type LeadFormProps = {
  initialValues?: Partial<Lead>;
  isSubmitting: boolean;
  onSubmit: (values: LeadFormValues) => Promise<void>;
  submitLabel: string;
};

const sourceOptions: LeadSource[] = ["WEBSITE", "REFERRAL", "CAMPAIGN", "INBOUND", "OUTBOUND"];
const priorityOptions: LeadPriority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];
const statusOptions: LeadStatus[] = ["NEW", "CONTACTED", "QUALIFIED", "UNQUALIFIED", "CONVERTED", "LOST"];

export function LeadForm({ initialValues, isSubmitting, onSubmit, submitLabel }: LeadFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LeadFormValues>({
    defaultValues: {
      company_name: initialValues?.company_name ?? "",
      contact_person: initialValues?.contact_person ?? "",
      email: initialValues?.email ?? "",
      phone: initialValues?.phone ?? "",
      source: initialValues?.source ?? "INBOUND",
      priority: initialValues?.priority ?? "MEDIUM",
      status: initialValues?.status ?? "NEW",
    },
  });

  return (
    <form className="grid gap-5" onSubmit={handleSubmit(onSubmit)}>
      <div className="grid gap-5 md:grid-cols-2">
        <Field
          label="Company"
          error={errors.company_name?.message}
          input={
            <input
              {...register("company_name", { required: "Company is required." })}
              className={inputClassName}
              placeholder="Acme Inc."
            />
          }
        />
        <Field
          label="Contact"
          error={errors.contact_person?.message}
          input={
            <input
              {...register("contact_person", { required: "Contact is required." })}
              className={inputClassName}
              placeholder="Jane Doe"
            />
          }
        />
        <Field
          label="Email"
          error={errors.email?.message}
          input={
            <input
              {...register("email", {
                validate: (value, values) => {
                  if (!value && !values.phone) {
                    return "Email or phone is required.";
                  }
                  if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                    return "Enter a valid email address.";
                  }
                  return true;
                },
              })}
              className={inputClassName}
              placeholder="lead@acme.com"
            />
          }
        />
        <Field
          label="Phone"
          error={errors.phone?.message}
          input={
            <input
              {...register("phone", {
                validate: (value, values) => {
                  if (!value && !values.email) {
                    return "Email or phone is required.";
                  }
                  if (value && !/^\+?[1-9]\d{7,14}$/.test(value)) {
                    return "Phone must use an E.164-compatible format.";
                  }
                  return true;
                },
              })}
              className={inputClassName}
              placeholder="+14155550123"
            />
          }
        />
        <Field
          label="Source"
          error={errors.source?.message}
          input={
            <select {...register("source", { required: "Source is required." })} className={inputClassName}>
              {sourceOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          }
        />
        <Field
          label="Priority"
          error={errors.priority?.message}
          input={
            <select {...register("priority", { required: "Priority is required." })} className={inputClassName}>
              {priorityOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          }
        />
        <Field
          label="Status"
          error={errors.status?.message}
          input={
            <select {...register("status", { required: "Status is required." })} className={inputClassName}>
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          }
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
  "w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition focus:border-brand-500";
