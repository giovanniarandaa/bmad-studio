import type { Stats } from 'fs';

/**
 * Type of file change event
 */
export type FileChangeType = 'add' | 'change' | 'unlink';

/**
 * Event emitted when a file or directory changes
 */
export interface FileChangeEvent {
  /** Type of change */
  type: FileChangeType;
  /** Absolute path to the changed file or directory */
  path: string;
  /** File stats (optional, may not be available for unlink events) */
  stats?: Stats;
}

/**
 * Callback function invoked when a file or directory changes
 */
export type FileChangeCallback = (event: FileChangeEvent) => void;

/**
 * Function to dispose/cleanup a file watcher
 */
export type Disposer = () => void;

/**
 * Options for file watching
 */
export interface WatchOptions {
  /** Regex patterns for files to ignore */
  ignored: RegExp[];
  /** Keep the process running while watchers are active */
  persistent: boolean;
  /** Wait for file write operations to finish before emitting events */
  awaitWriteFinish: {
    /** Time in ms for a file size to remain constant before emitting its event */
    stabilityThreshold: number;
    /** Interval in ms to check file size stability */
    pollInterval: number;
  };
}

/**
 * Options for reading files
 */
export interface ReadFileOptions {
  /** Character encoding (always utf-8 for BMAD Studio) */
  encoding: 'utf-8';
  /** Maximum file size in bytes (default: 1MB = 1048576 bytes) */
  maxSize?: number;
}

/**
 * Options for writing files
 */
export interface WriteFileOptions {
  /** Character encoding (always utf-8 for BMAD Studio) */
  encoding: 'utf-8';
  /** File mode (permissions) in octal notation (default: 0o644) */
  mode?: number;
}
