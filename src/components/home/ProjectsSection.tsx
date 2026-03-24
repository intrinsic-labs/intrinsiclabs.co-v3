import { ParallaxImage } from "@/components/home/ParallaxImage";
import { RadialProjectCarousel } from "@/components/home/RadialProjectCarousel";
import { homeProjects } from "@/content/home";

export function ProjectsSection() {
  return (
    <section
      id="projects"
      className="section-spacing relative isolate overflow-hidden pb-[clamp(5rem,8vw,9rem)]"
    >
      {/*<ParallaxImage
        src="/images/landscape03.png"
        speed={0.2}
        priority
        className="object-cover scale-[1.04]"
      />

      {/* Atmospheric dark veil */}
      {/*<div className="absolute inset-0 -z-10 bg-black/60" />*/}

      {/* Subtle radial glow + vignette for HUD feel */}
      {/*<div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_22%_48%,color-mix(in_srgb,var(--color-cream)_10%,transparent),transparent_58%)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_78%_50%,color-mix(in_srgb,var(--color-copper)_9%,transparent),transparent_62%)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--color-dark-grey)_15%,transparent)_0%,color-mix(in_srgb,var(--color-dark-grey)_58%,transparent)_42%,color-mix(in_srgb,var(--color-dark-grey)_88%,transparent)_100%)]" />*/}

      <div className="relative z-10">
        <RadialProjectCarousel projects={homeProjects} />
      </div>
    </section>
  );
}
