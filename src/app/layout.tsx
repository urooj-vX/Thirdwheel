import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Third Wheel — Receipts, not vibes',
  description: 'A private relationship journal that separates what happened from what you inferred.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400..600;1,6..72,400..600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#FBF9F5] text-[#1C1B1A] antialiased min-h-screen selection:bg-[#C85A32]/15 selection:text-[#1C1B1A] font-sans">
        {children}
      </body>
    </html>
  );
}

