import type { Metadata } from "next";
import { Inter, Cinzel } from "next/font/google";
import { InteractionLayer } from "@/components/interaction/InteractionLayer";
import { SiteBackground } from "@/components/layout/SiteBackground";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-cinzel",
});

export const metadata: Metadata = {
  title: "The Darkest Advance",
  description: "Mundos forjados en instinto, ruina y precisión.",
};

type RootLayoutProps = {
  children: React.ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.variable} ${cinzel.variable}`}>
        <InteractionLayer />
        <SiteBackground />

        {children}
      </body>
    </html>
  );
}