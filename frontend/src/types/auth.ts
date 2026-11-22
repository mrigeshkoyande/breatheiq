export type UserRole = 'user' | 'moderator' | 'admin';

export interface User {
  id: number;
  email: string;
  role: UserRole;
  full_name?: string;
  is_active: boolean;
  is_verified: boolean;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export interface Session {
  id: number;
  family_id: string;
  user_agent?: string;
  ip_address?: string;
  created_at: string;
  expires_at: string;
  is_revoked: boolean;
}
