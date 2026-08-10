"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

const NotFoundLogoCanvas = dynamic(() => import("./NotFoundLogoCanvas"), {
  ssr: false,
});

function localizedPath(locale: string, path: string) {
  if (locale === "es") return path;
  return `/${locale}${path === "/" ? "" : path}`;
}

export default function NotFoundClient() {
  const locale = useLocale();
  const t = useTranslations("notFound");

  return (
    <main className="tda-404">
      <div className="tda-404__grid" aria-hidden="true" />
      <div className="tda-404__sweep" aria-hidden="true" />

      <div className="tda-404__model parallax-strong" aria-hidden="true">
        <NotFoundLogoCanvas />
      </div>

      <div className="tda-404__inner site-container">
        <section
          className="tda-404__content parallax-soft"
          aria-labelledby="not-found-title"
        >
          <div className="tda-404__hud-frame" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </div>

          <div className="tda-404__coords" aria-hidden="true">
            <span>SECTOR: NULL</span>
            <span>ROUTE: /UNKNOWN</span>
            <span>ACCESS: DENIED</span>
          </div>

          <p className="tda-404__eyebrow">{t("eyebrow")}</p>

          <h1 id="not-found-title" className="tda-404__title">
            404
          </h1>

          <h2 className="tda-404__subtitle">{t("title")}</h2>

          <p className="tda-404__description">{t("description")}</p>

          <div className="tda-404__actions">
            <Link
              className="tda-button tda-button--primary"
              href={localizedPath(locale, "/")}
            >
              {t("home")}
            </Link>
          </div>
        </section>

        <aside className="tda-404__panel parallax-mid" aria-label={t("signal")}>
          <div className="tda-404__panel-header">
            <span className="tda-404__panel-dot" aria-hidden="true" />
            <span className="tda-404__panel-label">{t("signal")}</span>
          </div>

          <p>{t("log")}</p>

          <div className="tda-404__diagnostics" aria-hidden="true">
            <div>
              <span>INDEX</span>
              <strong>FAILED</strong>
            </div>
            <div>
              <span>TRACE</span>
              <strong>LOST</strong>
            </div>
            <div>
              <span>CODEX</span>
              <strong>SEALED</strong>
            </div>
          </div>

          <div className="tda-404__panel-footer" aria-hidden="true">
            <span>ROUTE_NULL</span>
            <span>INDEX_BROKEN</span>
          </div>
        </aside>
      </div>
    </main>
  );
}