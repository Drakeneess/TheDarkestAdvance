export type ProjectStatus =
  | "In Development"
  | "Prototype"
  | "Concept"
  | "Archive"
  | "Coming Soon";

export type ProjectType =
  | "Game"
  | "Story"
  | "Codex"
  | "Experiment"
  | "Transmedia";

export type Project = {
  id: string;
  title: string;
  type: ProjectType;
  status: ProjectStatus;
  description: string;
  href: string;
};

export const projects: Project[] = [
  {
    id: "shadow-of-souls",
    title: "Shadow of Souls",
    type: "Game",
    status: "Prototype",
    description:
      "A symbolic action RPG experience built around emotional indicators, inner collapse and combat as psychological language.",
    href: "/projects/shadow-of-souls",
  },
  {
    id: "the-howl-of-freedom",
    title: "The Howl of Freedom",
    type: "Transmedia",
    status: "Concept",
    description:
      "A wolf’s fight for freedom, family and survival across cruel lands shaped by instinct, violence and loyalty.",
    href: "/projects/the-howl-of-freedom",
  },
  {
    id: "drakeneess-codex",
    title: "The Drakeneess Codex",
    type: "Codex",
    status: "In Development",
    description:
      "A living archive of stories, worlds, characters, systems and unfinished beasts waiting to become something worse.",
    href: "/codex",
  },
  {
    id: "steel-and-instinct",
    title: "Steel & Instinct",
    type: "Story",
    status: "Concept",
    description:
      "A tactical sports fiction project where instinct, strategy, failure and pressure collide inside a brutal competitive system.",
    href: "/projects/steel-and-instinct",
  },
];