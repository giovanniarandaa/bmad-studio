/**
 * ThemeSwitcher Component
 *
 * Allows users to switch between light, dark, and auto themes
 */

import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useThemeStore } from '../../stores/themeStore';
import './ThemeSwitcher.css';

export function ThemeSwitcher() {
  const { theme, setTheme } = useThemeStore();

  const themes = [
    { value: 'light' as const, icon: Sun, label: 'Light' },
    { value: 'dark' as const, icon: Moon, label: 'Dark' },
    { value: 'auto' as const, icon: Monitor, label: 'Auto' },
  ];

  return (
    <div className="theme-switcher">
      {themes.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          className={`theme-switcher__button ${theme === value ? 'theme-switcher__button--active' : ''}`}
          onClick={() => setTheme(value)}
          title={label}
          aria-label={`Switch to ${label} theme`}
        >
          <Icon size={16} />
        </button>
      ))}
    </div>
  );
}
