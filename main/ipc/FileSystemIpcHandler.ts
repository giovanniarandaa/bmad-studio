/**
 * FileSystemIpcHandler
 *
 * IPC handler for filesystem operations.
 * Exposes FileSystemService methods to the renderer process via typed IPC channels.
 */

import { ipcMain, IpcMainInvokeEvent } from 'electron';
import type { FileSystemService } from '../services/FileSystemService';
import type { Disposer } from '../types/filesystem.types';

export class FileSystemIpcHandler {
  private fileSystemService: FileSystemService;
  private watchers: Map<string, Disposer>;

  constructor(fileSystemService: FileSystemService) {
    this.fileSystemService = fileSystemService;
    this.watchers = new Map();
  }

  /**
   * Register all IPC handlers
   * Should be called once during app initialization
   */
  registerHandlers(): void {
    // File operations
    ipcMain.handle('fs:readFile', this.handleReadFile.bind(this));
    ipcMain.handle('fs:writeFile', this.handleWriteFile.bind(this));
    ipcMain.handle('fs:createDirectory', this.handleCreateDirectory.bind(this));
    ipcMain.handle('fs:selectFolder', this.handleSelectFolder.bind(this));
    ipcMain.handle('fs:exists', this.handleExists.bind(this));
    ipcMain.handle('fs:listFiles', this.handleListFiles.bind(this));

    // Watch operations (event-based)
    ipcMain.on('fs:startWatchFile', this.handleStartWatchFile.bind(this));
    ipcMain.on('fs:startWatchDirectory', this.handleStartWatchDirectory.bind(this));
    ipcMain.on('fs:stopWatch', this.handleStopWatch.bind(this));
  }

  /**
   * Handler for fs:readFile channel
   */
  private async handleReadFile(
    event: IpcMainInvokeEvent,
    payload: { path: string }
  ): Promise<{ success: true; content: string } | { success: false; error: any }> {
    try {
      const content = await this.fileSystemService.readFile(payload.path);
      return { success: true, content };
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.message,
          code: error.code || error.name,
          path: error.path,
        },
      };
    }
  }

  /**
   * Handler for fs:writeFile channel
   */
  private async handleWriteFile(
    event: IpcMainInvokeEvent,
    payload: { path: string; content: string }
  ): Promise<{ success: true } | { success: false; error: any }> {
    try {
      await this.fileSystemService.writeFile(payload.path, payload.content);
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.message,
          code: error.code || error.name,
          path: error.path,
        },
      };
    }
  }

  /**
   * Handler for fs:createDirectory channel
   */
  private async handleCreateDirectory(
    event: IpcMainInvokeEvent,
    payload: { path: string }
  ): Promise<{ success: true } | { success: false; error: any }> {
    try {
      await this.fileSystemService.createDirectory(payload.path);
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.message,
          code: error.code || error.name,
          path: error.path,
        },
      };
    }
  }

  /**
   * Handler for fs:selectFolder channel
   */
  private async handleSelectFolder(
    event: IpcMainInvokeEvent,
    payload: { defaultPath?: string }
  ): Promise<{ success: true; path: string | null } | { success: false; error: any }> {
    try {
      const selectedPath = await this.fileSystemService.selectFolder(payload.defaultPath);
      return { success: true, path: selectedPath };
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.message,
          code: error.code || error.name,
        },
      };
    }
  }

  /**
   * Handler for fs:exists channel
   */
  private async handleExists(
    event: IpcMainInvokeEvent,
    payload: { path: string }
  ): Promise<{ success: true; exists: boolean } | { success: false; error: any }> {
    try {
      const exists = await this.fileSystemService.exists(payload.path);
      return { success: true, exists };
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.message,
          code: error.code || error.name,
        },
      };
    }
  }

  /**
   * Handler for fs:listFiles channel
   */
  private async handleListFiles(
    event: IpcMainInvokeEvent,
    payload: { dirPath: string; pattern?: string }
  ): Promise<{ success: true; files: string[] } | { success: false; error: any }> {
    try {
      const files = await this.fileSystemService.listFiles(payload.dirPath, payload.pattern);
      return { success: true, files };
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.message,
          code: error.code || error.name,
          path: error.path,
        },
      };
    }
  }

  /**
   * Handler for fs:startWatchFile event
   * Starts watching a file and sends events to renderer
   */
  private handleStartWatchFile(
    event: Electron.IpcMainEvent,
    payload: { watchId: string; path: string }
  ): void {
    const { watchId, path: filePath } = payload;

    // Create watcher
    this.fileSystemService
      .watchFile(filePath, (fileChangeEvent) => {
        // Send event to renderer
        event.sender.send('fs:fileChanged', {
          watchId,
          event: fileChangeEvent,
        });
      })
      .then((disposer) => {
        // Store disposer
        this.watchers.set(watchId, disposer);
      })
      .catch((error) => {
        // Send error to renderer
        event.sender.send('fs:fileChanged', {
          watchId,
          error: {
            message: error.message,
            code: error.code || error.name,
            path: error.path,
          },
        });
      });
  }

  /**
   * Handler for fs:startWatchDirectory event
   * Starts watching a directory recursively and sends events to renderer
   */
  private handleStartWatchDirectory(
    event: Electron.IpcMainEvent,
    payload: { watchId: string; dirPath: string }
  ): void {
    const { watchId, dirPath } = payload;

    // Create watcher
    this.fileSystemService
      .watchDirectory(dirPath, (fileChangeEvent) => {
        // Send event to renderer
        event.sender.send('fs:fileChanged', {
          watchId,
          event: fileChangeEvent,
        });
      })
      .then((disposer) => {
        // Store disposer
        this.watchers.set(watchId, disposer);
      })
      .catch((error) => {
        // Send error to renderer
        event.sender.send('fs:fileChanged', {
          watchId,
          error: {
            message: error.message,
            code: error.code || error.name,
            path: error.path,
          },
        });
      });
  }

  /**
   * Handler for fs:stopWatch event
   * Stops watching and cleans up watcher
   */
  private handleStopWatch(
    event: Electron.IpcMainEvent,
    payload: { watchId: string }
  ): void {
    const { watchId } = payload;

    const disposer = this.watchers.get(watchId);
    if (disposer) {
      disposer();
      this.watchers.delete(watchId);
    }
  }

  /**
   * Clean up all watchers
   * Should be called when app is closing
   */
  cleanup(): void {
    this.watchers.forEach((disposer) => disposer());
    this.watchers.clear();
  }
}
