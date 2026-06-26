export type LeadSource = "WEBSITE" | "REFERRAL" | "CAMPAIGN" | "INBOUND" | "OUTBOUND";
export type LeadPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type LeadStatus = "NEW" | "CONTACTED" | "QUALIFIED" | "UNQUALIFIED" | "CONVERTED" | "LOST";

export type SalesRepresentativeOption = {
  id: number;
  user_id: number;
  employee_id: string;
  name: string;
  email: string;
  status: string;
  territory: string;
};

export type Lead = {
  id: number;
  company_name: string;
  contact_person: string;
  email: string;
  phone: string;
  source: LeadSource;
  priority: LeadPriority;
  status: LeadStatus;
  assigned_to_id?: number | null;
  representative?: SalesRepresentativeOption | null;
  created_by_id: number;
  created_at: string;
  updated_at: string;
};
