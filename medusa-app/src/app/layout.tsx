import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MEDUSA — AI Makeup Tutorials",
  description: "Upload your selfie. Choose a look. Get a step-by-step AI makeup tutorial built for your face.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="grain">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
