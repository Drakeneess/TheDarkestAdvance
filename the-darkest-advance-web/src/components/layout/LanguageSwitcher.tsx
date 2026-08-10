"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useTransition } from "react";
import { routing } from "@/i18n/routing";

type Locale = (typeof routing.locales)[number];

const languageOptions: {
  locale: Locale;
  label: string;
  shortLabel: string;
}[] = [
  {
    locale: "es",
    label: "Español",
    shortLabel: "ES",
  },
  {
    locale: "en",
    label: "English",
    shortLabel: "EN",
  },
  {
    locale: "ru",
    label: "Русский",
    shortLabel: "RU",
  },
];

export function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleLocaleChange = (nextLocale: Locale) => {
    if (nextLocale === locale) return;

    startTransition(() => {
      router.replace(pathname, {
        locale: nextLocale,
      });
    });
  };

  return (
    <div
      className="flex items-center gap-1 rounded-full border border-red-950/60 bg-black/45 p-1 backdrop-blur-xl"
      aria-label="Language selector"
    >
      {languageOptions.map((option) => {
        const isActive = option.locale === locale;

        return (
          <button
            key={option.locale}
            type="button"
            disabled={isPending}
            onClick={() => handleLocaleChange(option.locale)}
            aria-label={`Change language to ${option.label}`}
            aria-pressed={isActive}
            className={[
              "rounded-full px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-[0.18em] transition",
              "disabled:cursor-wait disabled:opacity-60",
              isActive
                ? "bg-red-900/80 text-stone-100 shadow-[0_0_18px_rgba(176,0,0,0.28)]"
                : "text-stone-500 hover:bg-red-950/40 hover:text-red-300",
            ].join(" ")}
          >
            {option.shortLabel}
          </button>
        );
      })}
    </div>
  );
}