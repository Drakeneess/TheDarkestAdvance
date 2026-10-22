"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { OfficialSeal } from "@/components/brand/OfficialSeal";

const navItems = [
  { key: "codex", href: "/#codex" },
  { key: "about", href: "/#about" },
] as const;

export function Navbar() {
  const t = useTranslations("navbar");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="tda-navbar">
      <nav
        className="site-container flex h-[var(--navbar-height)] items-center justify-between gap-6"
        aria-label={t("mainLabel")}
      >
        <Link
          href="/"
          aria-label={t("homeLabel")}
          className="group flex items-center gap-3"
        >
          <OfficialSeal className="tda-seal" />

          <span className="hidden flex-col leading-none sm:flex">
            <span className="font-display text-sm font-bold uppercase tracking-[0.28em] text-stone-100 transition group-hover:text-red-200">
              The Darkest
            </span>

            <span className="font-display mt-1 text-[0.65rem] font-bold uppercase tracking-[0.42em] text-red-500/80 transition group-hover:text-red-300">
              Advance
            </span>
          </span>
        </Link>

        <div className="hidden items-center gap-7 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="relative text-xs font-bold uppercase tracking-[0.22em] text-stone-400 transition after:absolute after:-bottom-2 after:left-0 after:h-px after:w-full after:origin-center after:scale-x-0 after:bg-red-500 after:transition-transform hover:text-red-300 hover:after:scale-x-100"
            >
              {t(`items.${item.key}`)}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />

          <button
            type="button"
            className="tda-menu-button md:hidden"
            aria-label={
              isMenuOpen ? t("closeMenuLabel") : t("openMenuLabel")
            }
            aria-expanded={isMenuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setIsMenuOpen((current) => !current)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </nav>

      <div
        id="mobile-navigation"
        className={[
          "tda-mobile-nav md:hidden",
          isMenuOpen ? "tda-mobile-nav--open" : "",
        ].join(" ")}
      >
        <div className="site-container">
          <div className="tda-mobile-nav__panel">
            <p className="tda-mobile-nav__label">{t("mobileLabel")}</p>

            <div className="tda-mobile-nav__links">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="tda-mobile-nav__link"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span>{t(`items.${item.key}`)}</span>
                  <span aria-hidden="true">/</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
