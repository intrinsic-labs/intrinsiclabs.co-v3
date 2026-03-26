import { homeProjects, type ViewportSceneId } from "@/content/home";

/**
 * Maps a case-study slug to its corresponding wireframe scene.
 * Returns `undefined` for slugs that don't have a scene yet.
 *
 * This module is intentionally free of `"use client"` so it can be
 * imported from both server and client components.
 */
const slugToScene: Record<string, ViewportSceneId | undefined> =
  Object.fromEntries(
    homeProjects
      .filter(
        (
          p,
        ): p is typeof p & {
          caseStudySlug: string;
          viewportScene: ViewportSceneId;
        } => p.caseStudySlug != null && p.viewportScene != null,
      )
      .map((p) => [p.caseStudySlug, p.viewportScene]),
  );

export function getSceneForSlug(slug: string): ViewportSceneId | undefined {
  return slugToScene[slug];
}
