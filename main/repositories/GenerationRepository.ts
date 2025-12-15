/**
 * GenerationRepository
 *
 * Repository for CRUD operations on generation_sessions and generation_results tables.
 */

import type { Database } from 'better-sqlite3';
import type { GenerationSession, GenerationResult } from '../../shared/types/database';

export class GenerationRepository {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  // ========================================
  // Generation Sessions
  // ========================================

  /**
   * Find all sessions for a feature
   */
  findSessionsByFeatureId(featureId: number): GenerationSession[] {
    const stmt = this.db.prepare('SELECT * FROM generation_sessions WHERE feature_id = ? ORDER BY created_at DESC');
    return stmt.all(featureId) as GenerationSession[];
  }

  /**
   * Find session by ID
   */
  findSessionById(id: number): GenerationSession | null {
    const stmt = this.db.prepare('SELECT * FROM generation_sessions WHERE id = ?');
    return (stmt.get(id) as GenerationSession) || null;
  }

  /**
   * Create a new generation session
   */
  createSession(data: Omit<GenerationSession, 'id' | 'created_at'>): GenerationSession {
    const stmt = this.db.prepare(`
      INSERT INTO generation_sessions (feature_id, document_type, status)
      VALUES (?, ?, ?)
    `);

    const result = stmt.run(data.feature_id, data.document_type, data.status);

    const created = this.findSessionById(result.lastInsertRowid as number);
    if (!created) {
      throw new Error('Failed to create generation session');
    }

    return created;
  }

  /**
   * Update session status
   */
  updateSessionStatus(id: number, status: GenerationSession['status']): void {
    const stmt = this.db.prepare('UPDATE generation_sessions SET status = ? WHERE id = ?');
    stmt.run(status, id);
  }

  /**
   * Delete a session (CASCADE deletes results)
   */
  deleteSession(id: number): void {
    const stmt = this.db.prepare('DELETE FROM generation_sessions WHERE id = ?');
    stmt.run(id);
  }

  // ========================================
  // Generation Results
  // ========================================

  /**
   * Find all results for a session
   */
  findResultsBySessionId(sessionId: number): GenerationResult[] {
    const stmt = this.db.prepare('SELECT * FROM generation_results WHERE session_id = ?');
    return stmt.all(sessionId) as GenerationResult[];
  }

  /**
   * Find result by ID
   */
  findResultById(id: number): GenerationResult | null {
    const stmt = this.db.prepare('SELECT * FROM generation_results WHERE id = ?');
    return (stmt.get(id) as GenerationResult) || null;
  }

  /**
   * Create a new generation result
   */
  createResult(data: Omit<GenerationResult, 'id'>): GenerationResult {
    const stmt = this.db.prepare(`
      INSERT INTO generation_results (session_id, provider, model, content, generation_time_ms, token_count, selected_sections)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      data.session_id,
      data.provider,
      data.model,
      data.content,
      data.generation_time_ms,
      data.token_count,
      JSON.stringify(data.selected_sections)
    );

    const created = this.findResultById(result.lastInsertRowid as number);
    if (!created) {
      throw new Error('Failed to create generation result');
    }

    // Parse JSON field
    created.selected_sections = JSON.parse(created.selected_sections as any);

    return created;
  }

  /**
   * Update selected sections for a result
   */
  updateResultSections(id: number, selectedSections: Record<string, boolean>): void {
    const stmt = this.db.prepare('UPDATE generation_results SET selected_sections = ? WHERE id = ?');
    stmt.run(JSON.stringify(selectedSections), id);
  }

  /**
   * Delete a result
   */
  deleteResult(id: number): void {
    const stmt = this.db.prepare('DELETE FROM generation_results WHERE id = ?');
    stmt.run(id);
  }
}
