/**
 * Application Constants
 *
 * Global constants shared between main and renderer processes
 */

import packageJson from '../../package.json';

export const APP_NAME = 'BMAD Studio';
export const APP_VERSION = packageJson.version;
export const IS_DEV = process.env.NODE_ENV === 'development';
export const IS_MAC = process.platform === 'darwin';

// Default window dimensions
export const DEFAULT_WINDOW_WIDTH = 1200;
export const DEFAULT_WINDOW_HEIGHT = 800;

// Vite dev server configuration
export const VITE_DEV_SERVER_URL = 'http://localhost:5173';
