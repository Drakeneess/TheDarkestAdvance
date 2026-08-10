import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function Hero() {
  const t = useTranslations("home.hero");

  return (
    <section className="tda-hero">
      <div className="tda-hero__veil" aria-hidden="true" />

      <div className="tda-hero__inner site-container">
        <div className="tda-hero__content parallax-soft">
          <div className="tda-hero__ornament" aria-hidden="true">
            <span />
            <span />
          </div>

          <p className="tda-hero__eyebrow">{t("style")}</p>

          <h1 className="tda-hero__title">{t("title")}</h1>

          <p className="tda-hero__tagline">{t("tagline")}</p>

          <div className="tda-hero__actions">
            <Link href="/codex" className="tda-button">
              {t("primaryCta")}
            </Link>

            <Link href="/projects" className="tda-button-secondary">
              {t("secondaryCta")}
            </Link>
          </div>
        </div>

        <aside className="tda-hero__signal parallax-mid">
          <div className="tda-hero__signal-frame" aria-hidden="true" />

          <p className="tda-hero__signal-label">{t("signal.label")}</p>

          <p className="tda-hero__signal-description">
            {t("signal.description")}
          </p>

          <div className="tda-hero__signal-meta" aria-hidden="true">
            <span>ARCHIVE ONLINE</span>
            <span>PROTOCOL: ACTIVE</span>
          </div>
        </aside>
      </div>
    </section>
  );
}