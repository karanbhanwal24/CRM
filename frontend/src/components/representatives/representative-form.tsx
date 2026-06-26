import type { ReactNode } from "react";
import { useForm } from "react-hook-form";
import type { SalesRepresentative, RepresentativeStatus } from "../../types/representative";
import type { SalesRepresentativeOption } from "../../types/lead";

export type RepresentativeFormValues = {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  employee_id: string;
  territory: string;
  status: RepresentativeStatus;
  commission_rate: string;
  hired_at: string;
  manager_id: string;
  password?: string;
};

type RepresentativeFormProps = {
  initialValues?: Partial<SalesRepresentative>;
  isSubmitting: boolean;
  managerOptions: SalesRepresentativeOption[];
  onSubmit: (values: RepresentativeFormValues) => Promise<void>;
  submitLabel: string;
  requirePassword?: boolean;
};

const statusOptions: RepresentativeStatus[] = ["ACTIVE", "ON_LEAVE", "INACTIVE"];

export function RepresentativeForm({
  initialValues,
  isSubmitting,
  managerOptions,
  onSubmit,
  submitLabel,
  requirePassword = false,
}: RepresentativeFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RepresentativeFormValues>({
    defaultValues: {
      first_name: initialValues?.first_name ?? "",
      last_name: initialValues?.last_name ?? "",
      email: initialValues?.email ?? "",
      phone_number: initialValues?.phone_number ?? "",
      employee_id: initialValues?.employee_id ?? "",
      territory: initialValues?.territory ?? "",
      status: initialValues?.status ?? "ACTIVE",
      commission_rate: initialValues?.commission_rate ?? "0.00",
      hired_at: initialValues?.hired_at ?? "",
      manager_id: initialValues?.manager?.id ? String(initialValues.manager.id) : "",
      password: "",
    },
  });

  return (
    <form className="grid gap-5" onSubmit={handleSubmit(onSubmit)}>
      <div className="grid gap-5 md:grid-cols-2">
        <Field
          label="First Name"
          error={errors.first_name?.message}
          input={<input {...register("first_name", { required: "First name is required." })} className={inputClassName} placeholder="Jane" />}
        />
        <Field
          label="Last Name"
          error={errors.last_name?.message}
          input={<input {...register("last_name")} className={inputClassName} placeholder="Doe" />}
        />
        <Field
          label="Work Email"
          error={errors.email?.message}
          input={
            <input
              {...register("email", {
                required: "Email is required.",
                validate: (value) =>
                  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || "Enter a valid email address.",
              })}
              className={inputClassName}
              placeholder="jane.doe@company.com"
            />
          }
        />
        <Field
          label="Phone Number"
          error={errors.phone_number?.message}
          input={
            <input
              {...register("phone_number", {
                validate: (value) =>
                  !value || /^\+?[1-9]\d{7,14}$/.test(value) || "Phone must use an E.164-compatible format.",
              })}
              className={inputClassName}
              placeholder="+14155550123"
            />
          }
        />
        <Field
          label="Employee ID"
          error={errors.employee_id?.message}
          input={
            <input
              {...register("employee_id", {
                required: "Employee ID is required.",
                validate: (value) =>
                  /^[A-Z0-9-]{4,30}$/.test(value.trim().toUpperCase()) ||
                  "Use 4-30 uppercase letters, numbers, or hyphens.",
              })}
              className={inputClassName}
              placeholder="SR-1001"
            />
          }
        />
        <Field
          label="Territory"
          error={errors.territory?.message}
          input={<input {...register("territory")} className={inputClassName} placeholder="North America" />}
        />
        <Field
          label="Status"
          error={errors.status?.message}
          input={
            <select {...register("status", { required: "Status is required." })} className={inputClassName}>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status.replace("_", " ")}
                </option>
              ))}
            </select>
          }
        />
        <Field
          label="Commission Rate (%)"
          error={errors.commission_rate?.message}
          input={
            <input
              {...register("commission_rate", {
                required: "Commission rate is required.",
                validate: (value) => {
                  const amount = Number(value);
                  return (!Number.isNaN(amount) && amount >= 0 && amount <= 100) || "Enter a value between 0 and 100.";
                },
              })}
              className={inputClassName}
              placeholder="5.00"
              step="0.01"
              type="number"
            />
          }
        />
        <Field
          label="Hire Date"
          error={errors.hired_at?.message}
          input={<input {...register("hired_at")} className={inputClassName} type="date" />}
        />
        <Field
          label="Manager"
          error={errors.manager_id?.message}
          input={
            <select {...register("manager_id")} className={inputClassName}>
              <option value="">No manager</option>
              {managerOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name} ({option.employee_id})
                </option>
              ))}
            </select>
          }
        />
        <Field
          label={requirePassword ? "Temporary Password" : "Reset Password"}
          error={errors.password?.message}
          input={
            <input
              {...register("password", {
                validate: (value) => {
                  if (!requirePassword && !value) {
                    return true;
                  }
                  return (value?.length ?? 0) >= 8 || "Password must be at least 8 characters.";
                },
              })}
              className={inputClassName}
              placeholder={requirePassword ? "Minimum 8 characters" : "Leave blank to keep current password"}
              type="password"
            />
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
