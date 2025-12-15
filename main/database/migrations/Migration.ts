/**
 * Migration Interface
 *
 * Defines the contract for database migrations.
 * Each migration must have a version number, name, and up/down methods.
 */

import type { Database } from 'better-sqlite3';

export interface Migration {
  /**
   * Unique version number for this migration
   * Should be sequential: 1, 2, 3, etc.
   */
  version: number;

  /**
   * Human-readable name for this migration
   * Example: "initial_schema", "add_settings_table"
   */
  name: string;

  /**
   * Apply this migration (forward)
   * @param db - SQLite database instance
   */
  up(db: Database): void;

  /**
   * Revert this migration (backward)
   * @param db - SQLite database instance
   */
  down(db: Database): void;
}
