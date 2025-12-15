/**
 * SettingsRepository
 *
 * Repository for app_settings table (singleton).
 */

import type { Database } from 'better-sqlite3';
import type { AppSettings } from '../../shared/types/database';

export class SettingsRepository {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  /**
   * Get the singleton settings record
   * Creates with defaults if doesn't exist
   */
  get(): AppSettings {
    const stmt = this.db.prepare('SELECT * FROM app_settings WHERE id = 1');
    let settings = stmt.get() as AppSettings | undefined;

    if (!settings) {
      // Create default settings
      settings = this.createDefaults();
    }

    // Parse JSON fields
    return {
      ...settings,
      default_providers_spec: JSON.parse(settings.default_providers_spec as any),
      default_providers_tech: JSON.parse(settings.default_providers_tech as any),
      default_providers_steps: JSON.parse(settings.default_providers_steps as any)
    };
  }

  /**
   * Update settings
   */
  update(data: Partial<Omit<AppSettings, 'id'>>): void {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.bmad_global_path !== undefined) {
      fields.push('bmad_global_path = ?');
      values.push(data.bmad_global_path);
    }
    if (data.bmad_repo_path !== undefined) {
      fields.push('bmad_repo_path = ?');
      values.push(data.bmad_repo_path);
    }
    if (data.bmad_sync_enabled !== undefined) {
      fields.push('bmad_sync_enabled = ?');
      values.push(data.bmad_sync_enabled ? 1 : 0);
    }
    if (data.theme !== undefined) {
      fields.push('theme = ?');
      values.push(data.theme);
    }
    if (data.default_providers_spec !== undefined) {
      fields.push('default_providers_spec = ?');
      values.push(JSON.stringify(data.default_providers_spec));
    }
    if (data.default_providers_tech !== undefined) {
      fields.push('default_providers_tech = ?');
      values.push(JSON.stringify(data.default_providers_tech));
    }
    if (data.default_providers_steps !== undefined) {
      fields.push('default_providers_steps = ?');
      values.push(JSON.stringify(data.default_providers_steps));
    }
    if (data.review_provider !== undefined) {
      fields.push('review_provider = ?');
      values.push(data.review_provider);
    }

    if (fields.length === 0) return;

    values.push(1); // id is always 1

    const stmt = this.db.prepare(`UPDATE app_settings SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);
  }

  /**
   * Create default settings
   */
  private createDefaults(): AppSettings {
    const stmt = this.db.prepare(`
      INSERT INTO app_settings (
        id,
        bmad_global_path,
        bmad_repo_path,
        bmad_sync_enabled,
        theme,
        default_providers_spec,
        default_providers_tech,
        default_providers_steps,
        review_provider
      ) VALUES (1, ?, NULL, 0, 'system', '[]', '[]', '[]', 'openai')
    `);

    // Default BMAD path
    const defaultBMADPath = process.env.HOME ? `${process.env.HOME}/.claude` : '~/.claude';

    stmt.run(defaultBMADPath);

    return this.get();
  }
}
