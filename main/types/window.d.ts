/**
 * Window Global Type Extensions
 *
 * Extends the Window interface to include the Electron API
 * exposed via contextBridge in preload.ts
 */

/**
 * Electron API interface exposed to renderer process
 */
export interface ElectronAPI {
  /**
   * Current platform (darwin, win32, linux)
   */
  platform: string;

  /**
   * Invoke IPC handler with type-safe return
   * @param channel - IPC channel name (e.g., 'project:add')
   * @param data - Optional payload data
   * @returns Promise with typed response
   */
  invoke<T = unknown>(channel: string, data?: unknown): Promise<T>;

  /**
   * Listen to IPC events from main process
   * @param channel - IPC channel name
   * @param callback - Event callback function
   */
  on(channel: string, callback: (...args: unknown[]) => void): void;

  /**
   * Remove IPC event listener
   * @param channel - IPC channel name
   * @param callback - Callback to remove
   */
  removeListener(channel: string, callback: (...args: unknown[]) => void): void;
}

/**
 * Extend global Window interface
 */
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
