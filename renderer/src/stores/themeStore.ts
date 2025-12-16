/**
 * Theme Store
 *
 * Manages application theme (light/dark/auto)
 * Persists theme preference to localStorage
 */

import { create } from 'zustand';

type Theme = 'light' | 'dark' | 'auto';

interface ThemeStore {
  theme: Theme;
  effectiveTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  initTheme: () => void;
}

const THEME_STORAGE_KEY = 'bmad-studio-theme';

export const useThemeStore = create<ThemeStore>((set, get) => ({
  theme: 'light',
  effectiveTheme: 'light',

  setTheme: (theme: Theme) => {
    // Save to localStorage
    localStorage.setItem(THEME_STORAGE_KEY, theme);

    // Determine effective theme
    let effectiveTheme: 'light' | 'dark' = 'light';

    if (theme === 'auto') {
      // Use system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      effectiveTheme = prefersDark ? 'dark' : 'light';
    } else {
      effectiveTheme = theme;
    }

    // Apply theme to document
    if (effectiveTheme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }

    set({ theme, effectiveTheme });
  },

  initTheme: () => {
    // Load from localStorage or default to 'auto'
    const savedTheme = (localStorage.getItem(THEME_STORAGE_KEY) as Theme) || 'auto';
    get().setTheme(savedTheme);

    // Listen for system theme changes when in auto mode
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      const currentTheme = get().theme;
      if (currentTheme === 'auto') {
        get().setTheme('auto'); // Re-apply to update effective theme
      }
    });
  },
}));
