/**
 * DatabaseManager
 *
 * Main database manager for BMAD Studio.
 * Handles SQLite connection lifecycle, migrations, integrity checks, and backups.
 *
 * Features:
 * - Auto-initialization with app userData path
 * - Automatic migration execution on startup
 * - Database integrity validation
 * - Backup/restore support
 * - Exclusive file locking to prevent corruption
 */

import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs/promises';
import { existsSync } from 'fs';
import { app } from 'electron';
import { MigrationRunner } from './MigrationRunner';

export class DatabaseManager {
  private db: Database.Database | null = null;
  private dbPath: string = '';
  private migrationRunner: MigrationRunner | null = null;

  /**
   * Initialize the database
   * - Resolves database file path
   * - Creates directory if needed
   * - Opens SQLite connection
   * - Runs pending migrations
   *
   * @throws {Error} If database initialization fails
   */
  async initialize(): Promise<void> {
    console.log('🔧 Initializing database...');

    // Resolve database path (Application Support directory)
    const userDataPath = app.getPath('userData');
    this.dbPath = path.join(userDataPath, 'bmad-studio.db');

    console.log(`   Database path: ${this.dbPath}`);

    // Ensure directory exists
    const dbDir = path.dirname(this.dbPath);
    if (!existsSync(dbDir)) {
      console.log(`   Creating directory: ${dbDir}`);
      await fs.mkdir(dbDir, { recursive: true });
    }

    // Check if database exists (first run detection)
    const isFirstRun = !existsSync(this.dbPath);
    if (isFirstRun) {
      console.log('   📝 First run detected - database will be created');
    }

    try {
      // Check integrity if database already exists
      if (!isFirstRun) {
        const isValid = await this.checkIntegrityBeforeOpen();
        if (!isValid) {
          console.warn('   ⚠️  Database integrity check failed - creating backup');
          await this.backupCorruptDatabase();
          // Create new database
        }
      }

      // Open SQLite connection
      this.db = new Database(this.dbPath, {
        verbose: process.env.NODE_ENV === 'development' ? console.log : undefined,
        fileMustExist: false, // Create if doesn't exist
      });

      // Configure SQLite for better performance and safety
      this.db.pragma('journal_mode = WAL'); // Write-Ahead Logging for better concurrency
      this.db.pragma('foreign_keys = ON'); // Enable foreign key constraints
      this.db.pragma('busy_timeout = 5000'); // Wait up to 5s if database is locked

      console.log('   ✅ Database connection opened');

      // Run pending migrations
      this.migrationRunner = new MigrationRunner(this.db);
      await this.migrationRunner.runPending();

      console.log('✅ Database initialized successfully');
    } catch (error) {
      console.error('❌ Database initialization failed:', error);

      if (this.db) {
        this.db.close();
        this.db = null;
      }

      throw new Error(`Failed to initialize database: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get the active database connection
   * @throws {Error} If database is not initialized
   */
  getConnection(): Database.Database {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.db;
  }

  /**
   * Close the database connection
   */
  close(): void {
    if (this.db) {
      console.log('🔒 Closing database connection...');
      this.db.close();
      this.db = null;
      this.migrationRunner = null;
      console.log('✅ Database connection closed');
    }
  }

  /**
   * Check database integrity using PRAGMA integrity_check
   * @returns true if database is valid, false otherwise
   */
  async checkIntegrity(): Promise<boolean> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      const result = this.db.pragma('integrity_check') as Array<{ integrity_check: string }>;
      // Result is an array with one item: { integrity_check: 'ok' } or error messages
      const isValid = result.length === 1 && result[0].integrity_check === 'ok';

      if (!isValid) {
        console.error('❌ Database integrity check failed:', result);
      }

      return isValid;
    } catch (error) {
      console.error('❌ Integrity check failed:', error);
      return false;
    }
  }

  /**
   * Check integrity before opening database
   * Opens a temporary read-only connection to check
   */
  private async checkIntegrityBeforeOpen(): Promise<boolean> {
    if (!existsSync(this.dbPath)) {
      return true; // No database file, nothing to check
    }

    try {
      const tempDb = new Database(this.dbPath, { readonly: true });
      const result = tempDb.pragma('integrity_check') as Array<{ integrity_check: string }>;
      tempDb.close();

      const isValid = result.length === 1 && result[0].integrity_check === 'ok';
      return isValid;
    } catch (error) {
      console.error('❌ Pre-open integrity check failed:', error);
      return false;
    }
  }

  /**
   * Backup corrupt database before replacing it
   */
  private async backupCorruptDatabase(): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = this.dbPath.replace('.db', `.corrupt.${timestamp}.db`);

    try {
      await fs.copyFile(this.dbPath, backupPath);
      console.log(`   ✅ Corrupt database backed up to: ${backupPath}`);

      // Remove corrupt database
      await fs.unlink(this.dbPath);
    } catch (error) {
      console.error('❌ Failed to backup corrupt database:', error);
    }
  }

  /**
   * Create a backup of the database
   * @param destination - Destination path for backup file
   */
  async backup(destination: string): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      // Use SQLite's VACUUM INTO for atomic backup
      this.db.exec(`VACUUM INTO '${destination}'`);
      console.log(`✅ Database backed up to: ${destination}`);
    } catch (error) {
      // Fallback: copy file directly
      console.warn('⚠️  VACUUM INTO failed, using file copy fallback');
      await fs.copyFile(this.dbPath, destination);
      console.log(`✅ Database backed up to: ${destination} (file copy)`);
    }
  }

  /**
   * Get current database file path
   */
  getDatabasePath(): string {
    return this.dbPath;
  }

  /**
   * Get migration runner instance
   * @throws {Error} If database is not initialized
   */
  getMigrationRunner(): MigrationRunner {
    if (!this.migrationRunner) {
      throw new Error('Migration runner not initialized');
    }
    return this.migrationRunner;
  }
}

// Singleton instance
let dbManager: DatabaseManager | null = null;

/**
 * Get the singleton DatabaseManager instance
 */
export function getDatabaseManager(): DatabaseManager {
  if (!dbManager) {
    dbManager = new DatabaseManager();
  }
  return dbManager;
}

/**
 * Initialize the database (convenience function)
 */
export async function initializeDatabase(): Promise<void> {
  const manager = getDatabaseManager();
  await manager.initialize();
}

/**
 * Close the database (convenience function)
 */
export function closeDatabase(): void {
  if (dbManager) {
    dbManager.close();
    dbManager = null;
  }
}
