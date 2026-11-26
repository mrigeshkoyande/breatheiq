export interface CommunityReport {
  id: number;
  user_id: number;
  report_type: string;
  severity: string;
  location_name: string;
  latitude: number;
  longitude: number;
  description?: string | null;
  upvote_count: number;
  status: 'UNVERIFIED' | 'VERIFIED' | 'REJECTED';
  created_at: string;
}

export interface AdminUserSummary {
  id: number;
  email: string;
  full_name?: string | null;
  role: 'user' | 'moderator' | 'admin';
  is_active: boolean;
  is_verified: boolean;
  created_at?: string | null;
}

export interface AITrace {
  id: number;
  user_id?: number | null;
  prompt_hash: string;
  intent: string;
  model: string;
  latency_ms: number;
  tokens_used: number;
  validator_flags?: string | null;
  status: string;
  created_at: string;
}

export interface AuditLog {
  id: number;
  user_id?: number | null;
  action: string;
  resource_type?: string | null;
  resource_id?: string | null;
  ip_address?: string | null;
  details?: string | null;
  timestamp: string;
}

export interface IntegrationHealth {
  service: string;
  status: string;
  latency_ms: number;
  mode: string;
}

export interface CopilotChatResponse {
  reply: string;
  intent: string;
  source_badge: string;
  evidence_context: Record<string, unknown>;
  why_this_advice: string;
  limitations: string;
  validator_flags: string[];
  suggested_prompts: string[];
  is_fallback: boolean;
}

export interface AuthConfig {
  demo_mode: boolean;
  environment: string;
}
