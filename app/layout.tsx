import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { FavoritesProvider } from "./hooks/useFavorites";

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
  viewport: "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <style dangerouslySetInnerHTML={{
          __html: `
            /* Mobile scroll optimizations */
            body {
              scroll-behavior: smooth;
              overscroll-behavior: none;
              -webkit-overflow-scrolling: touch;
            }
            
            /* Hardware acceleration for better performance */
            * {
              -webkit-transform: translateZ(0);
              transform: translateZ(0);
            }
            
            /* Prevent bounce scrolling on iOS */
            .scroll-container {
              overscroll-behavior-y: contain;
              will-change: transform;
            }
            
            /* Image rendering optimization */
            img {
              image-rendering: -webkit-optimize-contrast;
              image-rendering: optimize-contrast;
            }
            
            /* Reduce hover effects on touch devices */
            @media (hover: none) and (pointer: coarse) {
              .group:hover * {
                transition-duration: 0s !important;
              }
            }
          `
        }} />
      </head>
      <body
        suppressHydrationWarning={true}
        className={`${geistSans.variable} ${geistMono.variable} font-sans scroll-container`}
      >
        <FavoritesProvider>
          {children}
        </FavoritesProvider>
      </body>
    </html>
  )
}
