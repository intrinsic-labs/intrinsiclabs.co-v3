export type ViewportSceneId =
  | "wireframe-tree"
  | "wireframe-dog-head"
  | "wireframe-church"
  | "wireframe-wifi";

/**
 * Maps a case-study slug to its corresponding wireframe scene.
 * Returns `undefined` for slugs that don't have a scene yet.
 *
 * This module is intentionally free of `"use client"` so it can be
 * imported from both server and client components.
 */
const slugToScene: Record<string, ViewportSceneId | undefined> = {
  "aspen-grove": "wireframe-tree",
  "dog-body-mind": "wireframe-dog-head",
  "church-ops": "wireframe-church",
};

export function getSceneForSlug(slug: string): ViewportSceneId | undefined {
  return slugToScene[slug];
}
