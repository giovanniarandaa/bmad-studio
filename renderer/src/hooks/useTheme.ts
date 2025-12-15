import { useEffect } from 'react';
import { useAppStore } from '../stores/appStore';

/**
 * Hook para detectar tema del sistema, escuchar cambios y aplicar tema
 */
export function useTheme(): void {
  const theme = useAppStore((state) => state.theme);
  const setEffectiveTheme = useAppStore((state) => state.setEffectiveTheme);

  // Detectar tema del sistema
  useEffect(() => {
    const detectSystemTheme = (): 'light' | 'dark' => {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    };

    // Aplicar tema inicial
    if (theme === 'auto') {
      setEffectiveTheme(detectSystemTheme());
    } else {
      setEffectiveTheme(theme);
    }

    // Listener para cambios en prefers-color-scheme
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (theme === 'auto') {
        setEffectiveTheme(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [theme, setEffectiveTheme]);
}
