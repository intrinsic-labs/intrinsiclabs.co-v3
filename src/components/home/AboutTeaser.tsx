import Link from "next/link";
import { aboutTeaser } from "@/content/home";

export function AboutTeaser() {
  return (
    <section id="about" className="border-t border-border-subtle">
      <div className="container-shell">
        <div className="section-divider" />
        <div className="mt-10 grid gap-8 lg:grid-cols-[2fr_1fr] lg:items-end">
          <div>
            <p className="section-label opacity-60 lg:opacity-100 text-xs lg:text-sm">
              ~/about
            </p>
            <p className="mt-5 max-w-3xl type-lg type-leading-snug lg:type-leading-normal text-cream">
              {aboutTeaser}
            </p>
          </div>
          <div className="lg:text-right">
            <Link
              href="/about"
              className="mono-label type-sm text-copper transition-colors hover:text-copper-deep"
            >
              MORE ABOUT ME →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
