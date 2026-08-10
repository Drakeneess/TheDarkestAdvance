"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { OfficialSeal } from "@/components/brand/OfficialSeal";

const navItems = [
  { key: "projects", href: "/projects" },
  { key: "codex", href: "/codex" },
  { key: "about", href: "/about" },
] as const;

export function Navbar() {
  const t = useTranslations("navbar");
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMenuOpen(false);
  }, [pathname]);

  const getIsActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="tda-navbar">
      <nav
        className="site-container flex h-[var(--navbar-height)] items-center justify-between gap-6"
        aria-label="Main navigation"
      >
        <Link
          href="/"
          aria-label="The Darkest Advance Home"
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
          {navItems.map((item) => {
            const isActive = getIsActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={[
                  "relative text-xs font-bold uppercase tracking-[0.22em] transition",
                  "after:absolute after:-bottom-2 after:left-0 after:h-px after:w-full after:origin-center after:scale-x-0 after:bg-red-500 after:transition-transform",
                  isActive
                    ? "text-red-300 after:scale-x-100"
                    : "text-stone-400 hover:text-red-300 hover:after:scale-x-100",
                ].join(" ")}
              >
                {t(`items.${item.key}`)}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />

          <button
            type="button"
            className="tda-menu-button md:hidden"
            aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
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
            <p className="tda-mobile-nav__label">Navigation Protocol</p>

            <div className="tda-mobile-nav__links">
              {navItems.map((item) => {
                const isActive = getIsActive(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={[
                      "tda-mobile-nav__link",
                      isActive ? "tda-mobile-nav__link--active" : "",
                    ].join(" ")}
                  >
                    <span>{t(`items.${item.key}`)}</span>
                    <span aria-hidden="true">/</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}