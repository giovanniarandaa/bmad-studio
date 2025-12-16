/**
 * ProjectIpcHandler
 *
 * IPC handler for project management operations.
 * Exposes ProjectService methods to the renderer process via typed IPC channels.
 */

import { ipcMain, IpcMainInvokeEvent } from 'electron';
import type { Database } from 'better-sqlite3';
import type { Project } from '../../shared/types/database';
import { ProjectService } from '../services/ProjectService';
import { ProjectRepository } from '../repositories/ProjectRepository';
import { FileSystemService } from '../services/FileSystemService';

export class ProjectIpcHandler {
  private projectService: ProjectService;
  private projectRepository: ProjectRepository;
  private fileSystemService: FileSystemService;

  constructor(db: Database) {
    this.projectService = new ProjectService(db);
    this.projectRepository = new ProjectRepository(db);
    this.fileSystemService = new FileSystemService(db);
  }

  /**
   * Register all IPC handlers
   * Should be called once during app initialization
   */
  registerHandlers(): void {
    ipcMain.handle('project:add', this.handleAddProject.bind(this));
    ipcMain.handle('project:list', this.handleListProjects.bind(this));
    ipcMain.handle('project:remove', this.handleRemoveProject.bind(this));
    ipcMain.handle('project:updateName', this.handleUpdateName.bind(this));
    ipcMain.handle('project:validatePaths', this.handleValidatePaths.bind(this));
  }

  /**
   * Handler for project:add channel
   * Adds a new project to BMAD Studio
   * Uses folder name by default, or custom name if provided
   */
  private async handleAddProject(
    event: IpcMainInvokeEvent,
    payload: { path: string; name?: string }
  ): Promise<
    | { success: true; project: Project }
    | { success: false; error: string }
  > {
    try {
      const project = await this.projectService.addProject(payload.path, payload.name);
      return { success: true, project };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to add project',
      };
    }
  }

  /**
   * Handler for project:list channel
   * Lists all projects ordered alphabetically by name
   */
  private async handleListProjects(
    event: IpcMainInvokeEvent
  ): Promise<{ success: true; projects: Project[] }> {
    const projects = this.projectService.listProjects();
    return { success: true, projects };
  }

  /**
   * Handler for project:remove channel
   * Removes a project from BMAD Studio (does NOT delete files)
   */
  private async handleRemoveProject(
    event: IpcMainInvokeEvent,
    payload: { id: number }
  ): Promise<{ success: true } | { success: false; error: string }> {
    try {
      this.projectService.removeProject(payload.id);
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to remove project',
      };
    }
  }

  /**
   * Handler for project:updateName channel
   * Updates the name of an existing project
   */
  private async handleUpdateName(
    event: IpcMainInvokeEvent,
    payload: { id: number; name: string }
  ): Promise<
    | { success: true; project: Project }
    | { success: false; error: string }
  > {
    try {
      const project = this.projectService.updateProjectName(payload.id, payload.name);
      return { success: true, project };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to update project name',
      };
    }
  }

  /**
   * Handler for project:validatePaths channel
   * Validates existence of project paths in filesystem
   * Used to detect if projects have been moved or deleted
   */
  private async handleValidatePaths(
    event: IpcMainInvokeEvent,
    payload: { projectIds: number[] }
  ): Promise<
    | { success: true; pathsStatus: Record<number, boolean> }
    | { success: false; error: string }
  > {
    try {
      const validationMap = await this.projectRepository.validatePathExists(
        payload.projectIds,
        this.fileSystemService
      );

      // Convert Map to Record for JSON serialization
      const pathsStatus: Record<number, boolean> = {};
      validationMap.forEach((exists, projectId) => {
        pathsStatus[projectId] = exists;
      });

      return { success: true, pathsStatus };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to validate paths',
      };
    }
  }
}
