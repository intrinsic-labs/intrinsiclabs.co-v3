import { aboutTeaser } from "@/content/home";

export function AboutTeaser() {
  return (
    <section id="about" className="section-spacing">
      <div className="container-shell">
        <div className="section-divider" />
        <div className="mt-10 grid gap-8 md:grid-cols-[2fr_1fr] md:items-end">
          <div>
            <p className="section-label">About</p>
            <p className="mt-5 max-w-3xl type-lg type-leading-relaxed text-cream">
              {aboutTeaser}
            </p>
          </div>
          <div className="md:text-right">
            <span className="mono-label type-sm text-copper">
              MORE ABOUT ME →
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
