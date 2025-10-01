import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';
import { I18nProvider } from '@/context/i18n';
import { ThemeProvider } from 'next-themes';
import { UiPreferencesProvider } from '@/contexts/ui-preferences-context';
import { AuthProvider } from '@/contexts/auth-context';
import { AuthErrorBoundaryClient } from '@/components/auth/auth-error-boundary-client';
import { ThemeInitializer } from '@/components/theme/theme-initializer';
import { StatusBarThemeUpdater } from '@/components/theme/status-bar-theme-updater';

export const metadata: Metadata = {
  title: 'Budget3M',
  description: 'Smart personal finance management',
  icons: {
    icon: '/icono.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        <meta name="theme-color" content="#000000" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="icon" href="/icono.png" type="image/png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap"
          rel="stylesheet"
        />
        {/* Headers de seguridad adicionales */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-Frame-Options" content="DENY" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
        <meta httpEquiv="Referrer-Policy" content="strict-origin-when-cross-origin" />
        <meta httpEquiv="Permissions-Policy" content="camera=(), microphone=(), geolocation=()" />
      </head>
      <body className="font-body antialiased">
        <ThemeInitializer />
        <AuthErrorBoundaryClient>
          <I18nProvider>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
              <StatusBarThemeUpdater />
              <UiPreferencesProvider>
                <AuthProvider>

                  {children}
                  <Toaster />
                </AuthProvider>
              </UiPreferencesProvider>
            </ThemeProvider>
          </I18nProvider>
        </AuthErrorBoundaryClient>
      </body>
    </html>
  );
}
