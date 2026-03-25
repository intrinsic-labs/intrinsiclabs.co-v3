import Link from "next/link";
import type { ReactNode } from "react";
import { ViewportScene } from "@/components/shared/ViewportScene";
import { getSceneForSlug } from "@/components/shared/viewportSceneMap";

type CaseStudyLayoutProps = {
  projectName: string;
  subtitle: string;
  slug: string;
  children: ReactNode;
};

export function CaseStudyLayout({
  projectName,
  subtitle,
  slug,
  children,
}: CaseStudyLayoutProps) {
  const scene = getSceneForSlug(slug);

  return (
    <section className="section-spacing pb-[clamp(5rem,8vw,8rem)]">
      <div className="container-shell">
        <header className="pb-6">
          <p className="mono-label type-xs text-cream-muted text-center border border-cream-muted flex justify-center w-fit mx-auto px-3 py-1 opacity-65">
            Case Study
          </p>
          <h1 className="mt-3 font-mono type-4xl lg:type-5xl type-tracking-tight type-leading-snug py-2 lg:py-0 text-cream text-center font-bold">
            {projectName}
          </h1>
          <p className="lg:mt-3 type-sm text-blue-400 text-center">{subtitle}</p>

          <Link
            href={`/#project-${slug}`}
            className="mt-6 lg:mt-12 block text-center mono-label type-xs text-copper  transition-colors hover:text-cream"
          >
            ← Back To Projects
          </Link>
        </header>

        {/* Wireframe 3D scene */}
        {scene && (
          <div
            className="relative mx-auto lg:mt-10 max-w-5xl w-full overflow-hidden bg-cream-muted/10 rounded-4xl"
            style={{ aspectRatio: "16 / 9" }}
          >
            <ViewportScene scene={scene} />
          </div>
        )}

        <div className="mt-10">{children}</div>

        <div className="border-t border-border-subtle mt-16" />
        <Link
          href={`/#project-${slug}`}
          className="mt-12 block text-center mono-label type-xs text-copper transition-colors hover:text-cream"
        >
          ← Back To Projects
        </Link>
      </div>
    </section>
  );
}
