/**
 * ProjectService Tests
 *
 * Tests for project management business logic:
 * - Name detection (package.json → composer.json → folder)
 * - Type detection (node, php, fullstack, generic)
 * - Path validation
 * - Error handling
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Database from 'better-sqlite3';
import { ProjectService } from '../ProjectService';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

describe('ProjectService', () => {
  let db: Database.Database;
  let service: ProjectService;
  let tempDbPath: string;
  let tempProjectDir: string;

  beforeEach(() => {
    // Create temporary database
    tempDbPath = path.join(os.tmpdir(), `test-project-service-${Date.now()}-${Math.random()}.db`);
    db = new Database(tempDbPath);

    // Create schema
    db.exec(`
      CREATE TABLE projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        path TEXT NOT NULL UNIQUE,
        has_bmad BOOLEAN NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        last_opened_at TEXT
      );

      CREATE TABLE app_settings (
        id INTEGER PRIMARY KEY CHECK(id = 1),
        bmad_global_path TEXT NOT NULL,
        bmad_repo_path TEXT,
        bmad_sync_enabled BOOLEAN NOT NULL DEFAULT 0,
        theme TEXT NOT NULL CHECK(theme IN ('light', 'dark', 'system')) DEFAULT 'system',
        default_providers_spec TEXT NOT NULL,
        default_providers_tech TEXT NOT NULL,
        default_providers_steps TEXT NOT NULL,
        review_provider TEXT NOT NULL
      );

      INSERT INTO app_settings (
        id, bmad_global_path, bmad_repo_path, bmad_sync_enabled,
        default_providers_spec, default_providers_tech, default_providers_steps, review_provider
      ) VALUES (
        1, '${os.homedir()}/.claude', NULL, 0,
        '["openai"]', '["openai"]', '["openai"]', 'openai'
      );
    `);

    service = new ProjectService(db);

    // Create temporary project directory
    tempProjectDir = path.join(os.tmpdir(), `test-project-${Date.now()}-${Math.random()}`);
    fs.mkdirSync(tempProjectDir, { recursive: true });
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
      if (fs.existsSync(tempDbPath + '-wal')) {
        fs.unlinkSync(tempDbPath + '-wal');
      }
      if (fs.existsSync(tempDbPath + '-shm')) {
        fs.unlinkSync(tempDbPath + '-shm');
      }
      if (fs.existsSync(tempProjectDir)) {
        fs.rmSync(tempProjectDir, { recursive: true, force: true });
      }
    } catch (e) {
      // Ignore cleanup errors
    }
  });

  describe('detectProjectName', () => {
    it('should detect name from package.json', async () => {
      // Create package.json FIRST before adding project
      const packageJson = { name: 'my-awesome-project' };
      fs.writeFileSync(
        path.join(tempProjectDir, 'package.json'),
        JSON.stringify(packageJson)
      );

      // Add project to DB so tempProjectDir is in allowed directories
      const project = await service.addProject(tempProjectDir);

      // Verify the name was detected correctly during addProject
      expect(project.name).toBe('my-awesome-project');
    });

    it('should detect name from composer.json if package.json does not exist', async () => {
      const composerJson = { name: 'vendor/my-php-project' };
      fs.writeFileSync(
        path.join(tempProjectDir, 'composer.json'),
        JSON.stringify(composerJson)
      );

      const project = await service.addProject(tempProjectDir);
      expect(project.name).toBe('vendor/my-php-project');
    });

    it('should use folder name if both JSONs are missing', async () => {
      const project = await service.addProject(tempProjectDir);
      expect(project.name).toBe(path.basename(tempProjectDir));
    });

    it('should handle corrupted package.json without crashing', async () => {
      fs.writeFileSync(
        path.join(tempProjectDir, 'package.json'),
        '{ invalid json'
      );

      const project = await service.addProject(tempProjectDir);
      // Should fallback to folder name
      expect(project.name).toBe(path.basename(tempProjectDir));
    });

    it('should prefer package.json over composer.json', async () => {
      const packageJson = { name: 'node-project' };
      const composerJson = { name: 'php-project' };
      fs.writeFileSync(
        path.join(tempProjectDir, 'package.json'),
        JSON.stringify(packageJson)
      );
      fs.writeFileSync(
        path.join(tempProjectDir, 'composer.json'),
        JSON.stringify(composerJson)
      );

      const project = await service.addProject(tempProjectDir);
      expect(project.name).toBe('node-project');
    });

    it('should handle package.json without name field', async () => {
      const packageJson = { version: '1.0.0' }; // No name field
      fs.writeFileSync(
        path.join(tempProjectDir, 'package.json'),
        JSON.stringify(packageJson)
      );

      const project = await service.addProject(tempProjectDir);
      // Should fallback to folder name
      expect(project.name).toBe(path.basename(tempProjectDir));
    });
  });

  describe('detectProjectType', () => {
    it('should return "fullstack" if both package.json and composer.json exist', async () => {
      fs.writeFileSync(path.join(tempProjectDir, 'package.json'), '{}');
      fs.writeFileSync(path.join(tempProjectDir, 'composer.json'), '{}');

      const type = await service.detectProjectType(tempProjectDir);
      expect(type).toBe('fullstack');
    });

    it('should return "node" if only package.json exists', async () => {
      fs.writeFileSync(path.join(tempProjectDir, 'package.json'), '{}');

      const type = await service.detectProjectType(tempProjectDir);
      expect(type).toBe('node');
    });

    it('should return "php" if only composer.json exists', async () => {
      fs.writeFileSync(path.join(tempProjectDir, 'composer.json'), '{}');

      const type = await service.detectProjectType(tempProjectDir);
      expect(type).toBe('php');
    });

    it('should return "generic" if neither file exists', async () => {
      const type = await service.detectProjectType(tempProjectDir);
      expect(type).toBe('generic');
    });
  });

  describe('addProject', () => {
    it('should add project with detected name and type', async () => {
      const packageJson = { name: 'test-project' };
      fs.writeFileSync(
        path.join(tempProjectDir, 'package.json'),
        JSON.stringify(packageJson)
      );

      const project = await service.addProject(tempProjectDir);

      expect(project.id).toBeDefined();
      expect(project.name).toBe('test-project');
      expect(project.path).toBe(tempProjectDir);
      expect(project.has_bmad).toBe(false);
      expect(project.last_opened_at).toBeNull();
    });

    it('should reject duplicate path', async () => {
      await service.addProject(tempProjectDir);

      await expect(service.addProject(tempProjectDir)).rejects.toThrow(
        'El proyecto ya existe'
      );
    });

    it('should reject non-existent path', async () => {
      const nonExistentPath = '/non/existent/path';

      await expect(service.addProject(nonExistentPath)).rejects.toThrow(
        'File not found'
      );
    });
  });

  describe('listProjects', () => {
    it('should return empty array when no projects', () => {
      const projects = service.listProjects();
      expect(projects).toEqual([]);
    });

    it('should return all projects ordered alphabetically by name', async () => {
      // Create 3 temp directories with unique names
      const timestamp = Date.now();
      const tempDir1 = path.join(os.tmpdir(), `zulu-project-${timestamp}-1`);
      const tempDir2 = path.join(os.tmpdir(), `alpha-project-${timestamp}-2`);
      const tempDir3 = path.join(os.tmpdir(), `beta-project-${timestamp}-3`);

      fs.mkdirSync(tempDir1);
      fs.mkdirSync(tempDir2);
      fs.mkdirSync(tempDir3);

      try {
        // Create package.json files FIRST with specific names
        fs.writeFileSync(path.join(tempDir1, 'package.json'), JSON.stringify({ name: 'zulu-project' }));
        fs.writeFileSync(path.join(tempDir2, 'package.json'), JSON.stringify({ name: 'Alpha Project' }));
        fs.writeFileSync(path.join(tempDir3, 'package.json'), JSON.stringify({ name: 'beta-project' }));

        // Then add projects (this will detect names from package.json)
        await service.addProject(tempDir1);
        await service.addProject(tempDir2);
        await service.addProject(tempDir3);

        const projects = service.listProjects();

        expect(projects.length).toBe(3);
        // Should be ordered alphabetically (case-insensitive)
        expect(projects[0].name).toBe('Alpha Project');
        expect(projects[1].name).toBe('beta-project');
        expect(projects[2].name).toBe('zulu-project');
      } finally {
        // Cleanup
        fs.rmSync(tempDir1, { recursive: true, force: true });
        fs.rmSync(tempDir2, { recursive: true, force: true });
        fs.rmSync(tempDir3, { recursive: true, force: true });
      }
    });
  });

  describe('removeProject', () => {
    it('should remove project from database', async () => {
      const project = await service.addProject(tempProjectDir);

      service.removeProject(project.id);

      const projects = service.listProjects();
      expect(projects).toEqual([]);
    });

    it('should not delete files from filesystem', async () => {
      const project = await service.addProject(tempProjectDir);

      service.removeProject(project.id);

      // Verify directory still exists
      expect(fs.existsSync(tempProjectDir)).toBe(true);
    });
  });
});
