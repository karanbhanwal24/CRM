export type UserRole = "ADMIN" | "SALES_REP";

export type AuthUser = {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: UserRole;
  phone_number: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type AuthTokens = {
  access: string;
  refresh: string;
};
