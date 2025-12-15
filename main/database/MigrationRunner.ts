/**
 * MigrationRunner
 *
 * Manages database schema migrations with versioning, ordering, and rollback support.
 *
 * Features:
 * - Runs pending migrations in sequential order
 * - Tracks applied migrations in `migrations` table
 * - Supports rollback to previous versions
 * - Atomic migrations with transactions (all-or-nothing)
 * - Dynamic loading of migration files
 */

import type { Database } from 'better-sqlite3';
import type { Migration } from './migrations/Migration';
import * as path from 'path';
import * as fs from 'fs';

interface MigrationRecord {
  version: number;
  name: string;
  executed_at: string;
}

export class MigrationRunner {
  private db: Database;
  private migrationsDir: string;

  constructor(db: Database) {
    this.db = db;
    this.migrationsDir = path.join(__dirname, 'migrations');
  }

  /**
   * Initialize the migrations system
   * Creates the migrations table if it doesn't exist
   */
  private ensureMigrationsTable(): void {
    this.db
      .prepare(
        `
      CREATE TABLE IF NOT EXISTS migrations (
        version INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        executed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `
      )
      .run();
  }

  /**
   * Get current schema version
   * Returns 0 if no migrations have been applied
   */
  getCurrentVersion(): number {
    this.ensureMigrationsTable();

    const result = this.db
      .prepare('SELECT MAX(version) as version FROM migrations')
      .get() as { version: number | null };

    return result.version ?? 0;
  }

  /**
   * Get history of applied migrations
   */
  getMigrationHistory(): MigrationRecord[] {
    this.ensureMigrationsTable();

    return this.db
      .prepare('SELECT version, name, executed_at FROM migrations ORDER BY version ASC')
      .all() as MigrationRecord[];
  }

  /**
   * Load all migration files from the migrations directory
   * Returns migrations sorted by version
   */
  private async loadMigrations(): Promise<Migration[]> {
    const migrations: Migration[] = [];

    try {
      const files = fs
        .readdirSync(this.migrationsDir)
        .filter(
          (file) =>
            (file.endsWith('.ts') || file.endsWith('.js')) &&
            !file.includes('Migration.ts') &&
            !file.includes('Migration.js')
        )
        .sort(); // Sort alphabetically (assumes files are named like 001_*.ts, 002_*.ts)

      for (const file of files) {
        const filePath = path.join(this.migrationsDir, file);

        try {
          // Dynamic import for ES modules
          const module = await import(filePath);
          const migration: Migration = module.default || module;

          if (!migration.version || !migration.name || !migration.up || !migration.down) {
            console.warn(
              `⚠️  Migration file ${file} is invalid (missing version, name, up, or down)`
            );
            continue;
          }

          migrations.push(migration);
        } catch (error) {
          console.error(`❌ Failed to load migration ${file}:`, error);
        }
      }

      // Sort by version number
      migrations.sort((a, b) => a.version - b.version);

      return migrations;
    } catch (error) {
      console.error('❌ Failed to read migrations directory:', error);
      return [];
    }
  }

  /**
   * Run all pending migrations
   * Migrations are applied in sequential order within transactions
   */
  async runPending(): Promise<void> {
    this.ensureMigrationsTable();

    const currentVersion = this.getCurrentVersion();
    const allMigrations = await this.loadMigrations();

    const pendingMigrations = allMigrations.filter((m) => m.version > currentVersion);

    if (pendingMigrations.length === 0) {
      console.log('✅ Database is up to date (no pending migrations)');
      return;
    }

    console.log(`🔄 Running ${pendingMigrations.length} pending migration(s)...`);

    for (const migration of pendingMigrations) {
      await this.runMigration(migration, 'up');
    }

    console.log('✅ All migrations completed successfully');
  }

  /**
   * Rollback the last N migrations
   * @param steps - Number of migrations to rollback (default: 1)
   */
  async rollback(steps: number = 1): Promise<void> {
    this.ensureMigrationsTable();

    const history = this.getMigrationHistory();

    if (history.length === 0) {
      console.log('⚠️  No migrations to rollback');
      return;
    }

    const migrationsToRollback = history.slice(-steps).reverse();
    const allMigrations = await this.loadMigrations();

    console.log(`🔄 Rolling back ${migrationsToRollback.length} migration(s)...`);

    for (const record of migrationsToRollback) {
      const migration = allMigrations.find((m) => m.version === record.version);

      if (!migration) {
        console.error(
          `❌ Cannot rollback migration ${record.version} (${record.name}): migration file not found`
        );
        continue;
      }

      await this.runMigration(migration, 'down');
    }

    console.log('✅ Rollback completed');
  }

  /**
   * Run a single migration in a transaction
   * @param migration - The migration to run
   * @param direction - 'up' to apply, 'down' to revert
   */
  private async runMigration(
    migration: Migration,
    direction: 'up' | 'down'
  ): Promise<void> {
    const action = direction === 'up' ? 'Applying' : 'Reverting';
    console.log(`  ${action} migration ${migration.version}: ${migration.name}...`);

    // Use transaction for atomicity
    const transaction = this.db.transaction(() => {
      try {
        if (direction === 'up') {
          // Run the migration
          migration.up(this.db);

          // Record it in migrations table
          this.db
            .prepare(
              `
            INSERT INTO migrations (version, name, executed_at)
            VALUES (?, ?, CURRENT_TIMESTAMP)
          `
            )
            .run(migration.version, migration.name);
        } else {
          // Revert the migration
          migration.down(this.db);

          // Remove from migrations table
          this.db.prepare('DELETE FROM migrations WHERE version = ?').run(migration.version);
        }
      } catch (error) {
        console.error(`  ❌ Migration ${migration.version} failed:`, error);
        throw error; // This will trigger transaction rollback
      }
    });

    try {
      transaction();
      console.log(`  ✅ Migration ${migration.version} ${direction === 'up' ? 'applied' : 'reverted'}`);
    } catch (error) {
      console.error(`  ❌ Transaction rolled back for migration ${migration.version}`);
      throw error;
    }
  }
}
