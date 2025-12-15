/**
 * TroubleshootingRepository
 *
 * Repository for troubleshooting_sessions and troubleshooting_responses tables.
 */

import type { Database } from 'better-sqlite3';
import type { TroubleshootingSession, TroubleshootingResponse } from '../../shared/types/database';

export class TroubleshootingRepository {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  // ========================================
  // Troubleshooting Sessions
  // ========================================

  findSessionsByProjectId(projectId: number): TroubleshootingSession[] {
    const stmt = this.db.prepare('SELECT * FROM troubleshooting_sessions WHERE project_id = ? ORDER BY created_at DESC');
    const sessions = stmt.all(projectId) as TroubleshootingSession[];
    return sessions.map(s => ({
      ...s,
      files_shared: JSON.parse(s.files_shared as any),
      context_files_used: JSON.parse(s.context_files_used as any)
    }));
  }

  findSessionById(id: number): TroubleshootingSession | null {
    const stmt = this.db.prepare('SELECT * FROM troubleshooting_sessions WHERE id = ?');
    const session = stmt.get(id) as TroubleshootingSession | undefined;
    if (!session) return null;
    return {
      ...session,
      files_shared: JSON.parse(session.files_shared as any),
      context_files_used: JSON.parse(session.context_files_used as any)
    };
  }

  createSession(data: Omit<TroubleshootingSession, 'id' | 'created_at'>): TroubleshootingSession {
    const stmt = this.db.prepare(`
      INSERT INTO troubleshooting_sessions (feature_id, project_id, problem_description, error_logs, files_shared, context_files_used, status, resolution_notes, resolved_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      data.feature_id || null,
      data.project_id,
      data.problem_description,
      data.error_logs || null,
      JSON.stringify(data.files_shared),
      JSON.stringify(data.context_files_used),
      data.status,
      data.resolution_notes || null,
      data.resolved_at || null
    );

    return this.findSessionById(result.lastInsertRowid as number)!;
  }

  updateSession(id: number, data: Partial<Pick<TroubleshootingSession, 'status' | 'resolution_notes' | 'resolved_at'>>): void {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.status !== undefined) {
      fields.push('status = ?');
      values.push(data.status);
    }
    if (data.resolution_notes !== undefined) {
      fields.push('resolution_notes = ?');
      values.push(data.resolution_notes);
    }
    if (data.resolved_at !== undefined) {
      fields.push('resolved_at = ?');
      values.push(data.resolved_at);
    }

    if (fields.length === 0) return;

    values.push(id);
    const stmt = this.db.prepare(`UPDATE troubleshooting_sessions SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);
  }

  deleteSession(id: number): void {
    const stmt = this.db.prepare('DELETE FROM troubleshooting_sessions WHERE id = ?');
    stmt.run(id);
  }

  // ========================================
  // Troubleshooting Responses
  // ========================================

  findResponsesBySessionId(sessionId: number): TroubleshootingResponse[] {
    const stmt = this.db.prepare('SELECT * FROM troubleshooting_responses WHERE session_id = ?');
    const responses = stmt.all(sessionId) as TroubleshootingResponse[];
    return responses.map(r => ({
      ...r,
      code_snippets: r.code_snippets ? JSON.parse(r.code_snippets as any) : null
    }));
  }

  createResponse(data: Omit<TroubleshootingResponse, 'id'>): TroubleshootingResponse {
    const stmt = this.db.prepare(`
      INSERT INTO troubleshooting_responses (session_id, provider, model, response_content, suggested_solution, code_snippets, was_helpful, used_in_solution)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      data.session_id,
      data.provider,
      data.model,
      data.response_content,
      data.suggested_solution || null,
      data.code_snippets ? JSON.stringify(data.code_snippets) : null,
      data.was_helpful ? 1 : 0,
      data.used_in_solution ? 1 : 0
    );

    const stmt2 = this.db.prepare('SELECT * FROM troubleshooting_responses WHERE id = ?');
    const response = stmt2.get(result.lastInsertRowid) as TroubleshootingResponse;
    return {
      ...response,
      code_snippets: response.code_snippets ? JSON.parse(response.code_snippets as any) : null
    };
  }

  updateResponseFeedback(id: number, wasHelpful: boolean, usedInSolution: boolean): void {
    const stmt = this.db.prepare('UPDATE troubleshooting_responses SET was_helpful = ?, used_in_solution = ? WHERE id = ?');
    stmt.run(wasHelpful ? 1 : 0, usedInSolution ? 1 : 0, id);
  }

  deleteResponse(id: number): void {
    const stmt = this.db.prepare('DELETE FROM troubleshooting_responses WHERE id = ?');
    stmt.run(id);
  }
}
