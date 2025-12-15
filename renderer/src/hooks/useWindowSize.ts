import { useState, useEffect } from 'react';

export interface WindowSize {
  width: number;
  height: number;
}

/**
 * Hook para detectar tamaño de ventana con debounce
 */
export function useWindowSize(): WindowSize {
  const [windowSize, setWindowSize] = useState<WindowSize>({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    let timeoutId: number | undefined;

    const handleResize = () => {
      // Debounce de 300ms
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }

      timeoutId = window.setTimeout(() => {
        setWindowSize({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      }, 300);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return windowSize;
}
