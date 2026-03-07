import type { Metadata } from 'next';
import { Commissioner, Outfit, Patrick_Hand } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import { ToastProvider } from '@/shared/components/Toast';
import '@/shared/styles/globals.css'; 

const commissioner = Commissioner({
  subsets: ['latin'],
  variable: '--font-commissioner',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

const patrickHand = Patrick_Hand({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-patrick-hand',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'DevRhythm',
  description: 'Track your coding journey',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${commissioner.variable} ${outfit.variable} ${patrickHand.variable}`}
      suppressHydrationWarning
    >
      <head>
        <link rel="icon" href="/images/logos/dr-icon-dark-logo.png" type="image/png" />
      </head>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ToastProvider position="top-center">
            {children}
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}