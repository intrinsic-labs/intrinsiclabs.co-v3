"use client";

import type { ComponentType } from "react";
import { WireframeTree } from "@/components/home/WireframeTree";
import { WireframeDogHead } from "@/components/home/WireframeDogHead";
import { WireframeChurch } from "@/components/home/WireframeChurch";
import { WireframeWifi } from "@/components/home/WireframeWifi";
import { WireframeBible } from "@/components/home/WireframeBible";
import type { ViewportSceneId } from "@/components/shared/sceneRegistry";

export type { ViewportSceneId } from "@/components/shared/sceneRegistry";

const viewportSceneComponentById: Record<ViewportSceneId, ComponentType> = {
  "wireframe-tree": WireframeTree,
  "wireframe-dog-head": WireframeDogHead,
  "wireframe-church": WireframeChurch,
  "wireframe-wifi": WireframeWifi,
  "wireframe-bible": WireframeBible,
};

export function ViewportScene({ scene }: { scene?: ViewportSceneId }) {
  if (!scene) return null;

  const SceneComponent = viewportSceneComponentById[scene];
  return SceneComponent ? <SceneComponent /> : null;
}
