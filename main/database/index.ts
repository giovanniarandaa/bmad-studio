/**
 * Database Module Index
 *
 * Central export point for all database-related functionality.
 */

export { DatabaseManager, getDatabaseManager, initializeDatabase, closeDatabase } from './DatabaseManager';
export { MigrationRunner } from './MigrationRunner';
export type { Migration } from './migrations/Migration';
