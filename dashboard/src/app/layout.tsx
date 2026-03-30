import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Paperclip Dashboard",
  description: "Agent workspace dashboard for Paperclip",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
