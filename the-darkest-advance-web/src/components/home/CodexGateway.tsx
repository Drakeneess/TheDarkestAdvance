import Link from "next/link";

export function CodexGateway() {
  return (
    <section className="px-6 py-28">
      <div className="red-glow mx-auto max-w-7xl border border-red-900/50 bg-black/70 p-10 md:p-16">
        <p className="text-xs uppercase tracking-[0.35em] text-red-400">
          The Archive
        </p>

        <h2 className="font-display mt-4 text-4xl font-bold uppercase text-stone-100 md:text-6xl">
          Enter the Drakeneess Codex
        </h2>

        <p className="mt-6 max-w-3xl text-lg leading-8 text-stone-300">
          A living archive of worlds, characters, timelines, systems, creatures
          and unfinished beasts waiting to become something worse.
        </p>

        <Link
          href="/codex"
          className="mt-10 inline-block border border-red-500 bg-red-950/70 px-6 py-3 text-sm font-bold uppercase tracking-[0.22em] text-stone-100 transition hover:bg-red-800/80"
        >
          Open the Codex
        </Link>
      </div>
    </section>
  );
}