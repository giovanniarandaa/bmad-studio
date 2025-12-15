/**
 * ProjectRepository
 *
 * Repository for CRUD operations on the projects table.
 */

import type { Database } from 'better-sqlite3';
import type { Project } from '../../shared/types/database';

export class ProjectRepository {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  /**
   * Find all projects
   */
  findAll(): Project[] {
    const stmt = this.db.prepare('SELECT * FROM projects ORDER BY last_opened_at DESC, created_at DESC');
    return stmt.all() as Project[];
  }

  /**
   * Find project by ID
   */
  findById(id: number): Project | null {
    const stmt = this.db.prepare('SELECT * FROM projects WHERE id = ?');
    return (stmt.get(id) as Project) || null;
  }

  /**
   * Find project by path
   */
  findByPath(path: string): Project | null {
    const stmt = this.db.prepare('SELECT * FROM projects WHERE path = ?');
    return (stmt.get(path) as Project) || null;
  }

  /**
   * Create a new project
   * @throws {Error} If path already exists
   */
  create(data: Omit<Project, 'id' | 'created_at'>): Project {
    // Check if path already exists
    const existing = this.findByPath(data.path);
    if (existing) {
      throw new Error(`Project with path "${data.path}" already exists`);
    }

    const stmt = this.db.prepare(`
      INSERT INTO projects (name, path, has_bmad, last_opened_at)
      VALUES (?, ?, ?, ?)
    `);

    const result = stmt.run(data.name, data.path, data.has_bmad ? 1 : 0, data.last_opened_at || null);

    const created = this.findById(result.lastInsertRowid as number);
    if (!created) {
      throw new Error('Failed to create project');
    }

    return created;
  }

  /**
   * Update a project
   */
  update(id: number, data: Partial<Omit<Project, 'id' | 'created_at'>>): void {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) {
      fields.push('name = ?');
      values.push(data.name);
    }
    if (data.path !== undefined) {
      fields.push('path = ?');
      values.push(data.path);
    }
    if (data.has_bmad !== undefined) {
      fields.push('has_bmad = ?');
      values.push(data.has_bmad ? 1 : 0);
    }
    if (data.last_opened_at !== undefined) {
      fields.push('last_opened_at = ?');
      values.push(data.last_opened_at);
    }

    if (fields.length === 0) {
      return; // Nothing to update
    }

    values.push(id);

    const stmt = this.db.prepare(`UPDATE projects SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);
  }

  /**
   * Delete a project
   * This will CASCADE delete all features and documents
   */
  delete(id: number): void {
    const stmt = this.db.prepare('DELETE FROM projects WHERE id = ?');
    stmt.run(id);
  }

  /**
   * Update last_opened_at to current timestamp
   */
  updateLastOpened(id: number): void {
    const stmt = this.db.prepare('UPDATE projects SET last_opened_at = CURRENT_TIMESTAMP WHERE id = ?');
    stmt.run(id);
  }
}
