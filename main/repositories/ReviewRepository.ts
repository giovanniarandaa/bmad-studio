/**
 * ReviewRepository
 *
 * Repository for code_review_sessions and code_review_findings tables.
 */

import type { Database } from 'better-sqlite3';
import type { CodeReviewSession, CodeReviewFinding } from '../../shared/types/database';

export class ReviewRepository {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  // ========================================
  // Code Review Sessions
  // ========================================

  findAllSessions(): CodeReviewSession[] {
    const stmt = this.db.prepare('SELECT * FROM code_review_sessions ORDER BY created_at DESC');
    const sessions = stmt.all() as CodeReviewSession[];
    return sessions.map(s => ({ ...s, files_changed: JSON.parse(s.files_changed as any) }));
  }

  findSessionById(id: number): CodeReviewSession | null {
    const stmt = this.db.prepare('SELECT * FROM code_review_sessions WHERE id = ?');
    const session = stmt.get(id) as CodeReviewSession | undefined;
    if (!session) return null;
    return { ...session, files_changed: JSON.parse(session.files_changed as any) };
  }

  createSession(data: Omit<CodeReviewSession, 'id' | 'created_at'>): CodeReviewSession {
    const stmt = this.db.prepare(`
      INSERT INTO code_review_sessions (feature_id, branch_name, base_branch, files_changed, status)
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      data.feature_id || null,
      data.branch_name,
      data.base_branch,
      JSON.stringify(data.files_changed),
      data.status
    );

    return this.findSessionById(result.lastInsertRowid as number)!;
  }

  updateSessionStatus(id: number, status: CodeReviewSession['status']): void {
    const stmt = this.db.prepare('UPDATE code_review_sessions SET status = ? WHERE id = ?');
    stmt.run(status, id);
  }

  deleteSession(id: number): void {
    const stmt = this.db.prepare('DELETE FROM code_review_sessions WHERE id = ?');
    stmt.run(id);
  }

  // ========================================
  // Code Review Findings
  // ========================================

  findFindingsBySessionId(sessionId: number): CodeReviewFinding[] {
    const stmt = this.db.prepare('SELECT * FROM code_review_findings WHERE session_id = ? ORDER BY severity DESC, file_path ASC');
    return stmt.all(sessionId) as CodeReviewFinding[];
  }

  createFinding(data: Omit<CodeReviewFinding, 'id'>): CodeReviewFinding {
    const stmt = this.db.prepare(`
      INSERT INTO code_review_findings (session_id, file_path, line_start, line_end, severity, category, message, suggestion, existing_component)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      data.session_id,
      data.file_path,
      data.line_start,
      data.line_end,
      data.severity,
      data.category,
      data.message,
      data.suggestion || null,
      data.existing_component || null
    );

    const stmt2 = this.db.prepare('SELECT * FROM code_review_findings WHERE id = ?');
    return stmt2.get(result.lastInsertRowid) as CodeReviewFinding;
  }

  deleteFinding(id: number): void {
    const stmt = this.db.prepare('DELETE FROM code_review_findings WHERE id = ?');
    stmt.run(id);
  }
}
