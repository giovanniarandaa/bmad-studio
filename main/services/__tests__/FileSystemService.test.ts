/**
 * FileSystemService Tests
 *
 * Tests for filesystem operations with validation and error handling.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Database from 'better-sqlite3';
import { FileSystemService } from '../FileSystemService';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import {
  FileNotFoundError,
  FileTooLargeError,
  PermissionDeniedError,
  InvalidPathError,
} from '../../errors/FileSystemErrors';

describe('FileSystemService', () => {
  let db: Database.Database;
  let service: FileSystemService;
  let tempDbPath: string;
  let testDir: string;

  beforeEach(() => {
    // Create temporary database
    tempDbPath = path.join(os.tmpdir(), `test-fs-${Date.now()}-${Math.random()}.db`);
    db = new Database(tempDbPath);

    // Create required tables
    db.exec(`
      CREATE TABLE app_settings (
        id INTEGER PRIMARY KEY,
        bmad_global_path TEXT,
        bmad_repo_path TEXT,
        bmad_sync_enabled BOOLEAN DEFAULT 0,
        theme TEXT DEFAULT 'system',
        default_providers_spec TEXT DEFAULT '[]',
        default_providers_tech TEXT DEFAULT '[]',
        default_providers_steps TEXT DEFAULT '[]',
        review_provider TEXT DEFAULT 'openai'
      )
    `);

    db.exec(`
      CREATE TABLE projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        path TEXT NOT NULL UNIQUE,
        has_bmad BOOLEAN NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        last_opened_at TEXT
      )
    `);

    // Create test directory in temp
    testDir = path.join(os.tmpdir(), `test-bmad-${Date.now()}`);
    fs.mkdirSync(testDir, { recursive: true });

    // Insert test settings with test directory as allowed
    const stmt = db.prepare(`
      INSERT INTO app_settings (
        id, bmad_global_path, theme,
        default_providers_spec, default_providers_tech, default_providers_steps
      ) VALUES (1, ?, 'system', '[]', '[]', '[]')
    `);
    stmt.run(testDir);

    service = new FileSystemService(db);
  });

  afterEach(() => {
    if (db) {
      try {
        db.close();
      } catch (e) {
        // Ignore
      }
    }

    // Clean up test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }

    // Clean up temp database
    if (fs.existsSync(tempDbPath)) {
      fs.unlinkSync(tempDbPath);
    }
  });

  describe('readFile', () => {
    it('should read file contents with UTF-8 encoding', async () => {
      const filePath = path.join(testDir, 'test.txt');
      fs.writeFileSync(filePath, 'Hello World', 'utf-8');

      const content = await service.readFile(filePath);
      expect(content).toBe('Hello World');
    });

    it('should throw FileNotFoundError if file does not exist', async () => {
      const filePath = path.join(testDir, 'nonexistent.txt');

      await expect(service.readFile(filePath)).rejects.toThrow(FileNotFoundError);
    });

    it('should throw FileTooLargeError if file exceeds 1MB', async () => {
      const filePath = path.join(testDir, 'large.txt');
      const largeContent = 'x'.repeat(1048577); // 1MB + 1 byte
      fs.writeFileSync(filePath, largeContent);

      await expect(service.readFile(filePath)).rejects.toThrow(FileTooLargeError);
    });
  });

  describe('writeFile', () => {
    it('should write file with UTF-8 encoding', async () => {
      const filePath = path.join(testDir, 'output.txt');

      await service.writeFile(filePath, 'Test Content');

      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toBe('Test Content');
    });

    it('should create parent directories if they do not exist', async () => {
      const filePath = path.join(testDir, 'subdir', 'nested', 'file.txt');

      await service.writeFile(filePath, 'Nested Content');

      expect(fs.existsSync(filePath)).toBe(true);
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toBe('Nested Content');
    });

    it('should overwrite existing file', async () => {
      const filePath = path.join(testDir, 'existing.txt');
      fs.writeFileSync(filePath, 'Original');

      await service.writeFile(filePath, 'Updated');

      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toBe('Updated');
    });
  });

  describe('createDirectory', () => {
    it('should create directory recursively', async () => {
      const dirPath = path.join(testDir, 'a', 'b', 'c');

      await service.createDirectory(dirPath);

      expect(fs.existsSync(dirPath)).toBe(true);
      expect(fs.statSync(dirPath).isDirectory()).toBe(true);
    });

    it('should be idempotent (not fail if directory exists)', async () => {
      const dirPath = path.join(testDir, 'existing');
      fs.mkdirSync(dirPath);

      await expect(service.createDirectory(dirPath)).resolves.not.toThrow();
    });
  });

  describe('exists', () => {
    it('should return true if file exists', async () => {
      const filePath = path.join(testDir, 'exists.txt');
      fs.writeFileSync(filePath, 'content');

      const exists = await service.exists(filePath);
      expect(exists).toBe(true);
    });

    it('should return false if file does not exist', async () => {
      const filePath = path.join(testDir, 'nonexistent.txt');

      const exists = await service.exists(filePath);
      expect(exists).toBe(false);
    });

    it('should return true if directory exists', async () => {
      const dirPath = path.join(testDir, 'somedir');
      fs.mkdirSync(dirPath);

      const exists = await service.exists(dirPath);
      expect(exists).toBe(true);
    });
  });

  describe('listFiles', () => {
    it('should list all files in directory', async () => {
      // Create test files
      fs.writeFileSync(path.join(testDir, 'file1.txt'), 'content1');
      fs.writeFileSync(path.join(testDir, 'file2.md'), 'content2');
      fs.writeFileSync(path.join(testDir, 'file3.json'), 'content3');

      const files = await service.listFiles(testDir);

      expect(files).toHaveLength(3);
      expect(files).toContain('file1.txt');
      expect(files).toContain('file2.md');
      expect(files).toContain('file3.json');
    });

    it('should filter files with glob pattern', async () => {
      // Create test files
      fs.writeFileSync(path.join(testDir, 'file1.txt'), 'content1');
      fs.writeFileSync(path.join(testDir, 'file2.md'), 'content2');
      fs.writeFileSync(path.join(testDir, 'file3.json'), 'content3');

      const files = await service.listFiles(testDir, '*.md');

      expect(files).toHaveLength(1);
      expect(files).toContain('file2.md');
    });

    it('should throw FileNotFoundError if directory does not exist', async () => {
      const dirPath = path.join(testDir, 'nonexistent-dir');

      await expect(service.listFiles(dirPath)).rejects.toThrow(FileNotFoundError);
    });
  });
});
