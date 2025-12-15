/**
 * Main Process Entry Point
 *
 * Manages Electron app lifecycle, window creation, and IPC handlers.
 *
 * SECURITY:
 * - Context isolation enabled
 * - Sandbox enabled
 * - nodeIntegration disabled
 * - Preload script for safe IPC bridge
 */

import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import {
  APP_NAME,
  IS_DEV,
  IS_MAC,
  DEFAULT_WINDOW_WIDTH,
  DEFAULT_WINDOW_HEIGHT,
  VITE_DEV_SERVER_URL,
} from '../shared/constants/app';

let mainWindow: BrowserWindow | null = null;

/**
 * Create main application window
 */
function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: DEFAULT_WINDOW_WIDTH,
    height: DEFAULT_WINDOW_HEIGHT,
    title: APP_NAME,
    webPreferences: {
      // Security-first configuration
      contextIsolation: true,  // ✅ REQUIRED: Isolate context
      sandbox: true,           // ✅ REQUIRED: Enable sandbox
      nodeIntegration: false,  // ✅ REQUIRED: Disable node in renderer
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // Load app content
  if (IS_DEV) {
    // Development: Load from Vite dev server
    mainWindow.loadURL(VITE_DEV_SERVER_URL);

    // Auto-open DevTools in development (RN-002)
    mainWindow.webContents.openDevTools();
  } else {
    // Production: Load from built files
    // __dirname is dist/main/main/, so we need to go up to dist/ then into renderer/
    mainWindow.loadFile(path.join(__dirname, '../../renderer/index.html'));
  }

  // Clean up reference on close
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

/**
 * App ready - create window
 */
app.whenReady().then(() => {
  createWindow();

  // macOS: Re-create window when dock icon clicked and no windows open
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

/**
 * All windows closed - quit app (except macOS)
 */
app.on('window-all-closed', () => {
  if (!IS_MAC) {
    app.quit();
  }
});

/**
 * Placeholder for future IPC handlers
 * Will be implemented in Phase 1 Module 1.2 (SQLite) and beyond
 *
 * Example:
 * ipcMain.handle('project:add', async (_event, projectPath: string) => {
 *   return projectService.addProject(projectPath);
 * });
 */
