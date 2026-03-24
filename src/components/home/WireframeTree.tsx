"use client";

import { useEffect, useRef, useState } from "react";

type ThreeModule = typeof import("three");

/**
 * Procedurally generates a wireframe aspen tree using raw Three.js
 * and rotates it slowly on the Y-axis.
 */
export function WireframeTree() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasWebGL, setHasWebGL] = useState<boolean | null>(null);

  useEffect(() => {
    const canvas = document.createElement("canvas");
    const ctx =
      canvas.getContext("webgl2") ||
      canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl");
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

      /* ── helpers ────────────────────────────────────────── */

      const track = <T extends { dispose(): void }>(resource: T): T => {
        disposables.push(resource);
        return resource;
      };

      /* ── scene setup ───────────────────────────────────── */

      const scene = new THREE.Scene();

      const camera = new THREE.PerspectiveCamera(
        36,
        root.clientWidth / root.clientHeight,
        0.1,
        100,
      );
      camera.position.set(0, 2.2, 8.5);
      camera.lookAt(0, 2.0, 0);

      const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "low-power",
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(root.clientWidth, root.clientHeight);
      renderer.setClearColor(0x000000, 0);
      root.appendChild(renderer.domElement);

      /* ── materials ─────────────────────────────────────── */

      const trunkMat = track(
        new THREE.MeshBasicMaterial({
          color: 0xd4c9a8,
          wireframe: true,
          transparent: true,
          opacity: 0.55,
        }),
      );

      const branchMat = track(
        new THREE.MeshBasicMaterial({
          color: 0xc4b898,
          wireframe: true,
          transparent: true,
          opacity: 0.4,
        }),
      );

      const foliageMat = track(
        new THREE.MeshBasicMaterial({
          color: 0x8a9a6a,
          wireframe: true,
          transparent: true,
          opacity: 0.28,
        }),
      );

      const foliageHighMat = track(
        new THREE.MeshBasicMaterial({
          color: 0xa3b07a,
          wireframe: true,
          transparent: true,
          opacity: 0.22,
        }),
      );

      const foliageTinyMat = track(
        new THREE.MeshBasicMaterial({
          color: 0x7a8a5e,
          wireframe: true,
          transparent: true,
          opacity: 0.18,
        }),
      );

      const birdMat = track(
        new THREE.MeshBasicMaterial({
          color: 0xd4c9a8,
          wireframe: true,
          transparent: true,
          opacity: 0.45,
        }),
      );

      /* ── tree group (everything rotates together) ──────── */

      const treeGroup = new THREE.Group();
      scene.add(treeGroup);

      /* ── trunk ─────────────────────────────────────────── */

      const trunkSegments = 5;
      const trunkHeight = 4.8;
      const segHeight = trunkHeight / trunkSegments;
      const baseRadius = 0.14;
      const taper = 0.012;

      for (let i = 0; i < trunkSegments; i++) {
        const rBot = baseRadius - taper * i;
        const rTop = baseRadius - taper * (i + 1);
        const geo = track(
          new THREE.CylinderGeometry(rTop, rBot, segHeight, 7, 1, true),
        );
        const mesh = new THREE.Mesh(geo, trunkMat);
        mesh.position.y = segHeight * 0.5 + segHeight * i;
        treeGroup.add(mesh);
      }

      /* ── branch helper ─────────────────────────────────── */

      type BranchDef = {
        y: number;
        angle: number;
        length: number;
        pitch: number;
        radius: number;
      };

      const addBranch = (def: BranchDef) => {
        const geo = track(
          new THREE.CylinderGeometry(
            def.radius * 0.4,
            def.radius,
            def.length,
            5,
            1,
            true,
          ),
        );
        const mesh = new THREE.Mesh(geo, branchMat);

        // Position at trunk attachment point
        const pivot = new THREE.Group();
        pivot.position.y = def.y;
        pivot.rotation.y = def.angle;
        pivot.rotation.z = def.pitch;

        // Offset the cylinder so it starts at the trunk surface
        mesh.position.y = def.length * 0.5;
        mesh.position.x = 0;
        pivot.add(mesh);
        treeGroup.add(pivot);

        // Return the world-approx tip position for foliage placement
        const tipLocal = new THREE.Vector3(0, def.length, 0);
        tipLocal.applyAxisAngle(new THREE.Vector3(0, 0, 1), def.pitch);
        tipLocal.applyAxisAngle(new THREE.Vector3(0, 1, 0), def.angle);
        return new THREE.Vector3(tipLocal.x, tipLocal.y + def.y, tipLocal.z);
      };

      /* ── branches ──────────────────────────────────────── */

      const branches: BranchDef[] = [
        // Lower branches (longer, more horizontal)
        { y: 1.8, angle: 0.4, length: 1.1, pitch: -0.75, radius: 0.05 },
        { y: 2.1, angle: 2.8, length: 0.9, pitch: -0.65, radius: 0.045 },
        { y: 2.0, angle: 4.6, length: 0.7, pitch: -0.7, radius: 0.04 },
        // Middle branches
        { y: 2.7, angle: 1.2, length: 1.2, pitch: -0.6, radius: 0.045 },
        { y: 2.9, angle: 3.5, length: 1.0, pitch: -0.55, radius: 0.04 },
        { y: 3.1, angle: 5.3, length: 0.85, pitch: -0.58, radius: 0.04 },
        { y: 3.0, angle: 0.0, length: 0.95, pitch: -0.62, radius: 0.04 },
        // Upper branches (shorter, more upward)
        { y: 3.5, angle: 0.8, length: 0.9, pitch: -0.45, radius: 0.035 },
        { y: 3.7, angle: 2.3, length: 0.75, pitch: -0.4, radius: 0.035 },
        { y: 3.9, angle: 4.0, length: 0.65, pitch: -0.42, radius: 0.03 },
        { y: 4.1, angle: 5.5, length: 0.55, pitch: -0.35, radius: 0.03 },
        { y: 4.0, angle: 1.6, length: 0.7, pitch: -0.38, radius: 0.03 },
        // Top tuft
        { y: 4.3, angle: 0.5, length: 0.45, pitch: -0.25, radius: 0.025 },
        { y: 4.4, angle: 3.1, length: 0.4, pitch: -0.2, radius: 0.025 },
        { y: 4.5, angle: 5.0, length: 0.35, pitch: -0.22, radius: 0.02 },
      ];

      const branchTips: import("three").Vector3[] = [];
      for (const b of branches) {
        const tip = addBranch(b);
        branchTips.push(tip);
      }

      /* ── foliage clusters ──────────────────────────────── */

      // Place icosahedrons at branch tips + extra volumetric clusters
      const addFoliageCluster = (
        pos: import("three").Vector3,
        size: number,
        detail: number,
        mat: import("three").Material,
      ) => {
        const geo = track(new THREE.IcosahedronGeometry(size, detail));
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.copy(pos);
        // Slight random rotation for variation
        mesh.rotation.set(pos.x * 2.7, pos.y * 1.3, pos.z * 3.1);
        treeGroup.add(mesh);
      };

      // Clusters at branch tips (reduced ~15%)
      for (const tip of branchTips) {
        const size = (0.25 + Math.abs(Math.sin(tip.y * 3.7)) * 0.35) * 0.85;
        addFoliageCluster(tip, size, 1, foliageMat);
      }

      // Extra volumetric canopy clusters (reduced ~15%)
      const canopyClusters = [
        { x: 0, y: 3.0, z: 0, s: 0.6 },
        { x: 0.3, y: 3.5, z: 0.2, s: 0.55 },
        { x: -0.25, y: 3.8, z: -0.15, s: 0.47 },
        { x: 0.1, y: 4.2, z: -0.2, s: 0.42 },
        { x: -0.15, y: 4.5, z: 0.15, s: 0.34 },
        { x: 0.05, y: 4.8, z: 0.05, s: 0.3 },
        // Wider middle volume
        { x: 0.5, y: 3.2, z: 0.3, s: 0.38 },
        { x: -0.4, y: 3.4, z: -0.35, s: 0.42 },
        { x: 0.35, y: 3.9, z: -0.3, s: 0.34 },
        { x: -0.3, y: 4.1, z: 0.35, s: 0.32 },
      ];

      for (const c of canopyClusters) {
        addFoliageCluster(
          new THREE.Vector3(c.x, c.y, c.z),
          c.s,
          1,
          foliageHighMat,
        );
      }

      // Additional smaller fill clusters for density
      const tinyClusters = [
        { x: 0.15, y: 2.6, z: 0.1, s: 0.2 },
        { x: -0.2, y: 2.9, z: 0.18, s: 0.18 },
        { x: 0.35, y: 3.3, z: -0.1, s: 0.22 },
        { x: -0.1, y: 3.6, z: 0.3, s: 0.2 },
        { x: 0.2, y: 4.0, z: 0.15, s: 0.18 },
        { x: -0.35, y: 3.1, z: 0.2, s: 0.22 },
        { x: 0.08, y: 4.4, z: -0.12, s: 0.16 },
        { x: -0.18, y: 4.7, z: 0.08, s: 0.14 },
        { x: 0.4, y: 3.7, z: 0.25, s: 0.19 },
        { x: -0.3, y: 4.3, z: -0.2, s: 0.17 },
        { x: 0.12, y: 2.4, z: -0.15, s: 0.15 },
        { x: -0.08, y: 5.0, z: 0.04, s: 0.13 },
      ];

      for (const c of tinyClusters) {
        addFoliageCluster(
          new THREE.Vector3(c.x, c.y, c.z),
          c.s,
          0,
          foliageTinyMat,
        );
      }

      /* ── low-poly birds ────────────────────────────────── */

      const createBirdGeo = (span: number) => {
        // A simple low-poly bird: body wedge + two angled wing triangles
        const s = span;
        const verts = new Float32Array([
          // Body: a thin diamond from nose to tail
          0,
          0,
          -s * 0.6, // 0 nose
          0,
          0,
          s * 0.5, // 1 tail
          0,
          s * 0.08,
          0, // 2 top
          0,
          -s * 0.05,
          0, // 3 bottom

          // Left wing triangle
          0,
          0,
          -s * 0.1, // 4 wing root front
          -s,
          s * 0.18,
          0, // 5 wing tip (raised)
          0,
          0,
          s * 0.2, // 6 wing root rear

          // Right wing triangle
          0,
          0,
          -s * 0.1, // 7 wing root front
          s,
          s * 0.18,
          0, // 8 wing tip (raised)
          0,
          0,
          s * 0.2, // 9 wing root rear
        ]);

        const indices = [
          // Body top
          0, 2, 1,
          // Body bottom
          0, 1, 3,
          // Body left
          0, 3, 2,
          // Body right
          1, 2, 3,
          // Left wing
          4, 5, 6,
          // Right wing
          7, 9, 8,
        ];

        const geo = track(new THREE.BufferGeometry());
        geo.setAttribute("position", new THREE.BufferAttribute(verts, 3));
        geo.setIndex(indices);
        geo.computeVertexNormals();
        return geo;
      };

      type BirdState = {
        mesh: import("three").Mesh;
        orbitRadius: number;
        orbitSpeed: number;
        orbitY: number;
        phaseOffset: number;
        flapSpeed: number;
        flapAmount: number;
        wingL: import("three").Vector3;
        wingR: import("three").Vector3;
        baseWingLY: number;
        baseWingRY: number;
      };

      const birds: BirdState[] = [];

      const birdDefs = [
        {
          radius: 2.4,
          y: 3.8,
          speed: 0.35,
          phase: 0,
          span: 0.18,
          flap: 2.8,
          flapAmt: 0.12,
        },
        {
          radius: 3.0,
          y: 4.5,
          speed: -0.25,
          phase: 2.1,
          span: 0.22,
          flap: 2.4,
          flapAmt: 0.15,
        },
        {
          radius: 1.8,
          y: 2.8,
          speed: 0.45,
          phase: 4.2,
          span: 0.15,
          flap: 3.2,
          flapAmt: 0.1,
        },
        {
          radius: 2.8,
          y: 5.2,
          speed: 0.3,
          phase: 1.0,
          span: 0.16,
          flap: 3.0,
          flapAmt: 0.11,
        },
      ];

      for (const bd of birdDefs) {
        const geo = createBirdGeo(bd.span);
        const mesh = new THREE.Mesh(geo, birdMat);
        scene.add(mesh);

        // Grab wing-tip vertex positions for flapping
        const posAttr = geo.getAttribute("position");
        const wingL = new THREE.Vector3().fromBufferAttribute(posAttr, 5);
        const wingR = new THREE.Vector3().fromBufferAttribute(posAttr, 8);

        birds.push({
          mesh,
          orbitRadius: bd.radius,
          orbitSpeed: bd.speed,
          orbitY: bd.y,
          phaseOffset: bd.phase,
          flapSpeed: bd.flap,
          flapAmount: bd.flapAmt,
          wingL,
          wingR,
          baseWingLY: wingL.y,
          baseWingRY: wingR.y,
        });
      }

      /* ── subtle ground mark ────────────────────────────── */

      const groundGeo = track(new THREE.RingGeometry(0.3, 0.8, 6));
      const groundMat = track(
        new THREE.MeshBasicMaterial({
          color: 0xd4c9a8,
          wireframe: true,
          transparent: true,
          opacity: 0.12,
        }),
      );
      const groundMesh = new THREE.Mesh(groundGeo, groundMat);
      groundMesh.rotation.x = -Math.PI / 2;
      groundMesh.position.y = 0.01;
      treeGroup.add(groundMesh);

      /* ── centre the tree so it rotates around its own axis */

      treeGroup.position.y = -2.0;

      /* ── resize handler ────────────────────────────────── */

      const handleResize = () => {
        const w = root.clientWidth;
        const h = root.clientHeight;
        if (w === 0 || h === 0) return;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };

      /* ── visibility observer ───────────────────────────── */

      const observer = new IntersectionObserver(
        (entries) => {
          viewportActive = entries.some((e) => e.isIntersecting);
        },
        { threshold: 0.05 },
      );
      observer.observe(root);

      window.addEventListener("resize", handleResize);

      /* ── animation loop ────────────────────────────────── */

      const ROTATION_SPEED = 0.15; // radians per second

      const animate = (time: number) => {
        frameId = requestAnimationFrame(animate);
        if (!viewportActive || document.hidden) return;

        const t = time * 0.001; // seconds
        treeGroup.rotation.y = t * ROTATION_SPEED;

        // Subtle sway on the foliage via slight oscillation
        treeGroup.children.forEach((child) => {
          if (
            child instanceof THREE.Mesh &&
            child.geometry instanceof THREE.IcosahedronGeometry
          ) {
            const breathe =
              1.0 + Math.sin(t * 0.8 + child.position.y * 2.0) * 0.03;
            child.scale.setScalar(breathe);
          }
        });

        // Animate birds: orbit around tree + wing flap
        for (const bird of birds) {
          const angle = t * bird.orbitSpeed + bird.phaseOffset;
          const bx = Math.cos(angle) * bird.orbitRadius;
          const bz = Math.sin(angle) * bird.orbitRadius;
          // Gentle vertical bob
          const by = bird.orbitY + Math.sin(t * 0.6 + bird.phaseOffset) * 0.15;

          bird.mesh.position.set(bx, by - 2.0, bz);

          // Face the direction of travel (tangent to orbit)
          const tx = -Math.sin(angle) * Math.sign(bird.orbitSpeed);
          const tz = Math.cos(angle) * Math.sign(bird.orbitSpeed);
          bird.mesh.lookAt(bx + tx, by - 2.0, bz + tz);

          // Wing flap: oscillate wing-tip Y in the buffer
          const flap =
            Math.sin(t * bird.flapSpeed + bird.phaseOffset) * bird.flapAmount;
          const posAttr = bird.mesh.geometry.getAttribute("position");
          // vertex 5 = left wing tip, vertex 8 = right wing tip
          posAttr.setY(5, bird.baseWingLY + flap);
          posAttr.setY(8, bird.baseWingRY + flap);
          posAttr.needsUpdate = true;
        }

        renderer.render(scene, camera);
      };

      frameId = requestAnimationFrame(animate);

      return () => {
        observer.disconnect();
        window.removeEventListener("resize", handleResize);
      };
    };

    let removeListeners: (() => void) | undefined;
    initScene().then((cleanup) => {
      removeListeners = cleanup;
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frameId);
      removeListeners?.();

      for (const d of disposables) d.dispose();

      // Remove the canvas
      const canvas = root.querySelector("canvas");
      if (canvas && canvas.parentNode === root) {
        root.removeChild(canvas);
      }
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
