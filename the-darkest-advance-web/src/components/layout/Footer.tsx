import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { OfficialSeal } from "@/components/brand/OfficialSeal";

const footerLinks = [
  { key: "projects", href: "/projects" },
  { key: "codex", href: "/codex" },
  { key: "about", href: "/about" },
] as const;

export function Footer() {
  const t = useTranslations("footer");
  const navT = useTranslations("navbar.items");
  const currentYear = new Date().getFullYear();

  return (
    <footer className="tda-footer">
      <div className="site-container">
        <div className="tda-footer-grid">
          <div className="tda-footer-brand">
            <OfficialSeal className="tda-footer-seal" />

            <div>
              <p className="tda-footer-title">The Darkest Advance</p>
              <p className="tda-footer-subtitle">{t("subtitle")}</p>
            </div>
          </div>

          <div className="tda-footer-status">
            <span className="tda-footer-status-dot" />
            <span>{t("status")}</span>
          </div>

          <nav className="tda-footer-nav" aria-label={t("navigationLabel")}>
            {footerLinks.map((item) => (
              <Link key={item.href} href={item.href}>
                {navT(item.key)}
              </Link>
            ))}
          </nav>
        </div>

        <div className="tda-footer-line" />

        <div className="tda-footer-meta">
          <p>
            <span>{t("meta.studio.label")}</span>
            <strong>Drakeneess</strong>
          </p>

          <p>
            <span>{t("meta.protocol.label")}</span>
            <strong>{t("meta.protocol.value")}</strong>
          </p>

          <p>
            <span>{t("meta.archive.label")}</span>
            <strong>The Drakeneess Codex</strong>
          </p>

          <p>
            <span>{t("meta.year.label")}</span>
            <strong>{currentYear}</strong>
          </p>
        </div>
      </div>
    </footer>
  );
}