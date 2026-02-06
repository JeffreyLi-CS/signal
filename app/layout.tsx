import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'LockIn',
  description: 'LockIn MVP chat with shared links and images'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
