"use client";

import { useEffect, useRef, useState } from "react";

type ThreeModule = typeof import("three");

/**
 * Point-cloud 3-D WiFi icon for the GFBR project.
 *
 * Geometry: three concentric TorusGeometry arc segments (small → large)
 * + a SphereGeometry dot, all surface-sampled with the sqrt-barycentric
 * trick and merged into a single THREE.Points draw call.
 *
 * The arc angle is 120° and each arc is Z-rotated so its midpoint sits at
 * the top (+Y), giving the classic WiFi icon silhouette with open ends
 * clearly above the centre dot.
 */
export function WireframeWifi() {
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

      /* ── surface sampler ────────────────────────────────────
         Same sqrt-barycentric trick used across all point-cloud scenes.
      ─────────────────────────────────────────────────────── */
      const sampleInto = (
        geo: import("three").BufferGeometry,
        matrix: import("three").Matrix4,
        perTri: number,
        out: number[],
      ) => {
        const nonIdx = geo.toNonIndexed();
        const attr = nonIdx.getAttribute("position");
        const triCount = attr.count / 3;
        const e = matrix.elements;

        for (let t = 0; t < triCount; t++) {
          const ax = attr.getX(t * 3),
            ay = attr.getY(t * 3),
            az = attr.getZ(t * 3);
          const bx = attr.getX(t * 3 + 1),
            by = attr.getY(t * 3 + 1),
            bz = attr.getZ(t * 3 + 1);
          const cx = attr.getX(t * 3 + 2),
            cy = attr.getY(t * 3 + 2),
            cz = attr.getZ(t * 3 + 2);

          for (let s = 0; s < perTri; s++) {
            const r1 = Math.sqrt(Math.random());
            const r2 = Math.random();
            const u = 1 - r1,
              v = r1 * (1 - r2),
              w = r1 * r2;
            const lx = u * ax + v * bx + w * cx;
            const ly = u * ay + v * by + w * cy;
            const lz = u * az + v * bz + w * cz;
            out.push(
              e[0] * lx + e[4] * ly + e[8] * lz + e[12],
              e[1] * lx + e[5] * ly + e[9] * lz + e[13],
              e[2] * lx + e[6] * ly + e[10] * lz + e[14],
            );
          }
        }
        nonIdx.dispose();
      };

      /**
       * Build a Matrix4 from position + optional Y and Z rotations.
       * Three.js Euler order is XYZ; we only use Y and Z here.
       */
      const mkMatrix = (
        x: number,
        y: number,
        z: number,
        ry = 0,
        rz = 0,
      ): import("three").Matrix4 => {
        const obj = new THREE.Object3D();
        obj.position.set(x, y, z);
        obj.rotation.y = ry;
        obj.rotation.z = rz;
        obj.updateMatrix();
        return obj.matrix;
      };

      /* ── renderer ────────────────────────────────────────── */
      const scene = new THREE.Scene();

      const camera = new THREE.PerspectiveCamera(
        36,
        root.clientWidth / root.clientHeight,
        0.1,
        100,
      );
      camera.position.set(0, 0.05, 4.4);
      camera.lookAt(0, 0.15, 0);

      const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "low-power",
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(root.clientWidth, root.clientHeight);
      renderer.setClearColor(0x000000, 0);
      root.appendChild(renderer.domElement);

      /* ── material ────────────────────────────────────────── */
      const ptMat = track(
        new THREE.PointsMaterial({
          color: 0xd4c9a8,
          size: 0.022,
          sizeAttenuation: true,
          transparent: true,
          opacity: 0.75,
        }),
      );

      /* ── WiFi arc geometry ───────────────────────────────────
         Each arc is a TorusGeometry swept by ARC_ANGLE degrees.
         TorusGeometry starts its sweep at +X (0°) and goes CCW.
         To centre the arc's midpoint at +Y (top) we Z-rotate by:
           rz = -(ARC_ANGLE/2 − π/2)
         which shifts the 60° midpoint to 90° (+Y), so the arc
         peaks at the top and its ends point clearly downward at
         ±30° from vertical — matching the WiFi icon silhouette.
      ─────────────────────────────────────────────────────── */
      const ARC_ANGLE = 120 * (Math.PI / 180); // 120° — matches WiFi icon
      // centre offset so arc midpoint lands at +Y
      const ARC_RZ = -(ARC_ANGLE / 2 - Math.PI / 2); // = −π/6 + π/2 = π/3

      const TUBE_R = 0.07; // slightly fatter tube for WiFi icon boldness

      const pts: number[] = [];

      /* ── DOT ─────────────────────────────────────────────── */
      {
        // Dot radius ~= TUBE_R * 1.3 so it reads as a solid filled circle
        // that matches the visual weight of the arc tubes.
        const geo = new THREE.SphereGeometry(0.09, 10, 8);
        sampleInto(geo, mkMatrix(0, 0, 0), 8, pts);
        geo.dispose();
      }

      /* ── ARCS (inner → outer) ────────────────────────────── */
      // Radii spaced so the gap between arc edges is clearly visible.
      // Gap between arcs = (r_outer - r_inner) - 2*TUBE_R per pair.
      // With TUBE_R=0.07: gaps ≈ 0.18 units each — clean separation.
      // tubularSegments scales with radius so point density stays even.
      const arcDefs = [
        { r: 0.38, tSeg: 18 }, // inner
        { r: 0.68, tSeg: 28 }, // middle
        { r: 0.98, tSeg: 38 }, // outer
      ];

      for (const a of arcDefs) {
        // radialSegments=8 gives a smoother octagonal tube cross-section
        const geo = new THREE.TorusGeometry(a.r, TUBE_R, 8, a.tSeg, ARC_ANGLE);
        sampleInto(geo, mkMatrix(0, 0, 0, 0, ARC_RZ), 4, pts);
        geo.dispose();
      }

      /* ── commit to GPU ───────────────────────────────────── */
      const ptGeo = track(new THREE.BufferGeometry());
      ptGeo.setAttribute(
        "position",
        new THREE.BufferAttribute(new Float32Array(pts), 3),
      );
      const pointsMesh = new THREE.Points(ptGeo, ptMat);

      const wifiGroup = new THREE.Group();
      wifiGroup.add(pointsMesh);
      // Sink slightly so the dot sits just below centre and the outer arc
      // peak clears the top of the viewport comfortably
      // Lower the group so the dot sits near the bottom of the viewport
      // and the outer arc peak sits comfortably in the upper portion.
      wifiGroup.position.y = -0.28;
      scene.add(wifiGroup);

      /* ── resize / visibility ─────────────────────────────── */
      const handleResize = () => {
        const w = root.clientWidth,
          h = root.clientHeight;
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

      /* ── animation ───────────────────────────────────────── */
      const ROTATION_SPEED = 0.15; // rad/s — same as tree, dog, church

      const animate = (time: number) => {
        frameId = requestAnimationFrame(animate);
        if (!viewportActive || document.hidden) return;
        wifiGroup.rotation.y = time * 0.001 * ROTATION_SPEED;
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
