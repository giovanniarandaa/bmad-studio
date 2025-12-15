/**
 * MigrationRunner Tests
 *
 * Tests for migration execution, rollback, and version tracking.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { MigrationRunner } from '../MigrationRunner';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

describe('MigrationRunner', () => {
  let db: Database.Database;
  let runner: MigrationRunner;
  let tempDbPath: string;

  beforeEach(() => {
    // Create temporary database for testing with unique name
    tempDbPath = path.join(os.tmpdir(), `test-migration-${Date.now()}-${Math.random()}.db`);
    db = new Database(tempDbPath);
    runner = new MigrationRunner(db);
  });

  afterEach(() => {
    // Clean up
    if (db) {
      try {
        db.close();
      } catch (e) {
        // Ignore close errors
      }
    }

    // Clean up temp files
    try {
      if (fs.existsSync(tempDbPath)) {
        fs.unlinkSync(tempDbPath);
      }
      // Clean up WAL and SHM files if they exist
      if (fs.existsSync(tempDbPath + '-wal')) {
        fs.unlinkSync(tempDbPath + '-wal');
      }
      if (fs.existsSync(tempDbPath + '-shm')) {
        fs.unlinkSync(tempDbPath + '-shm');
      }
    } catch (e) {
      // Ignore cleanup errors
    }
  });

  describe('runPending', () => {
    it('should create migrations table', async () => {
      await runner.runPending();

      const table = db.prepare(`
        SELECT name FROM sqlite_master
        WHERE type='table' AND name='migrations'
      `).get();

      expect(table).toBeDefined();
    });

    it('should execute initial migration', async () => {
      await runner.runPending();

      const currentVersion = runner.getCurrentVersion();
      expect(currentVersion).toBeGreaterThanOrEqual(1);
    });

    it('should create all expected tables from initial migration', async () => {
      await runner.runPending();

      const expectedTables = [
        'projects',
        'features',
        'documents',
        'generation_sessions',
        'generation_results',
        'llm_providers',
        'bmad_commands',
        'bmad_skills',
        'prompt_templates',
        'app_settings',
        'code_review_sessions',
        'code_review_findings',
        'troubleshooting_sessions',
        'troubleshooting_responses',
        'context_documents',
        'improvement_suggestions',
      ];

      // Get all created tables
      const allTables = db.prepare(`
        SELECT name FROM sqlite_master
        WHERE type='table' AND name NOT LIKE 'sqlite_%'
      `).all() as { name: string }[];

      const createdTableNames = allTables.map(t => t.name);

      for (const tableName of expectedTables) {
        const table = db.prepare(`
          SELECT name FROM sqlite_master
          WHERE type='table' AND name=?
        `).get(tableName);

        if (!table) {
          console.log(`Missing table: ${tableName}`);
          console.log(`Created tables:`, createdTableNames);
        }

        expect(table).toBeDefined();
      }
    });

    it('should not re-run already executed migrations', async () => {
      // Run migrations first time
      await runner.runPending();
      const versionAfterFirst = runner.getCurrentVersion();

      // Run again - should not change version
      await runner.runPending();
      const versionAfterSecond = runner.getCurrentVersion();

      expect(versionAfterFirst).toBe(versionAfterSecond);
    });
  });

  describe('getCurrentVersion', () => {
    it('should return 0 when no migrations executed', () => {
      const version = runner.getCurrentVersion();
      expect(version).toBe(0);
    });

    it('should return current version after migration', async () => {
      await runner.runPending();
      const version = runner.getCurrentVersion();
      expect(version).toBeGreaterThanOrEqual(1);
    });
  });

  describe('getMigrationHistory', () => {
    it('should return empty array when no migrations executed', () => {
      const history = runner.getMigrationHistory();
      expect(history).toEqual([]);
    });

    it('should return migration history after execution', async () => {
      await runner.runPending();
      const history = runner.getMigrationHistory();

      expect(history.length).toBeGreaterThan(0);
      expect(history[0]).toHaveProperty('version');
      expect(history[0]).toHaveProperty('name');
      expect(history[0]).toHaveProperty('executed_at');
    });
  });

  describe('rollback', () => {
    it('should rollback last migration', async () => {
      await runner.runPending();
      const versionBefore = runner.getCurrentVersion();

      await runner.rollback();
      const versionAfter = runner.getCurrentVersion();

      expect(versionAfter).toBe(versionBefore - 1);
    });

    it('should remove tables after rollback', async () => {
      await runner.runPending();

      // Verify table exists
      const beforeRollback = db.prepare(`
        SELECT name FROM sqlite_master
        WHERE type='table' AND name='projects'
      `).get();
      expect(beforeRollback).toBeDefined();

      // Rollback
      await runner.rollback();

      // Verify table removed
      const afterRollback = db.prepare(`
        SELECT name FROM sqlite_master
        WHERE type='table' AND name='projects'
      `).get();
      expect(afterRollback).toBeUndefined();
    });
  });
});
