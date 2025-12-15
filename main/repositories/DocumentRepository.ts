/**
 * DocumentRepository
 *
 * Repository for CRUD operations on the documents table.
 */

import type { Database } from 'better-sqlite3';
import type { Document, DocumentType } from '../../shared/types/database';

export class DocumentRepository {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  /**
   * Find all documents for a feature
   */
  findByFeatureId(featureId: number): Document[] {
    const stmt = this.db.prepare('SELECT * FROM documents WHERE feature_id = ? ORDER BY created_at DESC');
    return stmt.all(featureId) as Document[];
  }

  /**
   * Find document by type for a feature
   */
  findByType(featureId: number, type: DocumentType): Document | null {
    const stmt = this.db.prepare('SELECT * FROM documents WHERE feature_id = ? AND type = ? ORDER BY version DESC LIMIT 1');
    return (stmt.get(featureId, type) as Document) || null;
  }

  /**
   * Find document by ID
   */
  findById(id: number): Document | null {
    const stmt = this.db.prepare('SELECT * FROM documents WHERE id = ?');
    return (stmt.get(id) as Document) || null;
  }

  /**
   * Create a new document
   */
  create(data: Omit<Document, 'id' | 'created_at' | 'updated_at'>): Document {
    const stmt = this.db.prepare(`
      INSERT INTO documents (type, content, feature_id, version)
      VALUES (?, ?, ?, ?)
    `);

    const result = stmt.run(data.type, data.content, data.feature_id, data.version);

    const created = this.findById(result.lastInsertRowid as number);
    if (!created) {
      throw new Error('Failed to create document');
    }

    return created;
  }

  /**
   * Update a document
   */
  update(id: number, data: Partial<Pick<Document, 'content' | 'version'>>): void {
    const fields: string[] = ['updated_at = CURRENT_TIMESTAMP'];
    const values: any[] = [];

    if (data.content !== undefined) {
      fields.push('content = ?');
      values.push(data.content);
    }
    if (data.version !== undefined) {
      fields.push('version = ?');
      values.push(data.version);
    }

    values.push(id);

    const stmt = this.db.prepare(`UPDATE documents SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);
  }

  /**
   * Delete a document
   */
  delete(id: number): void {
    const stmt = this.db.prepare('DELETE FROM documents WHERE id = ?');
    stmt.run(id);
  }
}
