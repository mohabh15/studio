'use client';

import { useState, useEffect } from 'react';

type SystemTheme = 'light' | 'dark';

/**
 * Hook personalizado que detecta la preferencia de tema del sistema
 * usando la media query `prefers-color-scheme`
 */
export function useSystemTheme(): SystemTheme {
  const [systemTheme, setSystemTheme] = useState<SystemTheme>('light');

  useEffect(() => {
    // Función para obtener el tema actual del sistema
    const getSystemTheme = (): SystemTheme => {
      if (typeof window !== 'undefined') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light';
      }
      return 'light';
    };

    // Función para actualizar el estado cuando cambie el tema del sistema
    const updateSystemTheme = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    // Establecer el tema inicial
    setSystemTheme(getSystemTheme());

    // Crear el media query listener
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    // Agregar el listener para cambios en el tema del sistema
    mediaQuery.addEventListener('change', updateSystemTheme);

    // Cleanup: remover el listener cuando el componente se desmonte
    return () => {
      mediaQuery.removeEventListener('change', updateSystemTheme);
    };
  }, []);

  return systemTheme;
}