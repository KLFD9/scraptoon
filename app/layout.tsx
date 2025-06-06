import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import HydrationFix from "./components/HydrationFix";

// Import diagnostics pour le mode développement
if (process.env.NODE_ENV === 'development') {
  import('./utils/hydration-diagnostics');
}

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Woons - Lecture de mangas en ligne",
  description: "Lisez vos mangas favoris gratuitement sur Woons. Accès rapide aux derniers chapitres et gestion de vos favoris.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" suppressHydrationWarning>      <body
        suppressHydrationWarning={true}
        className={`${geistSans.variable} ${geistMono.variable} font-sans`}
      >
        <HydrationFix />
        {children}
      </body>
    </html>
  )
}
