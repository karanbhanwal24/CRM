import type { ReactNode } from "react";
import { useForm } from "react-hook-form";
import type { Customer, CustomerStatus } from "../../types/customer";

export type CustomerFormValues = {
  company_name: string;
  contact_person: string;
  email: string;
  phone: string;
  industry: string;
  status: CustomerStatus;
};

type CustomerFormProps = {
  initialValues?: Partial<Customer>;
  isSubmitting: boolean;
  onSubmit: (values: CustomerFormValues) => Promise<void>;
  submitLabel: string;
};

const statuses: CustomerStatus[] = ["ACTIVE", "INACTIVE", "CHURNED"];

export function CustomerForm({
  initialValues,
  isSubmitting,
  onSubmit,
  submitLabel,
}: CustomerFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CustomerFormValues>({
    defaultValues: {
      company_name: initialValues?.company_name ?? "",
      contact_person: initialValues?.contact_person ?? "",
      email: initialValues?.email ?? "",
      phone: initialValues?.phone ?? "",
      industry: initialValues?.industry ?? "",
      status: initialValues?.status ?? "ACTIVE",
    },
  });

  return (
    <form className="grid gap-5" onSubmit={handleSubmit(onSubmit)}>
      <div className="grid gap-5 md:grid-cols-2">
        <Field
          label="Company Name"
          error={errors.company_name?.message}
          input={
            <input
              {...register("company_name", { required: "Company name is required." })}
              className={inputClassName}
              placeholder="Acme Inc."
            />
          }
        />
        <Field
          label="Contact Person"
          error={errors.contact_person?.message}
          input={
            <input
              {...register("contact_person", { required: "Contact person is required." })}
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
              placeholder="contact@acme.com"
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
          label="Industry"
          error={errors.industry?.message}
          input={
            <input
              {...register("industry", { required: "Industry is required." })}
              className={inputClassName}
              placeholder="Software"
            />
          }
        />
        <Field
          label="Status"
          error={errors.status?.message}
          input={
            <select {...register("status", { required: "Status is required." })} className={inputClassName}>
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status.replace("_", " ")}
                </option>
              ))}
            </select>
          }
        />
      </div>
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-2xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  input,
  error,
}: {
  label: string;
  input: ReactNode;
  error?: string;
}) {
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
