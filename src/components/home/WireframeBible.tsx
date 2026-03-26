"use client";

import { useEffect, useRef, useState } from "react";

type ThreeModule = typeof import("three");

/**
 * Point-cloud Bible for the Sophron Studies project.
 *
 * All geometry is built from Three.js primitives + a custom spine arc,
 * surface-sampled with random barycentric coordinates (same sqrt trick as the
 * church / tree), then merged into a single THREE.Points draw call.
 */
export function WireframeBible() {
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

      /* Build a Matrix4 from position + arbitrary Euler rotation */
      const mkMatrixFull = (
        x: number,
        y: number,
        z: number,
        rx: number,
        ry: number,
        rz: number,
      ): import("three").Matrix4 => {
        const obj = new THREE.Object3D();
        obj.position.set(x, y, z);
        obj.rotation.set(rx, ry, rz);
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
      camera.position.set(0, 0.6, 8.5);
      camera.lookAt(0, 0.2, 0);

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

      /* ── BIBLE DIMENSIONS ───────────────────────────────── */
      const coverW = 1.8; // cover width  (x-axis)
      const coverH = 2.6; // cover height (y-axis)
      const bookT = 0.75; // total thickness (z-axis)
      const coverT = 0.035; // cover plate thickness
      const pageInset = 0.05; // pages recessed from cover edge
      const spineR = bookT / 2; // spine radius

      /* ── FRONT COVER ─────────────────────────────────────── */
      {
        const geo = new THREE.BoxGeometry(coverW, coverH, coverT);
        sampleInto(geo, mkMatrix(0, 0, bookT / 2 - coverT / 2), 95, pts);
        geo.dispose();
      }

      /* ── BACK COVER ──────────────────────────────────────── */
      {
        const geo = new THREE.BoxGeometry(coverW, coverH, coverT);
        sampleInto(geo, mkMatrix(0, 0, -bookT / 2 + coverT / 2), 95, pts);
        geo.dispose();
      }

      /* ── SPINE (half-cylinder, bulges toward –x) ─────────── */
      {
        // thetaStart=PI, thetaLength=PI arcs from –z through –x to +z
        const geo = new THREE.CylinderGeometry(
          spineR,
          spineR,
          coverH,
          16,
          1,
          true,
          Math.PI,
          Math.PI,
        );
        sampleInto(geo, mkMatrix(-coverW / 2, 0, 0), 75, pts);
        geo.dispose();
      }

      /* ── PAGE BLOCK — fore-edge (right side, facing +x) ─── */
      {
        const pageH = coverH - pageInset * 2;
        const pageT = bookT - coverT * 2 - 0.02;
        const geo = new THREE.PlaneGeometry(pageT, pageH);
        sampleInto(
          geo,
          mkMatrixFull(coverW / 2 - pageInset, 0, 0, 0, Math.PI / 2, 0),
          75,
          pts,
        );
        geo.dispose();
      }

      /* ── PAGE BLOCK — top edge ───────────────────────────── */
      {
        const pageW = coverW - pageInset * 2 - spineR * 0.3;
        const pageT = bookT - coverT * 2 - 0.02;
        const geo = new THREE.PlaneGeometry(pageW, pageT);
        sampleInto(
          geo,
          mkMatrixFull(spineR * 0.15, coverH / 2 - pageInset, 0, Math.PI / 2, 0, 0),
          55,
          pts,
        );
        geo.dispose();
      }

      /* ── PAGE BLOCK — bottom edge ────────────────────────── */
      {
        const pageW = coverW - pageInset * 2 - spineR * 0.3;
        const pageT = bookT - coverT * 2 - 0.02;
        const geo = new THREE.PlaneGeometry(pageW, pageT);
        sampleInto(
          geo,
          mkMatrixFull(spineR * 0.15, -coverH / 2 + pageInset, 0, -Math.PI / 2, 0, 0),
          55,
          pts,
        );
        geo.dispose();
      }

      /* ── PAGE LINES on fore-edge (suggest individual pages) ─ */
      {
        const pageH = coverH - pageInset * 2;
        const lineCount = 22;
        const pageT = bookT - coverT * 2 - 0.02;
        for (let i = 0; i < lineCount; i++) {
          const frac = (i + 1) / (lineCount + 1);
          const z = -pageT / 2 + frac * pageT;
          const geo = new THREE.PlaneGeometry(0.003, pageH * 0.88);
          sampleInto(
            geo,
            mkMatrixFull(
              coverW / 2 - pageInset + 0.003,
              0,
              z,
              0,
              Math.PI / 2,
              0,
            ),
            4,
            pts,
          );
          geo.dispose();
        }
      }

      /* ── CROSS on front cover ────────────────────────────── */
      {
        const crossY = 0.3;
        const crossZ = bookT / 2 + 0.004;
        // Vertical bar
        const vgeo = new THREE.PlaneGeometry(0.065, 0.6);
        sampleInto(vgeo, mkMatrix(0, crossY, crossZ), 38, pts);
        vgeo.dispose();
        // Horizontal bar
        const hgeo = new THREE.PlaneGeometry(0.35, 0.065);
        sampleInto(hgeo, mkMatrix(0, crossY + 0.1, crossZ), 28, pts);
        hgeo.dispose();
      }

      /* ── TITLE LINES on front cover (below cross) ────────── */
      {
        const tz = bookT / 2 + 0.004;
        const geo1 = new THREE.PlaneGeometry(0.52, 0.022);
        sampleInto(geo1, mkMatrix(0, -0.28, tz), 12, pts);
        geo1.dispose();
        const geo2 = new THREE.PlaneGeometry(0.36, 0.022);
        sampleInto(geo2, mkMatrix(0, -0.36, tz), 9, pts);
        geo2.dispose();
      }

      /* ── RAISED BORDER on front cover ────────────────────── */
      {
        const bz = bookT / 2 + 0.003;
        const bIn = 0.14;
        const bW = coverW - bIn * 2;
        const bH = coverH - bIn * 2;
        const lt = 0.014; // line thickness

        // Top
        const tg = new THREE.PlaneGeometry(bW, lt);
        sampleInto(tg, mkMatrix(0, bH / 2, bz), 14, pts);
        tg.dispose();
        // Bottom
        const bg = new THREE.PlaneGeometry(bW, lt);
        sampleInto(bg, mkMatrix(0, -bH / 2, bz), 14, pts);
        bg.dispose();
        // Left
        const lg = new THREE.PlaneGeometry(lt, bH);
        sampleInto(lg, mkMatrix(-bW / 2, 0, bz), 14, pts);
        lg.dispose();
        // Right
        const rg = new THREE.PlaneGeometry(lt, bH);
        sampleInto(rg, mkMatrix(bW / 2, 0, bz), 14, pts);
        rg.dispose();
      }

      /* ── SPINE DETAIL (title lines) ──────────────────────── */
      {
        const sx = -coverW / 2 - spineR + 0.01;
        // Title line
        const g1 = new THREE.PlaneGeometry(0.4, 0.022);
        sampleInto(
          g1,
          mkMatrixFull(sx, 0.15, 0, 0, Math.PI / 2, 0),
          10,
          pts,
        );
        g1.dispose();
        // Subtitle line
        const g2 = new THREE.PlaneGeometry(0.26, 0.022);
        sampleInto(
          g2,
          mkMatrixFull(sx, -0.05, 0, 0, Math.PI / 2, 0),
          7,
          pts,
        );
        g2.dispose();
      }

      /* ── RIBBON BOOKMARK ─────────────────────────────────── */
      {
        const ribbonW = 0.035;
        const ribbonH = 0.5;
        const ribbonX = 0.12;
        const ribbonBaseZ = bookT / 2 - 0.06;
        const ribbonY = -coverH / 2 - ribbonH / 2 + 0.06;

        const geo = new THREE.PlaneGeometry(ribbonW, ribbonH);
        sampleInto(geo, mkMatrix(ribbonX, ribbonY, ribbonBaseZ), 18, pts);
        geo.dispose();

        // V-notch at bottom end of ribbon
        // prettier-ignore
        const vNotch = new Float32Array([
          -0.018, 0.0, 0,
           0.018, 0.0, 0,
           0.0, -0.055, 0,
        ]);
        const vGeo = new THREE.BufferGeometry();
        vGeo.setAttribute(
          "position",
          new THREE.BufferAttribute(vNotch, 3),
        );
        vGeo.setIndex([0, 1, 2]);
        sampleInto(
          vGeo,
          mkMatrix(ribbonX, ribbonY - ribbonH / 2, ribbonBaseZ),
          7,
          pts,
        );
        vGeo.dispose();
      }

      /* ── BACK COVER BORDER (subtle, same inset as front) ── */
      {
        const bz = -bookT / 2 - 0.003;
        const bIn = 0.14;
        const bW = coverW - bIn * 2;
        const bH = coverH - bIn * 2;
        const lt = 0.014;

        const tg = new THREE.PlaneGeometry(bW, lt);
        sampleInto(tg, mkMatrix(0, bH / 2, bz), 10, pts);
        tg.dispose();
        const bg = new THREE.PlaneGeometry(bW, lt);
        sampleInto(bg, mkMatrix(0, -bH / 2, bz), 10, pts);
        bg.dispose();
        const lg = new THREE.PlaneGeometry(lt, bH);
        sampleInto(lg, mkMatrix(-bW / 2, 0, bz), 10, pts);
        lg.dispose();
        const rg = new THREE.PlaneGeometry(lt, bH);
        sampleInto(rg, mkMatrix(bW / 2, 0, bz), 10, pts);
        rg.dispose();
      }

      /* ── commit to GPU ───────────────────────────────────── */
      const ptGeo = track(new THREE.BufferGeometry());
      ptGeo.setAttribute(
        "position",
        new THREE.BufferAttribute(new Float32Array(pts), 3),
      );
      const pointsMesh = new THREE.Points(ptGeo, ptMat);

      const bibleGroup = new THREE.Group();
      bibleGroup.add(pointsMesh);
      // Slight forward tilt so the cover face is more visible
      bibleGroup.rotation.x = 0.12;
      scene.add(bibleGroup);

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
      const ROTATION_SPEED = 0.15; // rad/s — same as church + tree

      const animate = (time: number) => {
        frameId = requestAnimationFrame(animate);
        if (!viewportActive || document.hidden) return;
        bibleGroup.rotation.y = time * 0.001 * ROTATION_SPEED;
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
