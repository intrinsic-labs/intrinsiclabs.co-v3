"use client";

import { useEffect, useRef, useState } from "react";

type ThreeModule = typeof import("three");

/**
 * Point-cloud small chapel for the Church Ops project.
 *
 * All geometry is built from Three.js primitives + a custom gable-roof prism,
 * surface-sampled with random barycentric coordinates (same sqrt trick as the
 * dog-head), then merged into a single THREE.Points draw call.
 */
export function WireframeChurch() {
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
         Samples `perTri` uniform random points on every triangle
         of `geo`, transforms each by `matrix`, pushes XYZ into `out`.
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

      /* Build a Matrix4 from position + optional Y rotation */
      const mkMatrix = (
        x: number,
        y: number,
        z: number,
        ry = 0,
      ): import("three").Matrix4 => {
        const obj = new THREE.Object3D();
        obj.position.set(x, y, z);
        if (ry) obj.rotation.y = ry;
        obj.updateMatrix();
        return obj.matrix;
      };

      /* ── renderer ────────────────────────────────────────── */
      const scene = new THREE.Scene();

      const camera = new THREE.PerspectiveCamera(
        34,
        root.clientWidth / root.clientHeight,
        0.1,
        100,
      );
      camera.position.set(0, 1.0, 9.2);
      camera.lookAt(0, 1.2, 0);

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
          size: 0.024,
          sizeAttenuation: true,
          transparent: true,
          opacity: 0.72,
        }),
      );

      /* ── accumulate all sampled points ───────────────────── */
      const pts: number[] = [];

      /* ── FOUNDATION ─────────────────────────────────────── */
      {
        const geo = new THREE.BoxGeometry(2.0, 0.07, 1.75);
        sampleInto(geo, mkMatrix(0, 0.035, 0), 16, pts);
        geo.dispose();
      }

      /* ── NAVE body ───────────────────────────────────────── */
      // Main rectangular chapel body
      {
        const geo = new THREE.BoxGeometry(1.85, 1.25, 1.65);
        sampleInto(geo, mkMatrix(0, 0.625 + 0.07, 0), 78, pts);
        geo.dispose();
      }

      /* ── NAVE GABLE ROOF ─────────────────────────────────── */
      // Custom prism: 4 eave corners + 2 ridge points
      {
        const ew = 1.0, // eave half-width  (slightly wider than nave 0.925)
          ed = 0.88, // eave half-depth
          ry0 = 1.32, // eave Y (top of nave walls)
          ry1 = 2.1; // ridge Y

        // prettier-ignore
        const v = new Float32Array([
          -ew, ry0, -ed,   // 0  front-left  eave
           ew, ry0, -ed,   // 1  front-right eave
           ew, ry0,  ed,   // 2  back-right  eave
          -ew, ry0,  ed,   // 3  back-left   eave
            0, ry1, -ed,   // 4  front ridge
            0, ry1,  ed,   // 5  back ridge
        ]);

        // prettier-ignore
        const idx = [
          0, 1, 4,            // front gable triangle
          3, 5, 2,            // back gable triangle
          0, 3, 5,  0, 5, 4, // left slope  (2 tris)
          1, 4, 5,  1, 5, 2, // right slope (2 tris)
        ];

        const geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.BufferAttribute(v, 3));
        geo.setIndex(idx);
        sampleInto(geo, new THREE.Matrix4(), 52, pts);
        geo.dispose();
      }

      /* ── BELL TOWER (full height, front-centre) ──────────── */
      // Runs from ground straight through the nave up to the steeple base.
      // Its front face (z = –0.82) is flush with the nave front face.
      {
        const geo = new THREE.BoxGeometry(0.62, 2.7, 0.62);
        // centre at (0, 1.35, -0.51): front face at -0.51-0.31 = -0.82 ✓
        sampleInto(geo, mkMatrix(0, 1.35, -0.51), 55, pts);
        geo.dispose();
      }

      /* ── BELFRY LEDGE ────────────────────────────────────── */
      // Thin horizontal overhang band around the top of the tower
      {
        const geo = new THREE.BoxGeometry(0.72, 0.07, 0.72);
        sampleInto(geo, mkMatrix(0, 2.7, -0.51), 16, pts);
        geo.dispose();
      }

      /* ── STEEPLE / SPIRE ─────────────────────────────────── */
      // 4-sided pyramid — openEnded so we only sample the 4 sloped faces
      {
        const geo = new THREE.CylinderGeometry(0, 0.38, 1.85, 4, 1, true);
        // base at y=2.7, centre at 2.7 + 0.925
        sampleInto(geo, mkMatrix(0, 3.625, -0.51), 40, pts);
        geo.dispose();
      }

      /* ── CROSS ───────────────────────────────────────────── */
      {
        const tipY = 2.7 + 1.85; // = 4.55
        // vertical bar
        const vgeo = new THREE.BoxGeometry(0.065, 0.5, 0.065);
        sampleInto(vgeo, mkMatrix(0, tipY + 0.25, -0.51), 14, pts);
        vgeo.dispose();
        // horizontal bar
        const hgeo = new THREE.BoxGeometry(0.3, 0.065, 0.065);
        sampleInto(hgeo, mkMatrix(0, tipY + 0.36, -0.51), 10, pts);
        hgeo.dispose();
      }

      /* ── SIDE WINDOWS (2 per side, pointed-arch hint) ────── */
      // Main pane
      {
        const wpane = new THREE.PlaneGeometry(0.34, 0.5);
        const wPositions = [
          { x: -0.925, y: 0.78, z: -0.28 },
          { x: -0.925, y: 0.78, z: 0.3 },
          { x: 0.925, y: 0.78, z: -0.28 },
          { x: 0.925, y: 0.78, z: 0.3 },
        ];
        for (const p of wPositions) {
          sampleInto(wpane, mkMatrix(p.x, p.y, p.z, Math.PI / 2), 36, pts);
        }
        wpane.dispose();
      }
      // Pointed arch peak above each window (small triangle)
      {
        // prettier-ignore
        const archV = new Float32Array([
          -0.17, 0.0, 0,
           0.17, 0.0, 0,
           0.0,  0.16, 0,
        ]);
        const archGeo = new THREE.BufferGeometry();
        archGeo.setAttribute("position", new THREE.BufferAttribute(archV, 3));
        archGeo.setIndex([0, 1, 2]);
        const archPositions = [
          { x: -0.925, y: 1.035, z: -0.28 },
          { x: -0.925, y: 1.035, z: 0.3 },
          { x: 0.925, y: 1.035, z: -0.28 },
          { x: 0.925, y: 1.035, z: 0.3 },
        ];
        for (const p of archPositions) {
          sampleInto(archGeo, mkMatrix(p.x, p.y, p.z, Math.PI / 2), 22, pts);
        }
        archGeo.dispose();
      }

      /* ── FRONT DOOR ──────────────────────────────────────── */
      // Rectangle pane centred on the tower front face
      {
        const dgeo = new THREE.PlaneGeometry(0.36, 0.68);
        sampleInto(dgeo, mkMatrix(0, 0.41, -0.82), 42, pts);
        dgeo.dispose();
      }
      // Gothic arch peak above door
      {
        // prettier-ignore
        const archV = new Float32Array([
          -0.18, 0.0, 0,
           0.18, 0.0, 0,
           0.0,  0.22, 0,
        ]);
        const archGeo = new THREE.BufferGeometry();
        archGeo.setAttribute("position", new THREE.BufferAttribute(archV, 3));
        archGeo.setIndex([0, 1, 2]);
        sampleInto(archGeo, mkMatrix(0, 0.775, -0.82), 28, pts);
        archGeo.dispose();
      }

      /* ── FRONT STEP ──────────────────────────────────────── */
      {
        const sgeo = new THREE.BoxGeometry(0.56, 0.08, 0.22);
        sampleInto(sgeo, mkMatrix(0, 0.11, -0.93), 15, pts);
        sgeo.dispose();
      }

      /* ── TOWER BELFRY WINDOW HINTS ───────────────────────── */
      // Small openings on each face of the tower near the top
      {
        const bwGeo = new THREE.PlaneGeometry(0.22, 0.34);
        const bwDefs = [
          { x: 0, y: 2.22, z: -0.82, ry: 0 }, // front
          { x: 0, y: 2.22, z: -0.2, ry: Math.PI }, // back
          { x: -0.31, y: 2.22, z: -0.51, ry: Math.PI / 2 }, // left
          { x: 0.31, y: 2.22, z: -0.51, ry: -Math.PI / 2 }, // right
        ];
        for (const b of bwDefs) {
          sampleInto(bwGeo, mkMatrix(b.x, b.y, b.z, b.ry), 22, pts);
        }
        bwGeo.dispose();
      }

      /* ── commit to GPU ───────────────────────────────────── */
      const ptGeo = track(new THREE.BufferGeometry());
      ptGeo.setAttribute(
        "position",
        new THREE.BufferAttribute(new Float32Array(pts), 3),
      );
      const pointsMesh = new THREE.Points(ptGeo, ptMat);

      const churchGroup = new THREE.Group();
      churchGroup.add(pointsMesh);
      // Sink the group so the steeple soars above the lookAt point
      churchGroup.position.y = -1.4;
      scene.add(churchGroup);

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
      const ROTATION_SPEED = 0.15; // rad/s — same as tree + dog

      const animate = (time: number) => {
        frameId = requestAnimationFrame(animate);
        if (!viewportActive || document.hidden) return;
        churchGroup.rotation.y = time * 0.001 * ROTATION_SPEED;
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
