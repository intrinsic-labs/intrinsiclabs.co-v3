export const viewportSceneIds = [
  "wireframe-tree",
  "wireframe-dog-head",
  "wireframe-church",
  "wireframe-wifi",
] as const;

export type ViewportSceneId = (typeof viewportSceneIds)[number];

const viewportSceneIdSet = new Set<string>(viewportSceneIds);

export function isViewportSceneId(value: unknown): value is ViewportSceneId {
  return typeof value === "string" && viewportSceneIdSet.has(value);
}
