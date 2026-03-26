import { RadialProjectCarousel } from "@/components/home/RadialProjectCarousel";
import { getHomeProjects } from "@/content/case-studies/registry";

export function ProjectsSection() {
  const projects = getHomeProjects();

  return (
    <section
      id="projects"
      className="mt-6 lg:section-spacing relative isolate overflow-hidden pb-[clamp(5rem,8vw,9rem)]"
    >
      <div className="relative z-10">
        <RadialProjectCarousel projects={projects} />
      </div>
    </section>
  );
}
