'use client';

import { useEffect } from 'react';
import { useSystemTheme } from '@/hooks/use-system-theme';

/**
 * Componente cliente-side que inicializa el tema del sistema
 * aplicando la clase 'dark' al <html> inmediatamente para evitar flashes
 */
export function ThemeInitializer() {
  const systemTheme = useSystemTheme();

  useEffect(() => {
    const html = document.documentElement;

    if (systemTheme === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }, [systemTheme]);

  return null; // Este componente no renderiza nada
}