import { projects } from "@/data/projects";
import { ProjectCard } from "@/components/ui/ProjectCard";

export function ProjectHighlights() {
  return (
    <section className="relative overflow-hidden px-6 py-28">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-20"
        style={{
          backgroundImage: "url('/images/brand/tda-bg-red.png')",
        }}
      />

      <div className="absolute inset-0 bg-black/70" />

      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="mb-12 max-w-3xl">
          <p className="text-xs uppercase tracking-[0.35em] text-red-400">
            Project Files
          </p>

          <h2 className="font-display mt-4 text-4xl font-bold uppercase text-stone-100 md:text-5xl">
            Worlds under pressure.
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </div>
    </section>
  );
}