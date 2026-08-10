export function StudioIntro() {
  return (
    <section className="px-6 py-28">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-red-400">
            Studio Identity
          </p>

          <h2 className="font-display mt-4 text-4xl font-bold uppercase text-stone-100 md:text-5xl">
            Darkness with structure.
          </h2>
        </div>

        <div className="dark-panel p-8 text-lg leading-8 text-stone-300">
          <p>
            The Darkest Advance is an independent creative studio focused on
            games, speculative fiction, transmedia worlds and interactive
            systems.
          </p>

          <p className="mt-6">
            Each project grows from the same obsession: creatures, consequences,
            survival, freedom, transformation and the cost of advancing when
            everything around you insists on breaking.
          </p>
        </div>
      </div>
    </section>
  );
}