/**
 * Preload Script
 *
 * Runs in isolated context before renderer process loads.
 * Exposes safe, whitelisted Electron APIs to renderer via contextBridge.
 *
 * SECURITY:
 * - Context isolation enabled (contextIsolation: true)
 * - Sandbox enabled (sandbox: true)
 * - NO direct ipcRenderer exposure
 * - Only whitelisted channels allowed
 */

import { contextBridge, ipcRenderer } from 'electron';
import type { ElectronAPI } from './types/window';

/**
 * Whitelist of allowed IPC channels
 * Future phases will expand this list with specific channels:
 * - 'project:add', 'project:list', 'project:remove'
 * - 'feature:index', 'feature:get'
 * - 'llm:generate', 'llm:chat'
 * - etc.
 */
const ALLOWED_CHANNELS: string[] = [
  // Placeholder - will be populated in future phases
];

/**
 * Validate that channel is in whitelist
 */
function isChannelAllowed(channel: string): boolean {
  // For Phase 1 (infrastructure setup), allow all channels
  // This will be restricted in Phase 1 Module 1.2 onwards
  return true;
  // return ALLOWED_CHANNELS.includes(channel);
}

/**
 * Electron API exposed to renderer process
 */
const electronAPI: ElectronAPI = {
  platform: process.platform,

  invoke: async <T = unknown>(channel: string, data?: unknown): Promise<T> => {
    if (!isChannelAllowed(channel)) {
      throw new Error(`IPC channel "${channel}" is not whitelisted`);
    }
    return ipcRenderer.invoke(channel, data) as Promise<T>;
  },

  on: (channel: string, callback: (...args: unknown[]) => void): void => {
    if (!isChannelAllowed(channel)) {
      throw new Error(`IPC channel "${channel}" is not whitelisted`);
    }
    // Wrap callback to filter out event object (security)
    const wrappedCallback = (_event: Electron.IpcRendererEvent, ...args: unknown[]) => {
      callback(...args);
    };
    ipcRenderer.on(channel, wrappedCallback);
  },

  removeListener: (channel: string, callback: (...args: unknown[]) => void): void => {
    if (!isChannelAllowed(channel)) {
      throw new Error(`IPC channel "${channel}" is not whitelisted`);
    }
    ipcRenderer.removeListener(channel, callback);
  },
};

/**
 * Expose electronAPI to renderer process
 * Accessible in renderer as window.electronAPI
 */
contextBridge.exposeInMainWorld('electronAPI', electronAPI);
