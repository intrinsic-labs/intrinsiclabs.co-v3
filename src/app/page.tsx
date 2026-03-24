import { AboutTeaser } from "@/components/home/AboutTeaser";
import { ContactStrip } from "@/components/home/ContactStrip";
import { HeroSection } from "@/components/home/HeroSection";
import { ProjectsSection } from "@/components/home/ProjectsSection";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <ProjectsSection />
      <AboutTeaser />
      <ContactStrip />
    </>
  );
}
