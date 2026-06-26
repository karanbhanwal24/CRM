export type RepresentativeStatus = "ACTIVE" | "ON_LEAVE" | "INACTIVE";

export type RepresentativeManager = {
  id: number;
  employee_id: string;
  name: string;
};

export type SalesRepresentative = {
  id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone_number: string;
  employee_id: string;
  territory: string;
  status: RepresentativeStatus;
  commission_rate: string;
  hired_at: string | null;
  manager: RepresentativeManager | null;
  is_active: boolean;
  lead_count: number;
  direct_reports_count: number;
  created_at: string;
  updated_at: string;
};
