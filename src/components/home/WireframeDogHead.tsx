"use client";

import { useEffect, useRef, useState } from "react";

type ThreeModule = typeof import("three");

/**
 * Procedurally builds a low-poly wireframe German Shepherd head using raw
 * Three.js BufferGeometry and rotates it slowly on the Y-axis.
 *
 * Vertex layout (world-space, Y-up, facing -Z):
 *
 *  SNOUT / MUZZLE
 *  0  nose tip
 *  1  snout top-centre
 *  2  snout top-left
 *  3  snout top-right
 *  4  snout bot-left
 *  5  snout bot-right
 *  6  snout bot-centre
 *
 *  LOWER JAW
 *  7  jaw tip
 *  8  jaw bot-left
 *  9  jaw bot-right
 * 10  jaw corner-left
 * 11  jaw corner-right
 *
 *  MID-FACE / CHEEKS
 * 12  brow centre
 * 13  brow left
 * 14  brow right
 * 15  cheek left
 * 16  cheek right
 * 17  chin left
 * 18  chin right
 *
 *  SKULL
 * 19  crown
 * 20  skull-left
 * 21  skull-right
 * 22  occiput (back-top)
 * 23  nape-left
 * 24  nape-right
 *
 *  NECK / CHEST
 * 25  neck-front
 * 26  neck-left
 * 27  neck-right
 * 28  neck-back
 *
 *  EARS (left)
 * 29  ear-base-outer-left
 * 30  ear-base-inner-left
 * 31  ear-mid-left
 * 32  ear-tip-left
 *
 *  EARS (right)
 * 33  ear-base-outer-right
 * 34  ear-base-inner-right
 * 35  ear-mid-right
 * 36  ear-tip-right
 */

// prettier-ignore
const VERTS = new Float32Array([
  // 0  nose tip
   0.00,  0.10, -1.55,
  // 1  snout top-centre
   0.00,  0.30, -1.10,
  // 2  snout top-left
  -0.18,  0.24, -0.95,
  // 3  snout top-right
   0.18,  0.24, -0.95,
  // 4  snout bot-left
  -0.16,  0.02, -1.05,
  // 5  snout bot-right
   0.16,  0.02, -1.05,
  // 6  snout bot-centre
   0.00,  0.00, -1.30,

  // 7  jaw tip
   0.00, -0.12, -1.40,
  // 8  jaw bot-left
  -0.14, -0.16, -1.00,
  // 9  jaw bot-right
   0.14, -0.16, -1.00,
  // 10 jaw corner-left
  -0.28, -0.10, -0.50,
  // 11 jaw corner-right
   0.28, -0.10, -0.50,

  // 12 brow centre
   0.00,  0.58, -0.70,
  // 13 brow left
  -0.30,  0.52, -0.55,
  // 14 brow right
   0.30,  0.52, -0.55,
  // 15 cheek left
  -0.48,  0.18, -0.30,
  // 16 cheek right
   0.48,  0.18, -0.30,
  // 17 chin left
  -0.30, -0.22, -0.20,
  // 18 chin right
   0.30, -0.22, -0.20,

  // 19 crown
   0.00,  0.82,  0.10,
  // 20 skull left
  -0.44,  0.62,  0.20,
  // 21 skull right
   0.44,  0.62,  0.20,
  // 22 occiput
   0.00,  0.55,  0.70,
  // 23 nape left
  -0.36,  0.28,  0.75,
  // 24 nape right
   0.36,  0.28,  0.75,

  // 25 neck front
   0.00, -0.05,  0.30,
  // 26 neck left
  -0.38, -0.02,  0.55,
  // 27 neck right
   0.38, -0.02,  0.55,
  // 28 neck back
   0.00, -0.10,  0.90,

  // 29 ear base outer left
  -0.38,  0.65, -0.05,
  // 30 ear base inner left
  -0.18,  0.68,  0.00,
  // 31 ear mid left
  -0.30,  0.95,  0.00,
  // 32 ear tip left
  -0.24,  1.22, -0.08,

  // 33 ear base outer right
   0.38,  0.65, -0.05,
  // 34 ear base inner right
   0.18,  0.68,  0.00,
  // 35 ear mid right
   0.30,  0.95,  0.00,
  // 36 ear tip right
   0.24,  1.22, -0.08,
]);

