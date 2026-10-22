import type { Metadata } from "next";
import { Inter, Cinzel } from "next/font/google";
import { InteractionLayer } from "@/components/interaction/InteractionLayer";
import { SiteBackground } from "@/components/layout/SiteBackground";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-cinzel",
  display: "swap",
});

const siteTitle = "The Darkest Advance";
const siteDescription = "Mundos forjados en instinto, ruina y precisión.";

export const metadata: Metadata = {
  metadataBase: new URL("https://thedarkestadvance.com"),
  title: siteTitle,
  description: siteDescription,
  applicationName: siteTitle,
  creator: siteTitle,
  publisher: siteTitle,
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    siteName: siteTitle,
    title: siteTitle,
    description: siteDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
  },
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
