/**
 * ProjectRepository Tests
 *
 * Tests for CRUD operations on projects table.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { ProjectRepository } from '../ProjectRepository';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

describe('ProjectRepository', () => {
  let db: Database.Database;
  let repo: ProjectRepository;
  let tempDbPath: string;

  beforeEach(() => {
    // Create temporary database for testing with unique name
    tempDbPath = path.join(os.tmpdir(), `test-project-${Date.now()}-${Math.random()}.db`);
    db = new Database(tempDbPath);

    // Create projects table
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

    repo = new ProjectRepository(db);
  });

  afterEach(() => {
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

  describe('create', () => {
    it('should create a new project', () => {
      const project = repo.create({
        name: 'Test Project',
        path: '/path/to/project',
        has_bmad: true,
        last_opened_at: null,
      });

      expect(project.id).toBeDefined();
      expect(project.name).toBe('Test Project');
      expect(project.path).toBe('/path/to/project');
      expect(project.has_bmad).toBe(true);
      expect(project.created_at).toBeDefined();
    });

    it('should throw error for duplicate path', () => {
      repo.create({
        name: 'Project 1',
        path: '/same/path',
        has_bmad: false,
        last_opened_at: null,
      });

      expect(() => {
        repo.create({
          name: 'Project 2',
          path: '/same/path',
          has_bmad: false,
          last_opened_at: null,
        });
      }).toThrow();
    });
  });

  describe('findAll', () => {
    it('should return empty array when no projects', () => {
      const projects = repo.findAll();
      expect(projects).toEqual([]);
    });

    it('should return all projects ordered by last_opened_at', () => {
      repo.create({
        name: 'Project A',
        path: '/path/a',
        has_bmad: false,
        last_opened_at: '2024-01-01T00:00:00Z',
      });

      repo.create({
        name: 'Project B',
        path: '/path/b',
        has_bmad: false,
        last_opened_at: '2024-01-02T00:00:00Z',
      });

      const projects = repo.findAll();
      expect(projects.length).toBe(2);
      // Most recently opened first
      expect(projects[0].name).toBe('Project B');
      expect(projects[1].name).toBe('Project A');
    });
  });

  describe('findById', () => {
    it('should return project by id', () => {
      const created = repo.create({
        name: 'Test Project',
        path: '/path/to/project',
        has_bmad: false,
        last_opened_at: null,
      });

      const found = repo.findById(created.id);
      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
      expect(found?.name).toBe('Test Project');
    });

    it('should return null for non-existent id', () => {
      const found = repo.findById(999);
      expect(found).toBeNull();
    });
  });

  describe('findByPath', () => {
    it('should return project by path', () => {
      repo.create({
        name: 'Test Project',
        path: '/unique/path',
        has_bmad: false,
        last_opened_at: null,
      });

      const found = repo.findByPath('/unique/path');
      expect(found).toBeDefined();
      expect(found?.path).toBe('/unique/path');
    });

    it('should return null for non-existent path', () => {
      const found = repo.findByPath('/non/existent');
      expect(found).toBeNull();
    });
  });

  describe('update', () => {
    it('should update project fields', () => {
      const project = repo.create({
        name: 'Original Name',
        path: '/path/to/project',
        has_bmad: false,
        last_opened_at: null,
      });

      repo.update(project.id, {
        name: 'Updated Name',
        has_bmad: true,
      });

      const updated = repo.findById(project.id);
      expect(updated?.name).toBe('Updated Name');
      expect(updated?.has_bmad).toBe(true);
    });
  });

  describe('updateLastOpened', () => {
    it('should update last_opened_at timestamp', () => {
      const project = repo.create({
        name: 'Test Project',
        path: '/path/to/project',
        has_bmad: false,
        last_opened_at: null,
      });

      repo.updateLastOpened(project.id);

      const updated = repo.findById(project.id);
      expect(updated?.last_opened_at).toBeDefined();
      expect(updated?.last_opened_at).not.toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete project by id', () => {
      const project = repo.create({
        name: 'Test Project',
        path: '/path/to/project',
        has_bmad: false,
        last_opened_at: null,
      });

      repo.delete(project.id);

      const found = repo.findById(project.id);
      expect(found).toBeNull();
    });
  });
});
