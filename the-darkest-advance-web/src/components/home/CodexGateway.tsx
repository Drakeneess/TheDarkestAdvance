import { useTranslations } from "next-intl";

export function CodexGateway() {
  const t = useTranslations("home.codex");

  return (
    <section id="codex" className="scroll-mt-28 px-6 py-28">
      <div className="red-glow mx-auto max-w-7xl border border-red-900/50 bg-black/70 p-10 md:p-16">
        <p className="text-xs uppercase tracking-[0.35em] text-red-400">
          {t("eyebrow")}
        </p>

        <h2 className="font-display mt-4 text-4xl font-bold uppercase text-stone-100 md:text-6xl">
          {t("title")}
        </h2>

        <p className="mt-6 max-w-3xl text-lg leading-8 text-stone-300">
          {t("description")}
        </p>

        <p className="mt-10 inline-block border border-red-900/60 bg-red-950/30 px-6 py-3 text-xs font-bold uppercase tracking-[0.22em] text-red-200/80">
          {t("status")}
        </p>
      </div>
    </section>
  );
}
