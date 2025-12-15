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

import { app, BrowserWindow, dialog } from 'electron';
import * as path from 'path';
import {
  APP_NAME,
  IS_DEV,
  IS_MAC,
  DEFAULT_WINDOW_WIDTH,
  DEFAULT_WINDOW_HEIGHT,
  VITE_DEV_SERVER_URL,
} from '../shared/constants/app';
import { initializeDatabase, closeDatabase } from './database/index';

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
 * App ready - initialize database and create window
 */
app.whenReady().then(async () => {
  try {
    // Initialize database BEFORE creating window
    await initializeDatabase();
    console.log('✅ Database initialized successfully');

    // Now create the window
    createWindow();

    // macOS: Re-create window when dock icon clicked and no windows open
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);

    // Show error dialog to user
    dialog.showErrorBox(
      'Database Initialization Failed',
      `BMAD Studio failed to initialize the database.\n\n` +
        `Error: ${error instanceof Error ? error.message : String(error)}\n\n` +
        `The application will now quit.`
    );

    // Quit app - cannot run without database
    app.quit();
  }
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
 * App will quit - cleanup
 */
app.on('will-quit', () => {
  console.log('🔒 Closing database connection...');
  closeDatabase();
});

/**
 * Placeholder for future IPC handlers
 * Will be implemented in Phase 2+ modules
 *
 * Example:
 * ipcMain.handle('project:add', async (_event, projectPath: string) => {
 *   return projectService.addProject(projectPath);
 * });
 */
