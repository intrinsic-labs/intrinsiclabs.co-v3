"use client";

import { WireframeTree } from "@/components/home/WireframeTree";
import { WireframeDogHead } from "@/components/home/WireframeDogHead";
import { WireframeChurch } from "@/components/home/WireframeChurch";
import { WireframeWifi } from "@/components/home/WireframeWifi";
import type { ViewportSceneId } from "@/components/shared/viewportSceneMap";

export type { ViewportSceneId };

export function ViewportScene({ scene }: { scene?: ViewportSceneId }) {
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
