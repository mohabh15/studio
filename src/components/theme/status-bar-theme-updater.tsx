'use client';

import { useEffect } from 'react';
import { useTheme } from 'next-themes';

/**
 * Componente cliente-side que actualiza los meta tags para el color de la barra de estado
 * en dispositivos móviles según el tema actual
 */
export function StatusBarThemeUpdater() {
  const { theme, resolvedTheme } = useTheme();

  useEffect(() => {
    const currentTheme = resolvedTheme || theme;

    // Colores para la barra de estado usando variables del tema oscuro elegante
    const colors = {
      light: 'hsl(0, 0%, 96%)', // Fondo claro
      dark: 'hsl(220, 27%, 8%)', // Fondo oscuro elegante
    };

    const themeColor = currentTheme === 'dark' ? colors.dark : colors.light;
    const appleStatusBarStyle = currentTheme === 'dark' ? 'black-translucent' : 'default';

    // Actualizar meta theme-color para Android
    let themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (!themeColorMeta) {
      themeColorMeta = document.createElement('meta');
      themeColorMeta.setAttribute('name', 'theme-color');
      document.head.appendChild(themeColorMeta);
    }
    themeColorMeta.setAttribute('content', themeColor);

    // Actualizar meta para iOS
    let appleMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    if (!appleMeta) {
      appleMeta = document.createElement('meta');
      appleMeta.setAttribute('name', 'apple-mobile-web-app-status-bar-style');
      document.head.appendChild(appleMeta);
    }
    appleMeta.setAttribute('content', appleStatusBarStyle);

  }, [theme, resolvedTheme]);

  return null; // Este componente no renderiza nada
}