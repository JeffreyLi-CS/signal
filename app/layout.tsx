import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "LockIn",
  description: "MVP group chat with shared links and images"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
