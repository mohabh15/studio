'use client';

import { useTheme } from 'next-themes';
import { useEffect } from 'react';

const ThemeColorSetter = () => {
  const { theme, systemTheme } = useTheme();

  useEffect(() => {
    const currentTheme = theme === 'system' ? systemTheme : theme;
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');

    if (metaThemeColor) {
      if (currentTheme === 'dark') {
        metaThemeColor.setAttribute('content', 'hsl(0 0% 9%)');
      } else {
        metaThemeColor.setAttribute('content', 'hsl(0 0% 100%)');
      }
    }
  }, [theme, systemTheme]);

  return null;
};

export default ThemeColorSetter;
