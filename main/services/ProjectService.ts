/**
 * ProjectService
 *
 * Business logic for project management: add, list, remove projects
 * with automatic detection of project name and type.
 */

import * as path from 'path';
import * as fs from 'fs/promises';
import type { Database } from 'better-sqlite3';
import type { Project } from '../../shared/types/database';
import { ProjectRepository } from '../repositories/ProjectRepository';
import { FileSystemService } from './FileSystemService';
import { FileNotFoundError, PermissionDeniedError } from '../errors/FileSystemErrors';
import { ProjectAlreadyExistsError } from '../errors/ProjectErrors';

export type ProjectType = 'node' | 'php' | 'fullstack' | 'generic';

export class ProjectService {
  private projectRepository: ProjectRepository;
  private fileSystemService: FileSystemService;

  constructor(db: Database) {
    this.projectRepository = new ProjectRepository(db);
    this.fileSystemService = new FileSystemService(db);
  }

  /**
   * Add a new project to BMAD Studio
   * Detects project name and type automatically
   *
   * @param projectPath Absolute path to project folder
   * @returns Created project
   * @throws FileNotFoundError if path doesn't exist
   * @throws PermissionDeniedError if path is not accessible
   * @throws ProjectAlreadyExistsError if path is already in database
   */
  async addProject(projectPath: string): Promise<Project> {
    // Validate path
    await this.validateProjectPath(projectPath);

    // Detect project metadata
    const name = await this.detectProjectName(projectPath);
    const type = await this.detectProjectType(projectPath);

    // Create project in database
    const project = this.projectRepository.create({
      name,
      path: projectPath,
      has_bmad: false, // Will be detected in future module
      last_opened_at: null,
    });

    return project;
  }

  /**
   * List all projects ordered alphabetically by name (case-insensitive)
   *
   * @returns Array of projects
   */
  listProjects(): Project[] {
    return this.projectRepository.findAll();
  }

  /**
   * Remove a project from BMAD Studio
   * Only removes from database, does NOT delete files from filesystem
   *
   * @param id Project ID
   */
  removeProject(id: number): void {
    this.projectRepository.delete(id);
  }

  /**
   * Detect project name with priority:
   * 1. package.json "name" field
   * 2. composer.json "name" field
   * 3. Folder name (basename)
   *
   * @param projectPath Absolute path to project
   * @returns Detected project name
   */
  async detectProjectName(projectPath: string): Promise<string> {
    const packageName = await this.readManifestName(projectPath, 'package.json');
    if (packageName) {
      return packageName;
    }

    const composerName = await this.readManifestName(projectPath, 'composer.json');
    if (composerName) {
      return composerName;
    }

    // Fallback: folder name
    return path.basename(projectPath);
  }

  private async readManifestName(projectPath: string, manifestFile: string): Promise<string | null> {
    const manifestPath = path.join(projectPath, manifestFile);

    try {
      const content = await fs.readFile(manifestPath, 'utf-8');
      const manifest = JSON.parse(content) as { name?: unknown };
      if (typeof manifest?.name === 'string' && manifest.name.trim().length > 0) {
        return manifest.name;
      }
    } catch {
      // Ignore errors and fall back to other strategies
    }

    return null;
  }

  /**
   * Detect project type based on files present
   *
   * @param projectPath Absolute path to project
   * @returns Project type: 'node' | 'php' | 'fullstack' | 'generic'
   */
  async detectProjectType(projectPath: string): Promise<ProjectType> {
    const hasPackageJson = await this.fileSystemService.exists(
      path.join(projectPath, 'package.json')
    );
    const hasComposerJson = await this.fileSystemService.exists(
      path.join(projectPath, 'composer.json')
    );

    if (hasPackageJson && hasComposerJson) {
      return 'fullstack';
    } else if (hasPackageJson) {
      return 'node';
    } else if (hasComposerJson) {
      return 'php';
    } else {
      return 'generic';
    }
  }

  /**
   * Validate project path
   * - Path must exist
   * - Path must be accessible
   * - Path must not be a duplicate
   *
   * @param projectPath Absolute path to project
   * @throws FileNotFoundError if path doesn't exist
   * @throws PermissionDeniedError if path is not accessible
   * @throws ProjectAlreadyExistsError if path is already in database
   */
  private async validateProjectPath(projectPath: string): Promise<void> {
    // Check existence
    const exists = await this.fileSystemService.exists(projectPath);
    if (!exists) {
      throw new FileNotFoundError(projectPath);
    }

    // Check not duplicate
    const existing = this.projectRepository.findByPath(projectPath);
    if (existing) {
      throw new ProjectAlreadyExistsError(projectPath);
    }
  }
}
