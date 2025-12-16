/**
 * Project-specific errors for BMAD Studio
 */

/**
 * Error thrown when a project with the same path already exists
 */
export class ProjectAlreadyExistsError extends Error {
  public readonly code = 'PROJECT_ALREADY_EXISTS';

  constructor(public readonly path: string) {
    super(`El proyecto ya existe: ${path}`);
    this.name = 'ProjectAlreadyExistsError';
    Object.setPrototypeOf(this, ProjectAlreadyExistsError.prototype);
  }
}

/**
 * Error thrown when JSON parsing fails (package.json, composer.json)
 */
export class InvalidJSONError extends Error {
  public readonly code = 'INVALID_JSON';

  constructor(
    public readonly filePath: string,
    public readonly originalError?: Error
  ) {
    super(`JSON inválido en archivo: ${filePath}`);
    this.name = 'InvalidJSONError';
    Object.setPrototypeOf(this, InvalidJSONError.prototype);
  }
}

/**
 * Error thrown when a project is not found by ID
 */
export class ProjectNotFoundError extends Error {
  public readonly code = 'PROJECT_NOT_FOUND';

  constructor(public readonly projectId: number) {
    super(`Proyecto no encontrado: ${projectId}`);
    this.name = 'ProjectNotFoundError';
    Object.setPrototypeOf(this, ProjectNotFoundError.prototype);
  }
}
