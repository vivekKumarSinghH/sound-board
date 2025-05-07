import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { AppLayout } from "@/components/app-layout";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SoundBoard - Collaborative Jam Session Recorder",
  description:
    "Create, record, and share audio loops with musicians around the world. Collaborate in real-time and export high-quality mixdowns.",
  keywords:
    "music collaboration, jam session, audio recording, loop recording, music production, collaborative music, online jamming",
  authors: [{ name: "SoundBoard Team" }],
  openGraph: {
    title: "SoundBoard - Collaborative Jam Session Recorder",
    description:
      "Create, record, and share audio loops with musicians around the world.",
    type: "website",
    siteName: "SoundBoard",
  },
  twitter: {
    card: "summary_large_image",
    title: "SoundBoard - Collaborative Jam Session Recorder",
    description:
      "Create, record, and share audio loops with musicians around the world.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <AppLayout>{children}</AppLayout>
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
