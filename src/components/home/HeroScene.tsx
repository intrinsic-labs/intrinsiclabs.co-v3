"use client";

import { useEffect, useRef, useState } from "react";

type ThreeModule = typeof import("three");

const ROWS = 95;
const COLUMNS = 150;
const FPS = 30;

export function HeroScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasWebGL, setHasWebGL] = useState<boolean | null>(null);

  useEffect(() => {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("webgl2") || canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    setHasWebGL(Boolean(context));
  }, []);

  useEffect(() => {
    if (hasWebGL !== true || !containerRef.current) return;
    const rootElement = containerRef.current;

    let cancelled = false;
    let frameId = 0;
    let lastFrameTime = 0;
    let viewportActive = true;

    let sceneResources: {
      renderer: import("three").WebGLRenderer;
      geometry: import("three").PlaneGeometry;
      material: import("three").MeshBasicMaterial;
    } | null = null;

    const initScene = async () => {
      const THREE: ThreeModule = await import("three");
      if (cancelled) return;

      const rootStyles = getComputedStyle(document.documentElement);
      const backgroundColor = rootStyles.getPropertyValue("--color-dark-grey").trim();
      const wireColor = rootStyles.getPropertyValue("--color-wire").trim();
      if (!backgroundColor || !wireColor) return;

      const container = rootElement;
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(backgroundColor);

      const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
      camera.position.set(0, 24, 50);
      camera.lookAt(0, 0, 0);

      const renderer = new THREE.WebGLRenderer({
        alpha: false,
        antialias: false,
        powerPreference: "high-performance",
      });

      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.setSize(container.clientWidth, container.clientHeight);
      renderer.setClearColor(backgroundColor, 1);
      container.appendChild(renderer.domElement);

      const geometry = new THREE.PlaneGeometry(170, 110, COLUMNS, ROWS);
      const material = new THREE.MeshBasicMaterial({
        color: wireColor,
        wireframe: true,
        opacity: 0.46,
        transparent: true,
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.rotation.x = -Math.PI / 2.5;
      mesh.position.y = -4;
      scene.add(mesh);

      const positionAttribute = geometry.attributes.position;
      const base = Float32Array.from(positionAttribute.array);

      let targetOffsetX = 0;
      let targetOffsetY = 0;
      let cameraOffsetX = 0;
      let cameraOffsetY = 0;

      const handleMouseMove = (event: MouseEvent) => {
        const normalizedX = event.clientX / window.innerWidth - 0.5;
        const normalizedY = event.clientY / window.innerHeight - 0.5;
        targetOffsetX = normalizedX * 4;
        targetOffsetY = normalizedY * 3;
      };

      const handleResize = () => {
        const width = rootElement.clientWidth;
        const height = rootElement.clientHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
      };

      const observer = new IntersectionObserver(
        (entries) => {
          viewportActive = entries.some((entry) => entry.isIntersecting);
        },
        { threshold: 0.1 }
      );

      observer.observe(container);
      window.addEventListener("mousemove", handleMouseMove, { passive: true });
      window.addEventListener("resize", handleResize);

      const animate = (time: number) => {
        frameId = requestAnimationFrame(animate);

        if (!viewportActive || document.hidden) return;
        if (time - lastFrameTime < 1000 / FPS) return;
        lastFrameTime = time;

        cameraOffsetX += (targetOffsetX - cameraOffsetX) * 0.04;
        cameraOffsetY += (targetOffsetY - cameraOffsetY) * 0.04;
        camera.position.x = cameraOffsetX;
        camera.position.y = 24 + cameraOffsetY;
        camera.lookAt(0, 0, 0);

        for (let index = 0; index < positionAttribute.count; index += 1) {
          const x = base[index * 3];
          const y = base[index * 3 + 1];
          const waveA = Math.sin(time * 0.00035 + x * 0.11 + y * 0.08) * 1.4;
          const waveB = Math.cos(time * 0.0002 + x * 0.04 - y * 0.07) * 1.1;
          positionAttribute.array[index * 3 + 2] = waveA + waveB;
        }

        positionAttribute.needsUpdate = true;
        renderer.render(scene, camera);
      };

      sceneResources = { renderer, geometry, material };
      frameId = requestAnimationFrame(animate);

      return () => {
        observer.disconnect();
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("resize", handleResize);
      };
    };

    let removeEventListeners: (() => void) | undefined;
    initScene().then((cleanup) => {
      removeEventListeners = cleanup;
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frameId);
      removeEventListeners?.();
      if (!sceneResources) return;
      const { renderer, geometry, material } = sceneResources;
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === rootElement) {
        rootElement.removeChild(renderer.domElement);
      }
    };
  }, [hasWebGL]);

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden" aria-hidden="true">
      {hasWebGL === false ? <div className="hero-fallback absolute inset-0" /> : null}
    </div>
  );
}
