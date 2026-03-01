import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DevRhythm',
  description: 'Track your coding journey',
};

export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <link rel="icon" href="/images/devrhythm-logo.png" type="image/png" />
      </head>
      <body>{children}</body>
    </html>
  );
}