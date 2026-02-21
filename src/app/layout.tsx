import * as React from "react"
import type { Metadata } from "next";
// Font imports removed to fix build timeout
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";


export const metadata: Metadata = {
  title: "RynAI Chat",
  description: "Your simple and powerful AI assistant.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased overflow-hidden">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
