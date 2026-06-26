import type { SalesRepresentativeOption, LeadPriority, LeadStatus } from "./lead";

export type OpportunityStage = "QUALIFICATION" | "PROPOSAL" | "NEGOTIATION" | "WON" | "LOST";
export type FollowUpType = "CALL" | "EMAIL" | "MEETING" | "TASK" | "DEMO";
export type FollowUpStatus = "PENDING" | "COMPLETED" | "CANCELED";

export type OpportunityLeadSummary = {
  id: number;
  company_name: string;
  contact_person: string;
  status: LeadStatus;
  priority: LeadPriority;
  representative?: SalesRepresentativeOption | null;
};

export type OpportunityCustomerSummary = {
  id: number;
  company_name: string;
  contact_person: string;
  status: string;
};

export type OpportunityFollowUp = {
  id: number;
  subject: string;
  notes: string;
  follow_up_type: FollowUpType;
  status: FollowUpStatus;
  scheduled_at: string;
  completed_at: string | null;
  assigned_to: SalesRepresentativeOption;
  created_by_name: string;
  created_at: string;
  updated_at: string;
};

export type Opportunity = {
  id: number;
  title: string;
  customer: OpportunityCustomerSummary;
  lead?: OpportunityLeadSummary | null;
  owner: SalesRepresentativeOption;
  stage: OpportunityStage;
  amount: string;
  probability: number;
  expected_close_date: string | null;
  closed_at: string | null;
  follow_up_count: number;
  follow_up_history: OpportunityFollowUp[];
  created_at: string;
  updated_at: string;
};
