import '@mantine/core/styles.css';
import { MantineProvider, ColorSchemeScript } from '@mantine/core';
import { AuthProvider } from '@/contexts/AuthContext';
import './global.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <ColorSchemeScript defaultColorScheme="auto" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        <meta name="robots" content="noindex, nofollow, noarchive" />
        <meta name="googlebot" content="noindex, nofollow" />
      </head>
      <body>
        <MantineProvider defaultColorScheme="auto">
          <AuthProvider>
            {children}
          </AuthProvider>
        </MantineProvider>
      </body>
    </html>
  );
}