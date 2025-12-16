/**
 * FileSystemService
 *
 * Unified filesystem abstraction layer for BMAD Studio.
 * Provides secure, validated file operations with consistent error handling.
 */

import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import * as path from 'path';
import { dialog } from 'electron';
import type { Database } from 'better-sqlite3';
import { SettingsRepository } from '../repositories/SettingsRepository';
import { ProjectRepository } from '../repositories/ProjectRepository';
import {
  FileNotFoundError,
  PermissionDeniedError,
  FileTooLargeError,
  DiskFullError,
  InvalidPathError,
  FileSystemError,
} from '../errors/FileSystemErrors';
import { createWatcher } from '../utils/FileWatcher';
import type { FileChangeCallback, Disposer, FileChangeEvent } from '../types/filesystem.types';

// Default limits
const DEFAULT_MAX_FILE_SIZE = 1048576; // 1MB in bytes

export class FileSystemService {
  private settingsRepository: SettingsRepository;
  private projectRepository: ProjectRepository;

  constructor(db: Database) {
    this.settingsRepository = new SettingsRepository(db);
    this.projectRepository = new ProjectRepository(db);
  }

  /**
   * Read file contents with UTF-8 encoding
   * Validates path and enforces 1MB size limit
   *
   * @param filePath Absolute path to file
   * @returns File contents as string
   * @throws FileNotFoundError if file doesn't exist
   * @throws PermissionDeniedError if no read permission
   * @throws FileTooLargeError if file exceeds 1MB
   * @throws InvalidPathError if path is outside allowed directories
   */
  async readFile(filePath: string): Promise<string> {
    const validatedPath = await this.validatePath(filePath);

    try {
      // Check file exists and get size
      const stats = await fs.stat(validatedPath);

      // Enforce size limit
      if (stats.size > DEFAULT_MAX_FILE_SIZE) {
        throw new FileTooLargeError(validatedPath, stats.size, DEFAULT_MAX_FILE_SIZE);
      }

      // Read file with UTF-8 encoding
      const content = await fs.readFile(validatedPath, 'utf-8');
      return content;
    } catch (error: any) {
      if (error instanceof FileTooLargeError) {
        throw error;
      }

      if (error.code === 'ENOENT') {
        throw new FileNotFoundError(validatedPath);
      }

      if (error.code === 'EACCES') {
        throw new PermissionDeniedError(validatedPath);
      }

      throw new FileSystemError(
        `Failed to read file: ${error.message}`,
        validatedPath,
        error
      );
    }
  }

  /**
   * Write file contents with UTF-8 encoding
   * Creates parent directories if needed
   *
   * @param filePath Absolute path to file
   * @param content Content to write
   * @throws PermissionDeniedError if no write permission
   * @throws DiskFullError if disk is full
   * @throws InvalidPathError if path is outside allowed directories
   */
  async writeFile(filePath: string, content: string): Promise<void> {
    const validatedPath = await this.validatePath(filePath);

    try {
      // Ensure parent directory exists
      const dirPath = path.dirname(validatedPath);
      await fs.mkdir(dirPath, { recursive: true });

      // Write file with UTF-8 encoding and 644 permissions
      await fs.writeFile(validatedPath, content, {
        encoding: 'utf-8',
        mode: 0o644,
      });
    } catch (error: any) {
      if (error.code === 'EACCES') {
        throw new PermissionDeniedError(validatedPath);
      }

      if (error.code === 'ENOSPC') {
        throw new DiskFullError(validatedPath);
      }

      throw new FileSystemError(
        `Failed to write file: ${error.message}`,
        validatedPath,
        error
      );
    }
  }

  /**
   * Create directory recursively (like mkdir -p)
   * Idempotent - doesn't fail if directory already exists
   *
   * @param dirPath Absolute path to directory
   * @throws PermissionDeniedError if no write permission
   * @throws InvalidPathError if path is outside allowed directories
   */
  async createDirectory(dirPath: string): Promise<void> {
    const validatedPath = await this.validatePath(dirPath);

    try {
      await fs.mkdir(validatedPath, { recursive: true });
    } catch (error: any) {
      if (error.code === 'EACCES') {
        throw new PermissionDeniedError(validatedPath);
      }

      throw new FileSystemError(
        `Failed to create directory: ${error.message}`,
        validatedPath,
        error
      );
    }
  }

