/**
 * ContextDocumentRepository
 *
 * Repository for context_documents table.
 */

import type { Database } from 'better-sqlite3';
import type { ContextDocument } from '../../shared/types/database';

export class ContextDocumentRepository {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  /**
   * Find all context documents for a project
   */
  findByProjectId(projectId: number): ContextDocument[] {
    const stmt = this.db.prepare('SELECT * FROM context_documents WHERE project_id = ? ORDER BY type ASC');
    return stmt.all(projectId) as ContextDocument[];
  }

  /**
   * Find context document by type for a project
   */
  findByType(projectId: number, type: ContextDocument['type']): ContextDocument | null {
    const stmt = this.db.prepare('SELECT * FROM context_documents WHERE project_id = ? AND type = ?');
    return (stmt.get(projectId, type) as ContextDocument) || null;
  }

  /**
   * Find document by ID
   */
  findById(id: number): ContextDocument | null {
    const stmt = this.db.prepare('SELECT * FROM context_documents WHERE id = ?');
    return (stmt.get(id) as ContextDocument) || null;
  }

  /**
   * Create a new context document
   */
  create(data: Omit<ContextDocument, 'id' | 'last_synced'>): ContextDocument {
    const stmt = this.db.prepare(`
      INSERT INTO context_documents (project_id, type, file_path, content, is_dirty, last_modified_external)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      data.project_id,
      data.type,
      data.file_path,
      data.content,
      data.is_dirty ? 1 : 0,
      data.last_modified_external || null
    );

    const created = this.findById(result.lastInsertRowid as number);
    if (!created) {
      throw new Error('Failed to create context document');
    }

    return created;
  }

  /**
   * Update a context document
   */
  update(id: number, data: Partial<Omit<ContextDocument, 'id' | 'project_id' | 'type'>>): void {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.file_path !== undefined) {
      fields.push('file_path = ?');
      values.push(data.file_path);
    }
    if (data.content !== undefined) {
      fields.push('content = ?');
      values.push(data.content);
    }
    if (data.is_dirty !== undefined) {
      fields.push('is_dirty = ?');
      values.push(data.is_dirty ? 1 : 0);
    }
    if (data.last_modified_external !== undefined) {
      fields.push('last_modified_external = ?');
      values.push(data.last_modified_external);
    }

    if (fields.length === 0) return;

    // Always update last_synced when updating
    fields.push('last_synced = CURRENT_TIMESTAMP');

    values.push(id);

    const stmt = this.db.prepare(`UPDATE context_documents SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);
  }

  /**
   * Mark document as dirty
   */
  markDirty(id: number): void {
    const stmt = this.db.prepare('UPDATE context_documents SET is_dirty = 1 WHERE id = ?');
    stmt.run(id);
  }

  /**
   * Mark document as clean (synced)
   */
  markClean(id: number): void {
    const stmt = this.db.prepare('UPDATE context_documents SET is_dirty = 0, last_synced = CURRENT_TIMESTAMP WHERE id = ?');
    stmt.run(id);
  }

  /**
   * Delete a context document
   */
  delete(id: number): void {
    const stmt = this.db.prepare('DELETE FROM context_documents WHERE id = ?');
    stmt.run(id);
  }
}
