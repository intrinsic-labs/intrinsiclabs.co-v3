"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { FiArrowLeft, FiArrowRight } from "react-icons/fi";
import { getCaseStudyHref } from "@/content/case-studies/registry";
import type { HomeProject } from "@/content/home";
import { WireframeTree } from "./WireframeTree";
import { WireframeDogHead } from "./WireframeDogHead";
import { WireframeChurch } from "./WireframeChurch";
import { WireframeWifi } from "./WireframeWifi";

type RadialProjectCarouselProps = {
  projects: HomeProject[];
  className?: string;
};

type ArcLabel = {
  project: HomeProject;
  index: number;
  relative: number;
  x: number;
  y: number;
  rotation: number;
  opacity: number;
  isVisible: boolean;
  isFocused: boolean;
};

function signedDistance(from: number, to: number) {
  return to - from;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/* ── Shared sub-components ─────────────────────────────────────────── */

function ViewportScene({ scene }: { scene?: HomeProject["viewportScene"] }) {
  switch (scene) {
    case "wireframe-tree":
      return <WireframeTree />;
    case "wireframe-dog-head":
      return <WireframeDogHead />;
    case "wireframe-church":
      return <WireframeChurch />;
    case "wireframe-wifi":
      return <WireframeWifi />;
    default:
      return null;
  }
}

function NavButtons({
  canGoPrev,
  canGoNext,
  goPrev,
  goNext,
}: {
  canGoPrev: boolean;
  canGoNext: boolean;
  goPrev: () => void;
  goNext: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={goPrev}
        disabled={!canGoPrev}
        aria-label="Previous project"
        className="inline-flex h-10 lg:h-9 flex-1 items-center justify-center border border-border-visible text-cream transition-colors hover:border-copper hover:text-copper disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-border-visible disabled:hover:text-cream"
      >
        <FiArrowLeft className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={goNext}
        disabled={!canGoNext}
        aria-label="Next project"
        className="inline-flex h-10 lg:h-9 flex-1 items-center justify-center border border-border-visible text-cream transition-colors hover:border-copper hover:text-copper disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-border-visible disabled:hover:text-cream"
      >
        <FiArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

/** Renders an <h3> that shrinks its font-size until the text fits on one line. */
function FitHeading({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLHeadingElement>(null);

  const fit = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    // Reset to stylesheet size so we always start from the max
    el.style.fontSize = "";
    let size = parseFloat(getComputedStyle(el).fontSize);
    const min = 10;
    // Shrink until the text no longer overflows horizontally
    while (el.scrollWidth > el.clientWidth + 1 && size > min) {
      size -= 0.5;
      el.style.fontSize = `${size}px`;
    }
  }, []);

  // Fit after every render (children / layout may change)
  useLayoutEffect(() => {
    fit();
  }, [children, fit]);

  // Also re-fit on window resize
  useEffect(() => {
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [fit]);

  return (
    <h3
      ref={ref}
      className={className}
      style={{ whiteSpace: "nowrap", overflow: "hidden" }}
    >
      {children}
    </h3>
  );
}

function ProjectCard({
  project,
  statusColor,
}: {
  project: HomeProject;
  statusColor: string;
}) {
  return (
    <>
      <div className="hidden lg:flex items-center justify-between gap-4 border-b border-border-subtle pb-3">
        <span className="mono-label type-xs text-cream-muted">
          PROJECT_ID: {project.id}
        </span>
        <span className={`mono-label type-xs ${statusColor}`}>
          STATUS: {project.status.toUpperCase()}
        </span>
      </div>

      <div className="hidden lg:block lg:mt-4">
        <h3 className="font-mono font-bold type-2xl lg:type-3xl uppercase type-tracking-wider text-ink bg-cream-deep px-4">
          {project.name}
        </h3>
        <p className="lg:mt-1 type-sm text-blue-400">{project.subtitle}</p>
      </div>

      <p className="mt-2 lg:mt-4 type-sm type-leading-snug lg:type-leading-relaxed text-cream">
        {project.summary}
      </p>

      <ul className="mt-4 flex flex-wrap gap-2">
        {project.stack.map((stackItem) => (
          <li
            key={stackItem}
            className="mono-label px-2 py-1 type-2xs text-cream-deep border border-cream-deep font-bold"
          >
            {stackItem}
          </li>
        ))}
      </ul>

      <div className="mt-5">
        {project.caseStudySlug ? (
          <Link
            href={getCaseStudyHref(project.caseStudySlug)}
            className="mono-label type-xs text-copper transition-colors hover:text-copper-deep"
          >
            VIEW CASE STUDY →
          </Link>
        ) : (
          <span className="mono-label type-xs text-ink-dim">
            CASE STUDY IN PROGRESS
          </span>
        )}
      </div>
    </>
  );
}

/* ── Main component ────────────────────────────────────────────────── */

export function RadialProjectCarousel({
  projects,
  className,
}: RadialProjectCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // On mount, read URL hash (e.g. #project-aspen-grove) and jump to that project
  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (!hash.startsWith("project-")) return;
    const slug = hash.replace("project-", "");
    const idx = projects.findIndex(
      (p) => p.caseStudySlug === slug || p.id === slug,
    );
    if (idx >= 0) {
      setActiveIndex(idx);
      // Give the browser a frame to paint, then scroll the carousel into view
      requestAnimationFrame(() => {
        wrapperRef.current?.scrollIntoView({
          behavior: "smooth",
        });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const projectCount = projects.length;
  const activeProject = projects[activeIndex];
  const canGoPrev = activeIndex > 0;
  const canGoNext = activeIndex < projectCount - 1;

  const goPrev = () => setActiveIndex((prev) => Math.max(0, prev - 1));
  const goNext = () =>
    setActiveIndex((prev) => Math.min(projectCount - 1, prev + 1));

  const arcLabels = useMemo<ArcLabel[]>(() => {
    const radius = 475;
    const centerX = -355;
    const centerY = 0;
    const stepDeg = 12;
    const visibleRange = 7;

    return projects.map((project, index) => {
      const relative = signedDistance(activeIndex, index);
      const abs = Math.abs(relative);
      const thetaDeg = relative * stepDeg;
      const thetaRad = (thetaDeg * Math.PI) / 180;

      const x = centerX + radius * Math.cos(thetaRad);
      const y = centerY + radius * Math.sin(thetaRad);

      const rotation = clamp(thetaDeg * 0.9, -62, 62);

      return {
        project,
        index,
        relative,
        x,
        y,
        rotation,
        opacity: clamp(1 - abs * 0.16, 0.2, 1),
        isVisible: abs <= visibleRange,
        isFocused: abs < 0.001,
      };
    });
  }, [projects, activeIndex]);

  if (!projectCount || !activeProject) return null;

  const statusColor =
    activeProject.status === "Live" ? "text-blue-400" : "text-copper";

  return (
    <div
      ref={wrapperRef}
      id="projects"
      className={`relative ${className ?? ""}`}
      aria-label="Projects carousel"
    >
      {/* ═══════════════════════════════════════════════════════════════
          MOBILE LAYOUT  (< lg)
          Simple stacked card with scene + details + nav
       ═══════════════════════════════════════════════════════════════ */}
      <div className="container-shell block lg:hidden">
        {/* Wireframe scene — explicit min-h + key forces remount per project */}
        <p className="section-label text-xs italic opacity-65">~/projects</p>
        <div
          key={activeProject.id}
          className="relative w-full overflow-hidden rounded-sm mt-3"
          style={{ aspectRatio: "4 / 3", minHeight: "16rem" }}
        >
          <ViewportScene scene={activeProject.viewportScene} />
        </div>

        {/* Name + subtitle, stacked below scene */}
        <div className="flex flex-col items-center text-center px-4 mt-4">
          <FitHeading className="font-mono type-3xl uppercase type-tracking-wider text-cream type-leading-snug text-center w-full">
            {activeProject.name}
          </FitHeading>
          <p className="mt-1 type-sm text-blue-400 text-center">
            {activeProject.subtitle}
          </p>
        </div>

        {/* Project details card */}
        <article className="mt-6  text-cream">
          <ProjectCard project={activeProject} statusColor={statusColor} />

          <div className="mt-6 space-y-3">
            <NavButtons
              canGoPrev={canGoPrev}
              canGoNext={canGoNext}
              goPrev={goPrev}
              goNext={goNext}
            />
            <div className="text-center">
              <span className="mono-label type-2xs text-ink-dim">
                {activeIndex + 1}/{projectCount}
              </span>
            </div>
          </div>
        </article>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          DESKTOP LAYOUT  (lg+)
          Original radial arc on the left, project card on the right
       ═══════════════════════════════════════════════════════════════ */}
      <div className="container-shell relative z-10 hidden min-h-[min(78vh,54rem)] lg:grid lg:grid-cols-[minmax(0,58%)_minmax(0,42%)]">
        {/* LEFT: radial labels */}
        <div className="relative grid h-full grid-rows-[auto_minmax(0,1fr)] py-16">
          <header className="mb-8 max-w-2xl">
            <p className="section-label text-sm italic">~/projects</p>
          </header>

          <div className="relative h-full overflow-hidden">
            {/* Top & bottom vignette fade */}
            <div className="pointer-events-none absolute inset-x-0 top-0 z-40 h-28 bg-gradient-to-b from-dark-grey to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-40 h-28 bg-gradient-to-t from-dark-grey to-transparent" />

            {/* Guide circles clipped by viewport */}
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute left-[-34rem] top-1/2 h-[68rem] w-[68rem] -translate-y-1/2 rounded-full border border-cream" />
              <div className="absolute left-[-34rem] top-1/2 h-[67rem] w-[67rem] -translate-y-1/2 rounded-full border border-blue-400/25" />
              <div className="absolute left-[-34rem] top-1/2 h-[38rem] w-[38rem] -translate-y-1/2 rounded-full border border-cream/25" />
            </div>

            {/* Arc labels */}
            {arcLabels.map((item) => (
              <button
                key={item.project.id}
                type="button"
                onClick={() => setActiveIndex(item.index)}
                aria-label={`Focus project ${item.project.name}`}
                aria-current={item.isFocused}
                className="absolute left-0 top-1/2 bg-transparent text-left transition-all duration-500 ease-[cubic-bezier(.2,.75,.2,1)]"
                style={{
                  transform: `translate3d(${item.x}px, calc(-50% + ${item.y}px), 0)`,
                  opacity: item.isVisible ? item.opacity : 0,
                  zIndex: item.isFocused ? 30 : 20,
                  pointerEvents: item.isVisible ? "auto" : "none",
                }}
              >
                <div
                  className="origin-left transition-transform duration-500 ease-[cubic-bezier(.2,.75,.2,1)]"
                  style={{ transform: `rotate(${item.rotation}deg)` }}
                >
                  <div
                    className={[
                      "origin-left whitespace-nowrap border-l-6 pl-2 pr-2 py-1",
                      item.isFocused
                        ? "border-cream/70 text-cream"
                        : "border-transparent text-cream-muted",
                    ].join(" ")}
                  >
                    <span
                      className={`mono-label mr-2 ${item.isFocused ? "" : "type-2xs"} text-ink-dim`}
                    >
                      {item.project.id}
                    </span>
                    <span
                      className={`font-mono ${item.isFocused ? "type-lg font-bold" : "type-xs"} uppercase type-tracking-wider`}
                    >
                      {item.project.name}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT: viewport scene + focused project card */}
        <aside className="relative">
          <div className="absolute inset-8 grid grid-rows-[minmax(0,52%)_minmax(0,48%)] gap-4">
            <div className="relative rounded-sm overflow-hidden">
              <ViewportScene scene={activeProject.viewportScene} />
            </div>

            <article className="py-4 text-cream">
              <ProjectCard project={activeProject} statusColor={statusColor} />

              <div className="mt-5">
                <NavButtons
                  canGoPrev={canGoPrev}
                  canGoNext={canGoNext}
                  goPrev={goPrev}
                  goNext={goNext}
                />
              </div>
            </article>
          </div>
        </aside>
      </div>
    </div>
  );
}
