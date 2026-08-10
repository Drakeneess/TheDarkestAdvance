import { Hero } from "@/components/home/Hero";
import { StudioIntro } from "@/components/home/StudioIntro";
import { ProjectHighlights } from "@/components/home/ProjectHighlights";
import { CodexGateway } from "@/components/home/CodexGateway";

export default function HomePage() {
  return (
    <main>
      <Hero />
      <StudioIntro />
      <ProjectHighlights />
      <CodexGateway />
    </main>
  );
}