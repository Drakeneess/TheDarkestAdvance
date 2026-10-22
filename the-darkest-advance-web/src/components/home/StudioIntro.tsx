import { useTranslations } from "next-intl";

export function StudioIntro() {
  const t = useTranslations("home.studio");

  return (
    <section id="about" className="scroll-mt-28 px-6 py-28">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-red-400">
            {t("eyebrow")}
          </p>

          <h2 className="font-display mt-4 text-4xl font-bold uppercase text-stone-100 md:text-5xl">
            {t("title")}
          </h2>
        </div>

        <div className="dark-panel p-8 text-lg leading-8 text-stone-300">
          <p>{t("bodyPrimary")}</p>

          <p className="mt-6">{t("bodySecondary")}</p>
        </div>
      </div>
    </section>
  );
}
