import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';
import { I18nProvider } from '@/context/i18n';
import { ThemeProvider } from 'next-themes';
import { UiPreferencesProvider } from '@/contexts/ui-preferences-context';

export const metadata: Metadata = {
  title: 'Budget3M',
  description: 'Smart personal finance management',
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <I18nProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <UiPreferencesProvider>
              {children}
              <Toaster />
            </UiPreferencesProvider>
          </ThemeProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
