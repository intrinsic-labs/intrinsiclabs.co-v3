import { RadialProjectCarousel } from "@/components/home/RadialProjectCarousel";
import { homeProjects } from "@/content/home";

export function ProjectsSection() {
  return (
    <section
      id="projects"
      className="mt-6 md:section-spacing relative isolate overflow-hidden pb-[clamp(5rem,8vw,9rem)]"
    >
      <div className="relative z-10">
        <RadialProjectCarousel projects={homeProjects} />
      </div>
    </section>
  );
}
