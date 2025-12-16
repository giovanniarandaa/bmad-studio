/**
 * FileWatcher
 *
 * Wrapper over chokidar with consistent configuration for BMAD Studio.
 * Provides debouncing and filtering of temporary files.
 */

import chokidar from 'chokidar';
import { debounce } from 'lodash';
import type { WatchOptions } from '../types/filesystem.types';

// Default ignored patterns
const DEFAULT_IGNORED_PATTERNS = [
  /\.swp$/,        // Vim swap files
  /\.tmp$/,        // Temporary files
  /^~/,            // Vim backup files
  /\.DS_Store$/,   // macOS metadata
];

// Default watch options
const DEFAULT_WATCH_OPTIONS: WatchOptions = {
  ignored: DEFAULT_IGNORED_PATTERNS,
  persistent: true,
  awaitWriteFinish: {
    stabilityThreshold: 300,  // 300ms
    pollInterval: 100,         // 100ms
  },
};

/**
 * Create configured chokidar watcher
 *
 * @param targetPath File or directory path to watch
 * @param options Watch options (merged with defaults)
 * @returns Configured chokidar watcher instance
 */
export function createWatcher(
  targetPath: string,
  options?: Partial<WatchOptions>
): chokidar.FSWatcher {
  const mergedOptions = {
    ...DEFAULT_WATCH_OPTIONS,
    ...options,
    ignored: [
      ...DEFAULT_WATCH_OPTIONS.ignored,
      ...(options?.ignored || []),
    ],
  };

  const watcher = chokidar.watch(targetPath, mergedOptions);

  return watcher;
}

/**
 * Create debounced callback function
 *
 * @param callback Function to debounce
 * @param delay Delay in milliseconds (default: 300ms)
 * @returns Debounced function
 */
export function createDebouncedCallback<T extends (...args: any[]) => void>(
  callback: T,
  delay: number = 300
): T & { cancel: () => void; flush: () => void } {
  return debounce(callback, delay) as any;
}
