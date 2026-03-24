"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FiArrowLeft, FiArrowRight } from "react-icons/fi";
import type { HomeProject } from "@/content/home";
import { WireframeTree } from "./WireframeTree";
import { WireframeDogHead } from "./WireframeDogHead";
import { WireframeChurch } from "./WireframeChurch";

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

export function RadialProjectCarousel({
  projects,
  className,
}: RadialProjectCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const projectCount = projects.length;
  const activeProject = projects[activeIndex];
  const canGoPrev = activeIndex > 0;
  const canGoNext = activeIndex < projectCount - 1;

  const goPrev = () => setActiveIndex((prev) => Math.max(0, prev - 1));
  const goNext = () =>
    setActiveIndex((prev) => Math.min(projectCount - 1, prev + 1));

  const arcLabels = useMemo<ArcLabel[]>(() => {
    // Circle center is pushed offscreen-left so we only see the right half.
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

      // Rotate labels to follow the arc direction without becoming unreadable.
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
      className={`relative min-h-[min(78vh,54rem)] ${className ?? ""}`}
      aria-label="Projects radial carousel"
    >
      <div className="container-shell relative z-10 grid min-h-[min(78vh,54rem)] grid-cols-1 md:grid-cols-[minmax(0,58%)_minmax(0,42%)]">
        {/* LEFT: radial labels + separate focused card */}
        <div className="relative grid h-full grid-rows-[auto_minmax(0,1fr)] py-16">
          <header className="mb-8 max-w-2xl">
            <p className="section-label italic">~/Projects</p>
            {/*<h2 className="section-title mt-4">
              Selected work arranged as a rotating radial index.
            </h2>*/}
          </header>

          <div className="relative h-full overflow-hidden">
            {/* Top & bottom vignette fade */}
            <div className="pointer-events-none absolute inset-x-0 top-0 z-40 h-28 bg-gradient-to-b from-dark-grey to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-40 h-28 bg-gradient-to-t from-dark-grey to-transparent" />

            {/* guide circles clipped by viewport */}
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute left-[-34rem] top-1/2 h-[68rem] w-[68rem] -translate-y-1/2 rounded-full border border-cream" />
              <div className="absolute left-[-34rem] top-1/2 h-[67rem] w-[67rem] -translate-y-1/2 rounded-full border border-cream/25" />
              <div className="absolute left-[-34rem] top-1/2 h-[38rem] w-[38rem] -translate-y-1/2 rounded-full border border-cream/25" />
              {/*<div className="absolute left-[clamp(0.45rem,1.4vw,1.25rem)] top-10 bottom-10 w-px " />*/}
            </div>

            {/* Arc labels: compact + rotated, no full-card overlap */}
            {arcLabels.map((item) => {
              return (
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
              );
            })}
          </div>
        </div>

        {/* RIGHT: reserved viewport + focused project card */}
        <aside className="relative hidden md:block">
          <div className="absolute inset-8 grid grid-rows-[minmax(0,52%)_minmax(0,48%)] gap-4">
            <div className="relative rounded-sm overflow-hidden">
              {/*<div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,color-mix(in_srgb,var(--color-cream)_7%,transparent),transparent_68%)]" />*/}
              {/*<div className="absolute left-4 top-4 z-10 mono-label type-2xs text-ink-dim">
                OBJECT_VIEWPORT //{" "}
                {activeProject.viewportScene
                  ? activeProject.name.toUpperCase()
                  : "RESERVED"}
              </div>*/}
              {activeProject.viewportScene === "wireframe-tree" && (
                <WireframeTree />
              )}
              {activeProject.viewportScene === "wireframe-dog-head" && (
                <WireframeDogHead />
              )}
              {activeProject.viewportScene === "wireframe-church" && (
                <WireframeChurch />
              )}
            </div>

            <article className="border-r border-cream/25 pl-5 pr-3 py-4 text-cream">
              <div className="flex items-center justify-between gap-4 border-b border-border-subtle pb-3">
                <span className="mono-label type-xs text-cream-muted">
                  PROJECT_ID: {activeProject.id}
                </span>
                <span className={`mono-label type-xs ${statusColor}`}>
                  STATUS: {activeProject.status.toUpperCase()}
                </span>
              </div>

              <div className="mt-4">
                <h3 className="font-mono type-3xl uppercase type-tracking-wider text-cream">
                  {activeProject.name}
                </h3>
                <p className="mt-1 type-sm text-blue-400">
                  {activeProject.subtitle}
                </p>
              </div>

              <p className="mt-4 type-sm type-leading-relaxed text-cream">
                {activeProject.summary}
              </p>

              <ul className="mt-4 flex flex-wrap gap-2">
                {activeProject.stack.map((stackItem) => (
                  <li
                    key={stackItem}
                    className="mono-label bg-cream-deep px-2 py-1 type-2xs text-ink font-bold"
                  >
                    {stackItem}
                  </li>
                ))}
              </ul>

              <div className="mt-5">
                {activeProject.href ? (
                  <Link
                    href={activeProject.href}
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

              <div className="mt-5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={goPrev}
                  disabled={!canGoPrev}
                  aria-label="Previous project"
                  className="inline-flex h-9 w-12 items-center justify-center border border-border-visible text-cream transition-colors hover:border-copper hover:text-copper disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-border-visible disabled:hover:text-cream"
                >
                  <FiArrowLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  disabled={!canGoNext}
                  aria-label="Next project"
                  className="inline-flex h-9 w-12 items-center justify-center border border-border-visible text-cream transition-colors hover:border-copper hover:text-copper disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-border-visible disabled:hover:text-cream"
                >
                  <FiArrowRight className="h-4 w-4" />
                </button>
              </div>
            </article>
          </div>
        </aside>
      </div>
    </div>
  );
}
