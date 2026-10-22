import { Hero } from "@/components/home/Hero";
import { StudioIntro } from "@/components/home/StudioIntro";
import { CodexGateway } from "@/components/home/CodexGateway";

export default function HomePage() {
  return (
    <main>
      <Hero />
      <StudioIntro />
      <CodexGateway />
    </main>
  );
}
