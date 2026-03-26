"use client";

import { useState, useRef, useCallback } from "react";
import {
  RetinaCanvas,
  RetinaCanvasHandle,
  TouchMode,
} from "@/components/home/RetinaCanvas";

const MIN_ZOOM = 0.2;
const MAX_ZOOM = 3;
const BLOCKS_COUNT = 10;

function ZoomSlider({
  zoom,
  onZoomChange,
}: {
  zoom: number;
  onZoomChange: (zoom: number) => void;
}) {
  const sliderRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  const normalizedZoom = (zoom - MIN_ZOOM) / (MAX_ZOOM - MIN_ZOOM);
  const filledBlocks = Math.round(normalizedZoom * BLOCKS_COUNT);

  const blocks =
    "▓".repeat(filledBlocks) + "░".repeat(BLOCKS_COUNT - filledBlocks);

  const handleDrag = (clientX: number) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const normalized = Math.max(0, Math.min(1, x / rect.width));
    const newZoom = MIN_ZOOM + normalized * (MAX_ZOOM - MIN_ZOOM);
    onZoomChange(newZoom);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    isDraggingRef.current = true;
    handleDrag(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDraggingRef.current) {
      handleDrag(e.touches[0].clientX);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation();
    isDraggingRef.current = false;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    handleDrag(e.clientX);

    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingRef.current) {
        handleDrag(e.clientX);
      }
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <div
      ref={sliderRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      className="inline-block cursor-ew-resize select-none"
      style={{ touchAction: "none" }}
    >
      <span className="font-mono tracking-tight">{blocks}</span>
    </div>
  );
}

export function HeroSection() {
  const [touchMode, setTouchMode] = useState<TouchMode>("generate");
  const [zoom, setZoom] = useState(1);
  const canvasRef = useRef<RetinaCanvasHandle>(null);

  const toggleTouchMode = () => {
    setTouchMode((prev) => (prev === "generate" ? "rotate" : "generate"));
  };

  const handleZoomChange = useCallback((newZoom: number) => {
    setZoom(newZoom);
    canvasRef.current?.setZoom(newZoom);
  }, []);

  const handleCanvasZoomChange = useCallback((newZoom: number) => {
    setZoom(newZoom);
  }, []);

  return (
    <section className="relative min-h-screen border-b border-border-subtle pt-24">
      {/* Retina canvas background - fills section with vignette fade */}
      <div className="absolute inset-0">
        <RetinaCanvas
          ref={canvasRef}
          className="w-full h-full"
          touchMode={touchMode}
          onZoomChange={handleCanvasZoomChange}
        />
      </div>

      <div className="container-shell pointer-events-none relative z-10 flex min-h-[calc(100vh-6rem)] flex-col justify-end pb-6 lg:pb-20 pt-16">
        <p className="hero-title text-cream-muted lg:whitespace-nowrap">
          {"INTRINSIC LABS"}
        </p>
        <h1 className="hero-heading text-blue-400">
          Asher Pope, Engineer
        </h1>

        {/* Desktop: keyboard shortcuts */}
        <p className="hidden lg:block mt-1 lg:text-sm opacity-60 font-light hover:opacity-85 transition-opacity">
          rotate: [shift + scroll] zoom: [+/-] toggle colors: [c]
        </p>

        {/* Mobile: tappable controls */}
        <div className="md:hidden mt-2 type-xs opacity-60 font-light space-y-1 pointer-events-auto">
          <button
            onClick={toggleTouchMode}
            className="block text-left hover:opacity-85 active:opacity-100 transition-opacity"
          >
            mode: [{touchMode}] tap to switch
          </button>
          <div className="flex items-center gap-2">
            <span>zoom:</span>
            <ZoomSlider zoom={zoom} onZoomChange={handleZoomChange} />
          </div>
          <p className="opacity-75">tap shape to toggle colors</p>
        </div>
      </div>
    </section>
  );
}
