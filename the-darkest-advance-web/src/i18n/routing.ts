// src/i18n/routing.ts

import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["es", "en", "ru"],
  defaultLocale: "es",
  localePrefix: "as-needed",
});