// prettier-ignore
const INDICES = [
  // ── SNOUT TOP ───────────────────────────────
  0, 1, 2,
  0, 3, 1,
  1, 3, 14,
  1, 14, 12,
  1, 12, 13,
  1, 13, 2,
  2, 13, 15,
  3, 16, 14,

  // ── SNOUT UNDERSIDE ─────────────────────────
  0, 6, 4,
  0, 5, 6,
  4, 6, 8,
  5, 9, 6,
  6, 9, 8,
  0, 4, 7,
  0, 7, 5,
  7, 8, 10,
  7, 11, 9,
  // chin-seam bridges: connect jaw-tip (7) ↔ snout-bot-ctr (6)
  4, 7, 6,
  5, 6, 7,

  // ── SNOUT SIDES ──────────────────────────────
  2, 4, 15,
  4, 10, 15,
  3, 16, 5,
  5, 16, 11,
  // lateral nose-tip caps: close left and right side of snout tip
  0, 2, 4,
  0, 3, 5,

  // ── LOWER JAW ────────────────────────────────
  // (7,10,8) and (7,9,11) removed — exact duplicates of faces above
  10, 17, 15,
  11, 16, 18,
  10, 11, 17,
  11, 18, 17,

  // ── FACE / BROW ──────────────────────────────
  12, 14, 19,
  12, 19, 13,
  13, 19, 20,
  14, 21, 19,
  13, 20, 15,
  14, 16, 21,

  // ── CHEEKS / SIDES ───────────────────────────
  15, 20, 26,
  15, 26, 25,
  15, 25, 17,
  16, 27, 21,
  16, 18, 27,
  17, 25, 18,
  18, 25, 27,

  // ── SKULL TOP ────────────────────────────────
  19, 21, 22,
  19, 22, 20,
  20, 22, 23,
  21, 24, 22,

  // ── SKULL SIDES / NAPE ───────────────────────
  20, 26, 23,
  21, 24, 27,
  23, 26, 28,
  24, 28, 27,
  22, 24, 23,
  23, 28, 26,
  24, 27, 28,

  // ── LEFT EAR ────────────────────────────────
  29, 30, 31,
  30, 32, 31,
  29, 31, 32,
  20, 29, 30,
  19, 30, 29,

  // ── RIGHT EAR ────────────────────────────────
  33, 35, 34,
  34, 35, 36,
  33, 36, 35,
  21, 34, 33,
  19, 33, 34,
];

