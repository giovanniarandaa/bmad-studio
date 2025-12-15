/**
 * IPC Channel Type Definitions
 *
 * This file defines TypeScript types for IPC communication between
 * main and renderer processes.
 *
 * NOTE: This is a placeholder for Phase 1 (infrastructure setup).
 * Future phases will expand this with specific channels like:
 * - 'project:add'
 * - 'feature:index'
 * - 'llm:generate'
 * - etc.
 */

/**
 * Base IPC channel type
 * Pattern: 'entity:action' (e.g., 'project:add', 'feature:list')
 */
export type IPCChannel = string;

/**
 * Placeholder for future channel-specific payloads and responses
 * Will be expanded in Phase 1 Module 1.2 (SQLite Database) and beyond
 */
export interface IPCPayload {
  [key: string]: unknown;
}

export interface IPCResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
