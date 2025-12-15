/**
 * FeatureRepository
 *
 * Repository for CRUD operations on the features table.
 */

import type { Database } from 'better-sqlite3';
import type { Feature } from '../../shared/types/database';

export class FeatureRepository {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  /**
   * Find all features for a project
   */
  findByProjectId(projectId: number): Feature[] {
    const stmt = this.db.prepare('SELECT * FROM features WHERE project_id = ? ORDER BY feature_id ASC');
    return stmt.all(projectId) as Feature[];
  }

  /**
   * Find feature by ID
   */
  findById(id: number): Feature | null {
    const stmt = this.db.prepare('SELECT * FROM features WHERE id = ?');
    return (stmt.get(id) as Feature) || null;
  }

  /**
   * Find feature by feature_id string (e.g., "002")
   */
  findByFeatureId(featureId: string, projectId?: number): Feature | null {
    let stmt;
    let result;

    if (projectId !== undefined) {
      stmt = this.db.prepare('SELECT * FROM features WHERE feature_id = ? AND project_id = ?');
      result = stmt.get(featureId, projectId);
    } else {
      stmt = this.db.prepare('SELECT * FROM features WHERE feature_id = ?');
      result = stmt.get(featureId);
    }

    return (result as Feature) || null;
  }

  /**
   * Create a new feature
   */
  create(data: Omit<Feature, 'id'>): Feature {
    const stmt = this.db.prepare(`
      INSERT INTO features (feature_id, name, status, project_id, spec_path, tech_path, steps_path, status_path)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      data.feature_id,
      data.name,
      data.status,
      data.project_id,
      data.spec_path || null,
      data.tech_path || null,
      data.steps_path || null,
      data.status_path || null
    );

    const created = this.findById(result.lastInsertRowid as number);
    if (!created) {
      throw new Error('Failed to create feature');
    }

    return created;
  }

  /**
   * Update a feature
   */
  update(id: number, data: Partial<Omit<Feature, 'id' | 'project_id'>>): void {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.feature_id !== undefined) {
      fields.push('feature_id = ?');
      values.push(data.feature_id);
    }
    if (data.name !== undefined) {
      fields.push('name = ?');
      values.push(data.name);
    }
    if (data.status !== undefined) {
      fields.push('status = ?');
      values.push(data.status);
    }
    if (data.spec_path !== undefined) {
      fields.push('spec_path = ?');
      values.push(data.spec_path);
    }
    if (data.tech_path !== undefined) {
      fields.push('tech_path = ?');
      values.push(data.tech_path);
    }
    if (data.steps_path !== undefined) {
      fields.push('steps_path = ?');
      values.push(data.steps_path);
    }
    if (data.status_path !== undefined) {
      fields.push('status_path = ?');
      values.push(data.status_path);
    }

    if (fields.length === 0) {
      return;
    }

    values.push(id);

    const stmt = this.db.prepare(`UPDATE features SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);
  }

  /**
   * Delete a feature
   */
  delete(id: number): void {
    const stmt = this.db.prepare('DELETE FROM features WHERE id = ?');
    stmt.run(id);
  }
}
