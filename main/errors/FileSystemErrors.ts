/**
 * Base class for all filesystem-related errors in BMAD Studio
 */
export class FileSystemError extends Error {
  constructor(
    message: string,
    public readonly path: string,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'FileSystemError';
    Object.setPrototypeOf(this, FileSystemError.prototype);
  }
}

/**
 * Error thrown when a file or directory is not found
 * Maps to Node.js ENOENT error
 */
export class FileNotFoundError extends Error {
  public readonly code = 'ENOENT';

  constructor(public readonly path: string) {
    super(`File not found: ${path}`);
    this.name = 'FileNotFoundError';
    Object.setPrototypeOf(this, FileNotFoundError.prototype);
  }
}

/**
 * Error thrown when access to a file or directory is denied
 * Maps to Node.js EACCES error
 */
export class PermissionDeniedError extends Error {
  public readonly code = 'EACCES';

  constructor(public readonly path: string) {
    super(`Permission denied: ${path}`);
    this.name = 'PermissionDeniedError';
    Object.setPrototypeOf(this, PermissionDeniedError.prototype);
  }
}

/**
 * Error thrown when a file exceeds the maximum allowed size
 * Default limit: 1MB (1048576 bytes)
 */
export class FileTooLargeError extends Error {
  constructor(
    public readonly path: string,
    public readonly size: number,
    public readonly maxSize: number
  ) {
    super(
      `File too large: ${path} (${size} bytes exceeds maximum of ${maxSize} bytes)`
    );
    this.name = 'FileTooLargeError';
    Object.setPrototypeOf(this, FileTooLargeError.prototype);
  }
}

/**
 * Error thrown when disk is full and cannot write files
 * Maps to Node.js ENOSPC error
 */
export class DiskFullError extends Error {
  public readonly code = 'ENOSPC';

  constructor(public readonly path: string) {
    super(`Disk full - cannot write to: ${path}`);
    this.name = 'DiskFullError';
    Object.setPrototypeOf(this, DiskFullError.prototype);
  }
}

/**
 * Error thrown when a path is invalid or violates security constraints
 * Examples: path traversal (../) or path outside allowed directories
 */
export class InvalidPathError extends Error {
  constructor(
    public readonly path: string,
    public readonly reason: string
  ) {
    super(`Invalid path: ${path} - ${reason}`);
    this.name = 'InvalidPathError';
    Object.setPrototypeOf(this, InvalidPathError.prototype);
  }
}
