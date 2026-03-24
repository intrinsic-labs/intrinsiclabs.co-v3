import { aboutTeaser } from "@/content/home";

export function AboutTeaser() {
  return (
    <section id="about" className="border-t border-border-subtle">
      <div className="container-shell">
        <div className="section-divider" />
        <div className="mt-10 grid gap-8 md:grid-cols-[2fr_1fr] md:items-end">
          <div>
            <p className="section-label italic opacity-60 md:opacity-100 text-xs md:text-sm">~/About</p>
            <p className="mt-5 max-w-3xl type-lg type-leading-snug md:type-leading-normal text-cream">
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
