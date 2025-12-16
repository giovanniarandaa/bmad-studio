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
   * Convert SQLite row to Project (converts 0/1 to boolean)
   */
  private rowToProject(row: any): Project {
    return {
      ...row,
      has_bmad: Boolean(row.has_bmad),
    };
  }

  /**
   * Find all projects ordered alphabetically by name (case-insensitive)
   */
  findAll(): Project[] {
    const stmt = this.db.prepare('SELECT * FROM projects ORDER BY name COLLATE NOCASE');
    const rows = stmt.all() as any[];
    return rows.map(row => this.rowToProject(row));
  }

  /**
   * Find project by ID
   */
  findById(id: number): Project | null {
    const stmt = this.db.prepare('SELECT * FROM projects WHERE id = ?');
    const row = stmt.get(id) as any;
    return row ? this.rowToProject(row) : null;
  }

  /**
   * Find project by path
   */
  findByPath(path: string): Project | null {
    const stmt = this.db.prepare('SELECT * FROM projects WHERE path = ?');
    const row = stmt.get(path) as any;
    return row ? this.rowToProject(row) : null;
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

  /**
   * Validate existence of project paths in filesystem
   * Used to detect if project folders have been moved or deleted
   *
   * @param projectIds Array of project IDs to validate
   * @param fileSystemService Instance of FileSystemService to check path existence
   * @returns Map of project ID to boolean (true if path exists, false otherwise)
   */
  async validatePathExists(projectIds: number[], fileSystemService: { exists: (path: string) => Promise<boolean> }): Promise<Map<number, boolean>> {
    const validationMap = new Map<number, boolean>();

    // Batch fetch all projects by IDs
    const projects = projectIds.map(id => this.findById(id)).filter(p => p !== null) as Project[];

    // Check each path existence
    await Promise.all(
      projects.map(async (project) => {
        const exists = await fileSystemService.exists(project.path);
        validationMap.set(project.id, exists);
      })
    );

    return validationMap;
  }
}
