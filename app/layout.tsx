import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from 'sonner'
import CookieConsent from '@/components/layout/CookieConsent'

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: "#0ea5e9",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://www.byoi.it"),
  title: {
    default: "BYOI | Build Your Own Intelligence",
    template: "%s | BYOI"
  },
  description: "Build Your Own Intelligence — the AI-powered operating system for founders. Manage projects, finances, and team collaboration with AI chat rooms.",
  keywords: ["AI operating system", "founder dashboard", "startup tools", "AI chat rooms", "project management"],
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico" },
    ],
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.byoi.it",
    title: "BYOI | Build Your Own Intelligence",
    description: "The AI-powered operating system for founders.",
    siteName: "BYOI",
  },
  twitter: {
    card: "summary_large_image",
    title: "BYOI | Build Your Own Intelligence",
    description: "The AI-powered operating system for founders.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={cn(inter.className, "bg-secondary text-foreground antialiased min-h-screen")}>
        {children}
        <Toaster position="bottom-right" theme="light" richColors closeButton />
        <CookieConsent />
      </body>
    </html>
  );
}
