import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

const descriptions: Record<string, string> = {
  es: "Mundos forjados en instinto, ruina y precisión.",
  en: "Worlds forged in instinct, ruin and precision.",
  ru: "Миры, выкованные инстинктом, руиной и точностью.",
};

const languageAlternates = {
  es: "/",
  en: "/en",
  ru: "/ru",
  "x-default": "/",
};

type LocaleLayoutProps = {
  children: React.ReactNode;
  params: Promise<{
    locale: string;
  }>;
};

export async function generateMetadata({
  params,
}: Pick<LocaleLayoutProps, "params">): Promise<Metadata> {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    return {};
  }

  const description = descriptions[locale];
  const canonical = locale === routing.defaultLocale ? "/" : `/${locale}`;

  return {
    description,
    alternates: {
      canonical,
      languages: languageAlternates,
    },
    openGraph: {
      title: "The Darkest Advance",
      description,
      url: canonical,
      siteName: "The Darkest Advance",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "The Darkest Advance",
      description,
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  return (
    <NextIntlClientProvider>
      <div className="content-layer" lang={locale}>
        <Navbar />
        {children}
        <Footer />
      </div>
    </NextIntlClientProvider>
  );
}
