/**
 * Type-safe wrapper for localStorage operations
 */

export function getItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (item === null) {
      return defaultValue;
    }
    return JSON.parse(item) as T;
  } catch (error) {
    console.warn(`Failed to parse localStorage item "${key}":`, error);
    return defaultValue;
  }
}

export function setItem<T>(key: string, value: T): void {
  try {
    const serialized = JSON.stringify(value);
    localStorage.setItem(key, serialized);
  } catch (error) {
    console.error(`Failed to save to localStorage "${key}":`, error);
  }
}

export function removeItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Failed to remove localStorage item "${key}":`, error);
  }
}
