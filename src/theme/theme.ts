import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#2E8B57',
    primaryContainer: '#A7F3D0',
    secondary: '#6B7280',
    secondaryContainer: '#F3F4F6',
    surface: '#FFFFFF',
    surfaceVariant: '#F9FAFB',
    background: '#F0F0F0',
    error: '#DC2626',
    errorContainer: '#FEE2E2',
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onSurface: '#1F2937',
    onBackground: '#1F2937',
    outline: '#D1D5DB',
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#2E8B57',
    primaryContainer: '#1F4A3C',
    secondary: '#9CA3AF',
    secondaryContainer: '#374151',
    surface: '#1F2937',
    surfaceVariant: '#374151',
    background: '#111827',
    error: '#EF4444',
    errorContainer: '#7F1D1D',
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onSurface: '#F9FAFB',
    onBackground: '#F9FAFB',
    outline: '#6B7280',
  },
};

export const theme = lightTheme;