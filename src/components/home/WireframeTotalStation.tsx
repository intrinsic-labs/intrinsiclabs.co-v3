"use client";

import { useEffect, useRef, useState } from "react";

type ThreeModule = typeof import("three");

/**
 * Point-cloud Trimble total station for the Blackthorn Geomatics project.
 *
 * All geometry is built from Three.js primitives, surface-sampled with random
 * barycentric coordinates (same technique as the church / tree / Bible),
 * then merged into a single THREE.Points draw call.
 */
export function WireframeTotalStation() {
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
      camera.position.set(0, 1.0, 8.2);
      camera.lookAt(0, 1.0, 0);

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

      /* ══════════════════════════════════════════════════════
         GEOMETRY — Trimble S-series total station
         Reference: chunky rectangular body, U-handle on top,
         centered objective lens, flat disc knobs on left side.
         Built bottom-to-top.
         ══════════════════════════════════════════════════════ */

      /*
       * Y layout (approximate):
       *   0.00        ground
       *   0.00–0.05   tribrach base plate
       *   0.05–0.17   lower base / leveling base
       *   0.17–0.37   horizontal circle housing
       *   0.37–2.40   main body (2.03 tall)
       *   2.40–2.78   handle U-frame
       *   2.78–3.60   antenna
       *
       * Body centre Y ≈ 1.38
       * Lens centre Y  ≈ 1.72  (upper-center)
       */

      const bodyW = 1.55; // total body width (x)
      const bodyH = 2.03; // total body height (y)
      const bodyD = 0.88; // total body depth (z)
      const bodyBot = 0.37; // bottom of body
      const bodyCY = bodyBot + bodyH / 2; // center Y of body

      /* ── TRIBRACH BASE PLATE ─────────────────────────────── */
      {
        const geo = new THREE.CylinderGeometry(0.95, 0.95, 0.05, 24);
        sampleInto(geo, mkMatrix(0, 0.025, 0), 18, pts);
        geo.dispose();
      }

      /* ── THREE LEVELING SCREWS ───────────────────────────── */
      {
        const geo = new THREE.CylinderGeometry(0.07, 0.07, 0.055, 8);
        for (let i = 0; i < 3; i++) {
          const angle = (i * Math.PI * 2) / 3 - Math.PI / 6;
          const sx = Math.cos(angle) * 0.74;
          const sz = Math.sin(angle) * 0.74;
          sampleInto(geo, mkMatrix(sx, 0.078, sz), 6, pts);
        }
        geo.dispose();
      }

      /* ── LOWER LEVELING BASE ─────────────────────────────── */
      {
        const geo = new THREE.CylinderGeometry(0.72, 0.78, 0.12, 20);
        sampleInto(geo, mkMatrix(0, 0.11, 0), 22, pts);
        geo.dispose();
      }

      /* ── HORIZONTAL CIRCLE HOUSING ───────────────────────── */
      {
        const geo = new THREE.CylinderGeometry(0.62, 0.62, 0.2, 20);
        sampleInto(geo, mkMatrix(0, 0.27, 0), 25, pts);
        geo.dispose();
      }

      /* ── HORIZONTAL CLAMP KNOB (front of base) ──────────── */
      {
        const geo = new THREE.CylinderGeometry(0.055, 0.055, 0.12, 8);
        sampleInto(
          geo,
          mkMatrixFull(0.45, 0.27, -0.48, Math.PI / 2, 0, 0),
          6,
          pts,
        );
        geo.dispose();
      }

      /* ── MAIN BODY ──────────────────────────────────────── */
      // Big chunky rectangular housing
      {
        const geo = new THREE.BoxGeometry(bodyW, bodyH, bodyD);
        sampleInto(geo, mkMatrix(0, bodyCY, 0), 110, pts);
        geo.dispose();
      }

      /* ── LEFT STANDARD (side frame pillar) ───────────────── */
      // Slightly proud of the main body on the left side — the structural frame
      {
        const stdW = 0.2;
        const stdH = bodyH + 0.06;
        const stdD = bodyD + 0.08;
        const geo = new THREE.BoxGeometry(stdW, stdH, stdD);
        sampleInto(
          geo,
          mkMatrix(-bodyW / 2 - stdW / 2 + 0.04, bodyCY, 0),
          28,
          pts,
        );
        geo.dispose();
      }

      /* ── RIGHT STANDARD (side frame pillar) ──────────────── */
      {
        const stdW = 0.2;
        const stdH = bodyH + 0.06;
        const stdD = bodyD + 0.08;
        const geo = new THREE.BoxGeometry(stdW, stdH, stdD);
        sampleInto(
          geo,
          mkMatrix(bodyW / 2 + stdW / 2 - 0.04, bodyCY, 0),
          28,
          pts,
        );
        geo.dispose();
      }

      /* ── HANDLE — U-SHAPED ───────────────────────────────── */
      // Two vertical posts rising from top of standards + horizontal bar
      {
        const handleTopY = bodyBot + bodyH; // 2.40
        const postH = 0.36;
        const postW = 0.13;
        const postD = 0.14;
        const postCY = handleTopY + postH / 2;

        // Left post
        const lgeo = new THREE.BoxGeometry(postW, postH, postD);
        sampleInto(lgeo, mkMatrix(-0.52, postCY, 0), 14, pts);
        lgeo.dispose();

        // Right post
        const rgeo = new THREE.BoxGeometry(postW, postH, postD);
        sampleInto(rgeo, mkMatrix(0.52, postCY, 0), 14, pts);
        rgeo.dispose();

        // Horizontal bar connecting them
        const barW = 1.04 + postW;
        const barH = 0.11;
        const barD = 0.15;
        const bgeo = new THREE.BoxGeometry(barW, barH, barD);
        sampleInto(
          bgeo,
          mkMatrix(0, handleTopY + postH + barH / 2, 0),
          22,
          pts,
        );
        bgeo.dispose();

        // Rounded grip on handle bar (cylinder along X)
        const gripGeo = new THREE.CylinderGeometry(
          0.065,
          0.065,
          barW * 0.7,
          10,
        );
        sampleInto(
          gripGeo,
          mkMatrixFull(
            0,
            handleTopY + postH + barH + 0.02,
            0,
            0,
            0,
            Math.PI / 2,
          ),
          14,
          pts,
        );
        gripGeo.dispose();
      }

      /* ── TELESCOPE FACE PLATE (lighter center panel) ─────── */
      // A slightly recessed / proud lighter panel on the front face
      {
        const panelW = 0.72;
        const panelH = 1.3;
        const panelZ = -bodyD / 2 - 0.005;
        const panelCY = bodyCY + 0.22;
        const geo = new THREE.PlaneGeometry(panelW, panelH);
        sampleInto(geo, mkMatrix(0, panelCY, panelZ), 18, pts);
        geo.dispose();

        // Panel border
        const lt = 0.012;
        const tg = new THREE.PlaneGeometry(panelW, lt);
        sampleInto(tg, mkMatrix(0, panelCY + panelH / 2, panelZ), 5, pts);
        tg.dispose();
        const bg = new THREE.PlaneGeometry(panelW, lt);
        sampleInto(bg, mkMatrix(0, panelCY - panelH / 2, panelZ), 5, pts);
        bg.dispose();
        const lg = new THREE.PlaneGeometry(lt, panelH);
        sampleInto(lg, mkMatrix(-panelW / 2, panelCY, panelZ), 5, pts);
        lg.dispose();
        const rg = new THREE.PlaneGeometry(lt, panelH);
        sampleInto(rg, mkMatrix(panelW / 2, panelCY, panelZ), 5, pts);
        rg.dispose();
      }

      /* ── LENS HOUSING PROTRUSION ─────────────────────────── */
      // Cylindrical bump centered on front face for the objective lens
      {
        const lensY = bodyCY + 0.34; // upper-center of body
        const lensFrontZ = -bodyD / 2;

        // Cylindrical housing
        const geo = new THREE.CylinderGeometry(0.38, 0.38, 0.14, 20);
        sampleInto(
          geo,
          mkMatrixFull(0, lensY, lensFrontZ - 0.07, Math.PI / 2, 0, 0),
          30,
          pts,
        );
        geo.dispose();

        // Outer lens ring
        const ring1 = new THREE.TorusGeometry(0.32, 0.035, 8, 22);
        sampleInto(ring1, mkMatrix(0, lensY, lensFrontZ - 0.15), 16, pts);
        ring1.dispose();

        // Lens glass face
        const face = new THREE.CircleGeometry(0.28, 20);
        sampleInto(face, mkMatrix(0, lensY, lensFrontZ - 0.15), 22, pts);
        face.dispose();

        // Inner lens ring (gives depth)
        const ring2 = new THREE.TorusGeometry(0.18, 0.022, 6, 16);
        sampleInto(ring2, mkMatrix(0, lensY, lensFrontZ - 0.13), 10, pts);
        ring2.dispose();

        // Inner-inner ring (aperture hint)
        const ring3 = new THREE.TorusGeometry(0.09, 0.015, 5, 12);
        sampleInto(ring3, mkMatrix(0, lensY, lensFrontZ - 0.11), 6, pts);
        ring3.dispose();
      }

      /* ── TRACKING CAMERA (small, below main lens) ────────── */
      {
        const camY = bodyCY + 0.0;
        const camZ = -bodyD / 2 - 0.01;

        // Housing
        const geo = new THREE.BoxGeometry(0.16, 0.22, 0.06);
        sampleInto(geo, mkMatrix(0, camY, camZ), 14, pts);
        geo.dispose();

        // Camera lens
        const lens = new THREE.CircleGeometry(0.055, 10);
        sampleInto(lens, mkMatrix(0, camY, camZ - 0.035), 7, pts);
        lens.dispose();

        // Camera lens ring
        const ring = new THREE.TorusGeometry(0.055, 0.012, 5, 10);
        sampleInto(ring, mkMatrix(0, camY, camZ - 0.035), 5, pts);
        ring.dispose();
      }

      /* ── DISPLAY SCREEN ──────────────────────────────────── */
      {
        const dispY = bodyCY - 0.55;
        const dispZ = -bodyD / 2 - 0.005;

        // Screen glass
        const geo = new THREE.PlaneGeometry(0.38, 0.22);
        sampleInto(geo, mkMatrix(0.08, dispY, dispZ), 18, pts);
        geo.dispose();

        // Screen bezel
        const bw = 0.42;
        const bh = 0.26;
        const lt = 0.012;

        const tg = new THREE.PlaneGeometry(bw, lt);
        sampleInto(tg, mkMatrix(0.08, dispY + bh / 2, dispZ), 5, pts);
        tg.dispose();
        const bg = new THREE.PlaneGeometry(bw, lt);
        sampleInto(bg, mkMatrix(0.08, dispY - bh / 2, dispZ), 5, pts);
        bg.dispose();
        const lgb = new THREE.PlaneGeometry(lt, bh);
        sampleInto(lgb, mkMatrix(0.08 - bw / 2, dispY, dispZ), 5, pts);
        lgb.dispose();
        const rgb = new THREE.PlaneGeometry(lt, bh);
        sampleInto(rgb, mkMatrix(0.08 + bw / 2, dispY, dispZ), 5, pts);
        rgb.dispose();
      }

      /* ── TANGENT SCREW (small knob, front-left of display) ─ */
      {
        const screwY = bodyCY - 0.55;
        const screwZ = -bodyD / 2 - 0.02;
        const geo = new THREE.CylinderGeometry(0.04, 0.04, 0.08, 8);
        sampleInto(
          geo,
          mkMatrixFull(-0.22, screwY, screwZ, Math.PI / 2, 0, 0),
          6,
          pts,
        );
        geo.dispose();
      }

      /* ── CONTROL BUTTONS (3, below display) ──────────────── */
      {
        const geo = new THREE.BoxGeometry(0.08, 0.04, 0.012);
        const btnY = bodyCY - 0.78;
        const btnZ = -bodyD / 2 - 0.005;
        sampleInto(geo, mkMatrix(-0.02, btnY, btnZ), 5, pts);
        sampleInto(geo, mkMatrix(0.1, btnY, btnZ), 5, pts);
        sampleInto(geo, mkMatrix(0.22, btnY, btnZ), 5, pts);
        geo.dispose();
      }

      /* ── THREE FLAT DISC KNOBS (left side — like quarters) ─ */
      // These are the focus / horizontal / vertical tangent knobs
      {
        const knobX = -bodyW / 2 - 0.16;
        const knobR = 0.085; // radius — quarter-sized
        const knobThick = 0.035; // thin disc

        const defs = [
          { y: bodyCY + 0.5, z: -0.08 },
          { y: bodyCY + 0.1, z: -0.08 },
          { y: bodyCY - 0.3, z: -0.08 },
        ];

        for (const kp of defs) {
          // Disc body
          const geo = new THREE.CylinderGeometry(knobR, knobR, knobThick, 14);
          sampleInto(
            geo,
            mkMatrixFull(knobX, kp.y, kp.z, 0, 0, Math.PI / 2),
            8,
            pts,
          );
          geo.dispose();

          // Face circle (visible from side)
          const face = new THREE.CircleGeometry(knobR, 14);
          sampleInto(
            face,
            mkMatrixFull(
              knobX - knobThick / 2 - 0.002,
              kp.y,
              kp.z,
              0,
              Math.PI / 2,
              0,
            ),
            5,
            pts,
          );
          face.dispose();

          // Grip ring around the edge
          const ring = new THREE.TorusGeometry(knobR, 0.008, 4, 14);
          sampleInto(
            ring,
            mkMatrixFull(
              knobX - knobThick / 2 - 0.002,
              kp.y,
              kp.z,
              0,
              Math.PI / 2,
              0,
            ),
            4,
            pts,
          );
          ring.dispose();
        }
      }

      /* ── TWO CIRCULAR SCREWS (front face, flanking lens) ─── */
      // These are the locking screws visible on the front of the standards
      {
        const screwR = 0.04;
        const screwZ = -bodyD / 2 - 0.01;
        const screwY = bodyCY + 0.7;

        const face = new THREE.CircleGeometry(screwR, 8);
        sampleInto(face, mkMatrix(-0.54, screwY, screwZ), 4, pts);
        sampleInto(face, mkMatrix(0.54, screwY, screwZ), 4, pts);
        face.dispose();

        const ring = new THREE.TorusGeometry(screwR, 0.008, 4, 8);
        sampleInto(ring, mkMatrix(-0.54, screwY, screwZ), 3, pts);
        sampleInto(ring, mkMatrix(0.54, screwY, screwZ), 3, pts);
        ring.dispose();
      }

      /* ── TRIMBLE LOGO AREA ───────────────────────────────── */
      {
        const geo = new THREE.PlaneGeometry(0.28, 0.05);
        sampleInto(geo, mkMatrix(0, bodyCY + 0.82, -bodyD / 2 - 0.005), 7, pts);
        geo.dispose();
      }

      /* ── BATTERY COMPARTMENT (right side) ────────────────── */
      {
        const geo = new THREE.BoxGeometry(0.05, 0.72, 0.48);
        sampleInto(
          geo,
          mkMatrix(bodyW / 2 + 0.12, bodyCY - 0.3, 0.05),
          10,
          pts,
        );
        geo.dispose();

        // Latch line
        const line = new THREE.PlaneGeometry(0.48, 0.015);
        sampleInto(
          line,
          mkMatrixFull(bodyW / 2 + 0.15, bodyCY - 0.3, 0.05, 0, Math.PI / 2, 0),
          4,
          pts,
        );
        line.dispose();
      }

      /* ── ANTENNA BASE ────────────────────────────────────── */
      {
        const antX = 0.52;
        const antBaseY = bodyBot + bodyH + 0.36; // on top of handle post area
        const antZ = -0.22;

        const base = new THREE.CylinderGeometry(0.04, 0.04, 0.06, 8);
        sampleInto(base, mkMatrix(antX, antBaseY, antZ), 6, pts);
        base.dispose();

        // Mast
        const mast = new THREE.CylinderGeometry(0.014, 0.01, 0.82, 6);
        sampleInto(mast, mkMatrix(antX, antBaseY + 0.44, antZ), 14, pts);
        mast.dispose();

        // Tip sphere
        const tip = new THREE.SphereGeometry(0.024, 6, 4);
        sampleInto(tip, mkMatrix(antX, antBaseY + 0.86, antZ), 5, pts);
        tip.dispose();
      }

      /* ── FRONT FACE HORIZONTAL ACCENT LINES ──────────────── */
      {
        const fz = -bodyD / 2 - 0.003;
        const geo = new THREE.PlaneGeometry(bodyW, 0.008);
        const trimYs = [
          bodyBot + 0.08,
          bodyCY - 0.35,
          bodyCY + 0.15,
          bodyBot + bodyH - 0.06,
        ];
        for (const ty of trimYs) {
          sampleInto(geo, mkMatrix(0, ty, fz), 4, pts);
        }
        geo.dispose();
      }

      /* ── FRONT FACE VERTICAL EDGE ACCENTS ────────────────── */
      {
        const fz = -bodyD / 2 - 0.003;
        const geo = new THREE.PlaneGeometry(0.008, bodyH);
        sampleInto(geo, mkMatrix(-bodyW / 2 + 0.05, bodyCY, fz), 6, pts);
        sampleInto(geo, mkMatrix(bodyW / 2 - 0.05, bodyCY, fz), 6, pts);
        geo.dispose();
      }

      /* ── BOTTOM BODY FLARE (wider at base) ───────────────── */
      // Slight flared step where body meets the horizontal circle
      {
        const geo = new THREE.BoxGeometry(bodyW + 0.1, 0.08, bodyD + 0.06);
        sampleInto(geo, mkMatrix(0, bodyBot + 0.04, 0), 12, pts);
        geo.dispose();
      }

      /* ── commit to GPU ───────────────────────────────────── */
      const ptGeo = track(new THREE.BufferGeometry());
      ptGeo.setAttribute(
        "position",
        new THREE.BufferAttribute(new Float32Array(pts), 3),
      );
      const pointsMesh = new THREE.Points(ptGeo, ptMat);

      const stationGroup = new THREE.Group();
      stationGroup.add(pointsMesh);
      // Sink the group so the instrument is well-framed
      stationGroup.position.y = -1.05;
      scene.add(stationGroup);

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
      const ROTATION_SPEED = 0.15; // rad/s — same as church + tree + bible

      const animate = (time: number) => {
        frameId = requestAnimationFrame(animate);
        if (!viewportActive || document.hidden) return;
        stationGroup.rotation.y = time * 0.001 * ROTATION_SPEED;
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
