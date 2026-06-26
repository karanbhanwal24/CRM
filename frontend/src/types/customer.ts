export type CustomerStatus = "ACTIVE" | "INACTIVE" | "CHURNED";

export type Customer = {
  id: number;
  company_name: string;
  contact_person: string;
  email: string;
  phone: string;
  industry: string;
  status: CustomerStatus;
  created_at: string;
  updated_at: string;
};

export type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};