  /**
   * Open native folder selection dialog
   *
   * @param defaultPath Default path to show in dialog
   * @returns Selected folder path or null if cancelled
   */
  async selectFolder(defaultPath?: string): Promise<string | null> {
    const { filePaths, canceled } = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      defaultPath: defaultPath || path.join(process.env.HOME || '~', 'Documents'),
    });

    if (canceled || filePaths.length === 0) {
      return null;
    }

    // Validate selected path
    const selectedPath = filePaths[0];
    try {
      await this.validatePath(selectedPath);
      return selectedPath;
    } catch (error) {
      // Allow paths outside allowed directories for folder selection
      // User explicitly selected this folder
      return selectedPath;
    }
  }

  /**
   * Check if file or directory exists
   * Does NOT validate against allowed directories (read-only check)
   *
   * @param filePath Absolute path to check
   * @returns true if exists, false otherwise
   */
  async exists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath, fsSync.constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * List files in directory with optional glob pattern
   *
   * @param dirPath Absolute path to directory
   * @param pattern Optional glob pattern (e.g., "*.md", "** /*.json")
   * @returns Array of file paths relative to dirPath
   * @throws FileNotFoundError if directory doesn't exist
   * @throws PermissionDeniedError if no read permission
   * @throws InvalidPathError if path is outside allowed directories
   */
  async listFiles(dirPath: string, pattern?: string): Promise<string[]> {
    const validatedPath = await this.validatePath(dirPath);

    try {
      const entries = await fs.readdir(validatedPath, { withFileTypes: true });
      let files = entries
        .filter(entry => entry.isFile())
        .map(entry => entry.name);

      // Apply glob pattern if provided
      if (pattern) {
        const { minimatch } = await import('minimatch');
        files = files.filter(file => minimatch(file, pattern));
      }

      return files;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        throw new FileNotFoundError(validatedPath);
      }

      if (error.code === 'EACCES') {
        throw new PermissionDeniedError(validatedPath);
      }

      throw new FileSystemError(
        `Failed to list files: ${error.message}`,
        validatedPath,
        error
      );
    }
  }

  /**
   * Watch a specific file for changes
   * Invokes callback when file is added, changed, or removed
   *
   * @param filePath Absolute path to file
   * @param callback Function to call on file changes
   * @returns Disposer function to stop watching
   * @throws InvalidPathError if path is outside allowed directories
   */
  async watchFile(filePath: string, callback: FileChangeCallback): Promise<Disposer> {
    const validatedPath = await this.validatePath(filePath);

    const watcher = createWatcher(validatedPath, {
      ignored: [/\.swp$/, /\.tmp$/, /^~/, /\.DS_Store$/],
      persistent: true,
      awaitWriteFinish: {
        stabilityThreshold: 300,
        pollInterval: 100,
      },
    });

    // Register event handlers
    watcher
      .on('add', (path, stats) => {
        const event: FileChangeEvent = { type: 'add', path, stats };
        callback(event);
      })
      .on('change', (path, stats) => {
        const event: FileChangeEvent = { type: 'change', path, stats };
        callback(event);
      })
      .on('unlink', (path) => {
        const event: FileChangeEvent = { type: 'unlink', path };
        callback(event);
      });

    // Return disposer function
    return () => {
      watcher.close();
    };
  }

  /**
   * Watch a directory recursively for changes
   * Invokes callback when any file in directory tree is added, changed, or removed
   *
   * @param dirPath Absolute path to directory
   * @param callback Function to call on file changes
   * @returns Disposer function to stop watching
   * @throws InvalidPathError if path is outside allowed directories
   */
  async watchDirectory(dirPath: string, callback: FileChangeCallback): Promise<Disposer> {
    const validatedPath = await this.validatePath(dirPath);

    const watcher = createWatcher(validatedPath, {
      ignored: [/\.swp$/, /\.tmp$/, /^~/, /\.DS_Store$/],
      persistent: true,
      awaitWriteFinish: {
        stabilityThreshold: 300,
        pollInterval: 100,
      },
    });

    // Register event handlers
    watcher
      .on('add', (path, stats) => {
        const event: FileChangeEvent = { type: 'add', path, stats };
        callback(event);
      })
      .on('change', (path, stats) => {
        const event: FileChangeEvent = { type: 'change', path, stats };
        callback(event);
      })
      .on('unlink', (path) => {
        const event: FileChangeEvent = { type: 'unlink', path };
        callback(event);
      });

    // Return disposer function
    return () => {
      watcher.close();
    };
  }

  /**
   * Validate path against allowed directories
   * Resolves symlinks to real paths
   * Prevents path traversal attacks
   *
   * @param filePath Path to validate
   * @returns Resolved absolute path
   * @throws InvalidPathError if path is invalid or outside allowed directories
   */
  private async validatePath(filePath: string): Promise<string> {
    try {
      // Resolve to absolute path
      const absolutePath = path.resolve(filePath);

      // Resolve symlinks to real path
      let realPath: string;
      try {
        realPath = await fs.realpath(absolutePath);
      } catch (error: any) {
        if (error.code === 'ENOENT') {
          // File doesn't exist yet (e.g., for write operations)
          // Try to resolve parent directory, or use absolute path
          let parentDir = path.dirname(absolutePath);
          let resolvedParent = absolutePath;

          // Walk up the tree until we find an existing directory
          while (parentDir !== path.dirname(parentDir)) {
            try {
              const parentRealPath = await fs.realpath(parentDir);
              const remainingPath = absolutePath.substring(parentDir.length);
              resolvedParent = path.join(parentRealPath, remainingPath);
              break;
            } catch (e: any) {
              if (e.code === 'ENOENT') {
                parentDir = path.dirname(parentDir);
              } else {
                break;
              }
            }
          }

          realPath = resolvedParent;
        } else {
          throw error;
        }
      }

      // Check against allowed directories
      const allowedDirs = this.getAllowedDirectories();
      const isAllowed = allowedDirs.some(allowedDir => {
        const normalizedAllowed = path.resolve(allowedDir);
        return realPath.startsWith(normalizedAllowed);
      });

      if (!isAllowed) {
        throw new InvalidPathError(
          realPath,
          `Path is outside allowed directories: ${allowedDirs.join(', ')}`
        );
      }

      return realPath;
    } catch (error: any) {
      if (error instanceof InvalidPathError) {
        throw error;
      }

      throw new InvalidPathError(filePath, `Invalid path: ${error.message}`);
    }
  }

  /**
   * Get list of allowed directories for filesystem operations
   * Includes:
   * - BMAD global path (~/.claude/)
   * - BMAD repo path (if configured)
   * - All project paths
   *
   * @returns Array of absolute directory paths (with symlinks resolved)
   */
  private getAllowedDirectories(): string[] {
    const allowedDirs: string[] = [];

    // Get BMAD paths from settings
    const settings = this.settingsRepository.get();
    if (settings.bmad_global_path) {
      allowedDirs.push(settings.bmad_global_path);
    }
    if (settings.bmad_repo_path) {
      allowedDirs.push(settings.bmad_repo_path);
    }

    // Get all project paths
    const projects = this.projectRepository.findAll();
    projects.forEach(project => {
      allowedDirs.push(project.path);
    });

    // Resolve all to absolute paths and resolve symlinks
    return allowedDirs.map(dir => {
      const absoluteDir = path.resolve(dir);
      try {
        // Try to resolve symlinks synchronously
        return fsSync.realpathSync(absoluteDir);
      } catch {
        // If it fails (doesn't exist yet), use absolute path
        return absoluteDir;
      }
    });
  }
}
