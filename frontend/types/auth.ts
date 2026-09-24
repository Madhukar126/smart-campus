export type UserRole = "STUDENT" | "STAFF" | "AO" | "PRINCIPAL" | "ADMIN" | "MAINTENANCE";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: "bearer";
  user: User;
}

