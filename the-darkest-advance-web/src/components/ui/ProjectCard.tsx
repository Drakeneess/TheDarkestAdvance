import Link from "next/link";
import type { Project } from "@/data/projects";

type ProjectCardProps = {
  project: Project;
};

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link
      href={project.href}
      className="dark-panel group block p-6 transition duration-300 hover:-translate-y-1 hover:border-red-500/60"
    >
      <div className="mb-6 flex items-center justify-between gap-4 text-[0.65rem] uppercase tracking-[0.25em] text-red-400">
        <span>{project.type}</span>
        <span>{project.status}</span>
      </div>

      <h3 className="font-display text-2xl font-bold uppercase text-stone-100 transition group-hover:text-red-200">
        {project.title}
      </h3>

      <p className="mt-4 leading-7 text-stone-400">{project.description}</p>
    </Link>
  );
}