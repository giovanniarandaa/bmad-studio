/**
 * Project Store
 *
 * Zustand store for managing projects state.
 * Handles loading, adding, removing projects and validating paths.
 */

import { create } from 'zustand';
import type { Project } from '../../../shared/types/database';

export interface ProjectStore {
  // State
  projects: Project[];
  selectedProjectId: number | null;
  projectsLoading: boolean;
  projectPathsStatus: Map<number, boolean>;

  // Actions
  loadProjects: () => Promise<void>;
  addProject: (path?: string) => Promise<void>;
  removeProject: (id: number) => Promise<void>;
  setSelectedProject: (id: number) => void;
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  // Initial state
  projects: [],
  selectedProjectId: null,
  projectsLoading: false,
  projectPathsStatus: new Map(),

  // Actions
  loadProjects: async () => {
    set({ projectsLoading: true });

    try {
      // Load projects list
      const result = await window.electronAPI.invoke<{
        success: boolean;
        projects: Project[];
      }>('project:list');

      if (result.success) {
        const projects = result.projects;
        set({ projects });

        // Validate paths for all projects
        const projectIds = projects.map((p) => p.id);
        const validateResult = await window.electronAPI.invoke<{
          success: boolean;
          pathsStatus: Record<number, boolean>;
        }>('project:validatePaths', { projectIds });

        if (validateResult.success) {
          const pathsStatusMap = new Map(
            Object.entries(validateResult.pathsStatus).map(([id, exists]) => [
              Number(id),
              exists,
            ])
          );
          set({ projectPathsStatus: pathsStatusMap });
        }
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      set({ projectsLoading: false });
    }
  },

  addProject: async (path?: string) => {
    try {
      // If no path provided, open folder selector
      let projectPath = path;
      if (!projectPath) {
        const result = await window.electronAPI.invoke<{
          success: boolean;
          path?: string | null;
        }>('fs:selectFolder');

        if (!result.success || !result.path) {
          return; // User cancelled
        }

        projectPath = result.path;
      }

      // Add project via IPC
      const result = await window.electronAPI.invoke<{
        success: boolean;
        project?: Project;
        error?: string;
      }>('project:add', { path: projectPath });

      if (result.success && result.project) {
        // Add to projects list
        const { projects } = get();
        set({ projects: [...projects, result.project] });

        // Validate the new project's path
        const validateResult = await window.electronAPI.invoke<{
          success: boolean;
          pathsStatus: Record<number, boolean>;
        }>('project:validatePaths', { projectIds: [result.project.id] });

        if (validateResult.success) {
          const { projectPathsStatus } = get();
          const newStatus = new Map(projectPathsStatus);
          newStatus.set(result.project.id, validateResult.pathsStatus[result.project.id]);
          set({ projectPathsStatus: newStatus });
        }
      } else {
        console.error('Failed to add project:', result.error);
        alert(`Error al agregar proyecto: ${result.error}`);
      }
    } catch (error) {
      console.error('Error adding project:', error);
      alert('Ocurrió un error inesperado al agregar el proyecto.');
    }
  },

  removeProject: async (id: number) => {
    try {
      const result = await window.electronAPI.invoke<{
        success: boolean;
        error?: string;
      }>('project:remove', { id });

      if (result.success) {
        // Remove from projects list
        const { projects, projectPathsStatus, selectedProjectId } = get();
        const newProjects = projects.filter((p) => p.id !== id);
        const newStatus = new Map(projectPathsStatus);
        newStatus.delete(id);

        set({
          projects: newProjects,
          projectPathsStatus: newStatus,
          selectedProjectId: selectedProjectId === id ? null : selectedProjectId,
        });
      } else {
        console.error('Failed to remove project:', result.error);
      }
    } catch (error) {
      console.error('Error removing project:', error);
    }
  },

  setSelectedProject: (id: number) => {
    set({ selectedProjectId: id });
  },
}));
