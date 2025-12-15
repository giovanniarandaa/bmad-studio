/**
 * Database Entity Type Definitions
 *
 * TypeScript interfaces representing SQLite database entities.
 * Shared between main process (repositories) and renderer process (UI).
 */

// ============================================================================
// Union Types
// ============================================================================

export type DocumentType = 'spec' | 'tech' | 'steps' | 'status' | 'quick';

export type SessionStatus = 'pending' | 'generating' | 'comparing' | 'merged' | 'cancelled';

export type FeatureStatus = 'planning' | 'in-progress' | 'review' | 'done';

export type LLMProviderName = 'openai' | 'google' | 'deepseek' | 'anthropic';

export type Theme = 'light' | 'dark' | 'system';

export type ContextDocumentType = 'context' | 'standards' | 'claude' | 'agents' | 'custom';

export type CodeReviewCategory = 'duplication' | 'misplacement' | 'reusability' | 'style' | 'other';

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export type ReviewStatus = 'pending' | 'in-progress' | 'completed' | 'cancelled';

export type TroubleshootingStatus = 'open' | 'in-progress' | 'resolved' | 'cancelled';

export type ImprovementStatus = 'pending' | 'approved' | 'rejected' | 'applied';

export type TargetType = 'command' | 'skill';

// ============================================================================
// Core Entities
// ============================================================================

export interface Project {
  id: number;
  name: string;
  path: string;
  has_bmad: boolean;
  created_at: string; // ISO 8601
  last_opened_at: string | null;
}

export interface Feature {
  id: number;
  feature_id: string; // "002"
  name: string;
  status: FeatureStatus;
  project_id: number;
  spec_path: string | null;
  tech_path: string | null;
  steps_path: string | null;
  status_path: string | null;
}

export interface Document {
  id: number;
  type: DocumentType;
  content: string;
  feature_id: number;
  version: number;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Multi-LLM Generation
// ============================================================================

export interface GenerationSession {
  id: number;
  feature_id: number;
  document_type: DocumentType;
  status: SessionStatus;
  created_at: string;
}

export interface GenerationResult {
  id: number;
  session_id: number;
  provider: LLMProviderName;
  model: string;
  content: string;
  generation_time_ms: number;
  token_count: number;
  selected_sections: Record<string, boolean>; // JSON: { "problema": true, "solucion": false }
}

// ============================================================================
// LLM Providers & Settings
// ============================================================================

export interface LLMProvider {
  id: number;
  name: LLMProviderName;
  api_key: string; // ENCRYPTED
  default_model: string;
  is_enabled: boolean;
  usage_this_month: number;
}

export interface AppSettings {
  id: number;
  bmad_global_path: string;
  bmad_repo_path: string | null;
  bmad_sync_enabled: boolean;
  theme: Theme;
  default_providers_spec: string[]; // JSON: ["openai", "google"]
  default_providers_tech: string[];
  default_providers_steps: string[];
  review_provider: string;
}

// ============================================================================
// BMAD System
// ============================================================================

export interface BMADCommand {
  id: number;
  name: string;
  file_path: string;
  description: string;
  argument_hint: string | null;
  allowed_tools: string | null; // JSON array
  content: string;
  extracted_prompt_logic: string | null;
  is_planning_command: boolean;
  last_modified: string;
  last_extraction: string | null;
}

export interface BMADSkill {
  id: number;
  name: string;
  file_path: string;
  description: string;
  content: string;
  last_modified: string;
}

export interface PromptTemplate {
  id: number;
  document_type: DocumentType;
  base_prompt: string;
  custom_overrides: string | null; // JSON
  required_context: string[]; // JSON: ["Context.md", "Standards.md"]
  required_sections: string[]; // JSON: ["Problem", "Solution"]
  critical_restrictions: string[]; // JSON: ["NO code in Tech.md"]
  source_command_id: number | null;
  version: number;
  last_updated: string;
}

// ============================================================================
// Code Review
// ============================================================================

export interface CodeReviewSession {
  id: number;
  feature_id: number | null;
  branch_name: string;
  base_branch: string;
  files_changed: string[]; // JSON array
  status: ReviewStatus;
  created_at: string;
}

export interface CodeReviewFinding {
  id: number;
  session_id: number;
  file_path: string;
  line_start: number;
  line_end: number;
  severity: Severity;
  category: CodeReviewCategory;
  message: string;
  suggestion: string | null;
  existing_component: string | null;
}

// ============================================================================
// Troubleshooting Multi-LLM
// ============================================================================

export interface TroubleshootingSession {
  id: number;
  feature_id: number | null;
  project_id: number;
  problem_description: string;
  error_logs: string | null;
  files_shared: string[]; // JSON array
  context_files_used: string[]; // JSON array
  status: TroubleshootingStatus;
  resolution_notes: string | null;
  created_at: string;
  resolved_at: string | null;
}

export interface TroubleshootingResponse {
  id: number;
  session_id: number;
  provider: LLMProviderName;
  model: string;
  response_content: string;
  suggested_solution: string | null;
  code_snippets: string | null; // JSON
  was_helpful: boolean;
  used_in_solution: boolean;
}

// ============================================================================
// Context Documents
// ============================================================================

export interface ContextDocument {
  id: number;
  project_id: number;
  type: ContextDocumentType;
  file_path: string;
  content: string;
  is_dirty: boolean;
  last_synced: string;
  last_modified_external: string | null;
}

// ============================================================================
// Improvement Suggestions
// ============================================================================

export interface ImprovementSuggestion {
  id: number;
  target_type: TargetType;
  target_id: number;
  error_context: string | null;
  suggestion: string;
  diff: string | null;
  status: ImprovementStatus;
  created_at: string;
}