export function WireframeDogHead() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasWebGL, setHasWebGL] = useState<boolean | null>(null);

  useEffect(() => {
    const c = document.createElement("canvas");
    const ctx =
      c.getContext("webgl2") ||
      c.getContext("webgl") ||
      c.getContext("experimental-webgl");
    setHasWebGL(Boolean(ctx));
  }, []);

  useEffect(() => {
    if (hasWebGL !== true || !containerRef.current) return;
    const root = containerRef.current;

    let cancelled = false;
    let frameId = 0;
    let viewportActive = true;
    const disposables: { dispose(): void }[] = [];

    const initScene = async () => {
      const THREE: ThreeModule = await import("three");
      if (cancelled) return;

      const track = <T extends { dispose(): void }>(r: T): T => {
        disposables.push(r);
        return r;
      };

      /* ── renderer ──────────────────────────────────────── */
      const scene = new THREE.Scene();

      const camera = new THREE.PerspectiveCamera(
        38,
        root.clientWidth / root.clientHeight,
        0.1,
        100,
      );
      camera.position.set(0, 0.18, 4.2);
      camera.lookAt(0, 0.22, 0);

      const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "low-power",
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(root.clientWidth, root.clientHeight);
      renderer.setClearColor(0x000000, 0);
      root.appendChild(renderer.domElement);

      /* ── surface-sample point cloud ────────────────────── */

      // Sample `PER_TRI` random barycentric points on every triangle face.
      // ~60 tris × 55 samples = ~3 300 points — trivial for THREE.Points.
      const PER_TRI = 70;
      const triCount = INDICES.length / 3;
      const totalPts = triCount * PER_TRI;

      // We keep two buffers: base positions (never mutated) and live positions
      // (jittered each frame for the shimmer effect).
      const basePts = new Float32Array(totalPts * 3);
      const livePts = new Float32Array(totalPts * 3);

      // Random seeds per point so each shimmers independently
      const seeds = new Float32Array(totalPts);

      let ptr = 0;
      for (let t = 0; t < triCount; t++) {
        const i0 = INDICES[t * 3] * 3;
        const i1 = INDICES[t * 3 + 1] * 3;
        const i2 = INDICES[t * 3 + 2] * 3;

        const ax = VERTS[i0],
          ay = VERTS[i0 + 1],
          az = VERTS[i0 + 2];
        const bx = VERTS[i1],
          by = VERTS[i1 + 1],
          bz = VERTS[i1 + 2];
        const cx = VERTS[i2],
          cy = VERTS[i2 + 1],
          cz = VERTS[i2 + 2];

        for (let s = 0; s < PER_TRI; s++) {
          // Uniform random point in triangle via sqrt trick
          const r1 = Math.sqrt(Math.random());
          const r2 = Math.random();
          const u = 1 - r1;
          const v = r1 * (1 - r2);
          const w = r1 * r2;

          basePts[ptr * 3] = u * ax + v * bx + w * cx;
          basePts[ptr * 3 + 1] = u * ay + v * by + w * cy;
          basePts[ptr * 3 + 2] = u * az + v * bz + w * cz;
          livePts[ptr * 3] = basePts[ptr * 3];
          livePts[ptr * 3 + 1] = basePts[ptr * 3 + 1];
          livePts[ptr * 3 + 2] = basePts[ptr * 3 + 2];
          seeds[ptr] = Math.random() * Math.PI * 2;
          ptr++;
        }
      }

      const ptGeo = track(new THREE.BufferGeometry());
      const posAttr = new THREE.BufferAttribute(livePts, 3);
      posAttr.setUsage(THREE.DynamicDrawUsage);
      ptGeo.setAttribute("position", posAttr);

      const ptMat = track(
        new THREE.PointsMaterial({
          color: 0xd4c9a8,
          size: 0.022,
          sizeAttenuation: true,
          transparent: true,
          opacity: 0.75,
        }),
      );

      const points = new THREE.Points(ptGeo, ptMat);

      /* ── pivot group ───────────────────────────────────── */
      const headGroup = new THREE.Group();
      headGroup.rotation.x = 0.08;
      headGroup.add(points);
      scene.add(headGroup);

      /* ── resize / visibility ───────────────────────────── */
      const handleResize = () => {
        const w = root.clientWidth;
        const h = root.clientHeight;
        if (!w || !h) return;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };

      const observer = new IntersectionObserver(
        (entries) => {
          viewportActive = entries.some((e) => e.isIntersecting);
        },
        { threshold: 0.05 },
      );
      observer.observe(root);
      window.addEventListener("resize", handleResize);

      /* ── animation ─────────────────────────────────────── */
      const ROTATION_SPEED = 0.15;
      // How far each point drifts from its base position
      const SHIMMER_AMP = 0.004;
      const SHIMMER_FREQ = 1.1;

      const animate = (time: number) => {
        frameId = requestAnimationFrame(animate);
        if (!viewportActive || document.hidden) return;

        const t = time * 0.001;
        headGroup.rotation.y = t * ROTATION_SPEED;

        // Shimmer: nudge each point slightly along its local normal
        // We approximate "normal" direction as offset from centroid (0,0.2,0)
        for (let i = 0; i < totalPts; i++) {
          const bx = basePts[i * 3];
          const by = basePts[i * 3 + 1];
          const bz = basePts[i * 3 + 2];

          // Unit vector from centroid to point
          const dx = bx,
            dy = by - 0.2,
            dz = bz;
          const len = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;

          const flicker = Math.sin(t * SHIMMER_FREQ + seeds[i]) * SHIMMER_AMP;
          livePts[i * 3] = bx + (dx / len) * flicker;
          livePts[i * 3 + 1] = by + (dy / len) * flicker;
          livePts[i * 3 + 2] = bz + (dz / len) * flicker;
        }
        posAttr.needsUpdate = true;

        renderer.render(scene, camera);
      };

      frameId = requestAnimationFrame(animate);

      return () => {
        observer.disconnect();
        window.removeEventListener("resize", handleResize);
      };
    };

    let cleanup: (() => void) | undefined;
    initScene().then((fn) => {
      cleanup = fn;
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frameId);
      cleanup?.();
      for (const d of disposables) d.dispose();
      const canvas = root.querySelector("canvas");
      if (canvas?.parentNode === root) root.removeChild(canvas);
    };
  }, [hasWebGL]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden"
      aria-hidden="true"
    />
  );
}
