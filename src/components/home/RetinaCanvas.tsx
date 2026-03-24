"use client";

import {
  useEffect,
  useRef,
  useCallback,
  useImperativeHandle,
  forwardRef,
} from "react";

// Helper to resolve CSS variables to actual color values
function getCSSVariableValue(variable: string): string {
  if (typeof window === "undefined") return "#ffffff";
  const value = getComputedStyle(document.documentElement).getPropertyValue(
    variable.replace("var(", "").replace(")", ""),
  );
  return value.trim() || "#ffffff";
}

interface CurveParams {
  R: number;
  r: number;
  d: number;
  xRotation: number;
  yRotation: number;
  allRotation: number;
}

function gcd(a: number, b: number): number {
  a = Math.abs(Math.floor(a));
  b = Math.abs(Math.floor(b));
  while (b !== 0) {
    const temp = b;
    b = a % b;
    a = temp;
  }
  return a || 1;
}

function drawHypotrochoid(
  ctx: CanvasRenderingContext2D,
  params: CurveParams,
  amount: number,
  scale: number,
  centerX: number,
  centerY: number,
  rotationDegrees: number,
) {
  const { R, r, d, xRotation, yRotation } = params;
  const divisor = gcd(R, r);
  const endPoint = Math.ceil((2 * Math.PI * r) / divisor) * amount;

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate((rotationDegrees * Math.PI) / 180);

  ctx.beginPath();
  for (let theta = 0; theta <= endPoint; theta += 0.01) {
    const x =
      ((R - r) * Math.cos(theta) +
        d * Math.cos(((R - r) / r) * theta) * xRotation) *
      scale;
    const y =
      ((R - r) * Math.sin(theta) -
        d * Math.sin(((R - r) / r) * theta) * yRotation) *
      scale;

    if (theta === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.stroke();
  ctx.restore();
}

function drawEpitrochoid(
  ctx: CanvasRenderingContext2D,
  params: CurveParams,
  amount: number,
  scale: number,
  centerX: number,
  centerY: number,
  rotationDegrees: number,
) {
  const { R, r, d, xRotation, yRotation } = params;
  const divisor = gcd(R, r);
  const endPoint = Math.ceil((2 * Math.PI * r) / divisor) * amount;

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate((rotationDegrees * Math.PI) / 180);

  ctx.beginPath();
  for (let theta = 0; theta <= endPoint; theta += 0.01) {
    const x =
      ((R + r) * Math.cos(theta) -
        d * Math.cos(((R + r) / r) * theta) * xRotation) *
      scale;
    const y =
      ((R + r) * Math.sin(theta) -
        d * Math.sin(((R + r) / r) * theta) * yRotation) *
      scale;

    if (theta === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.stroke();
  ctx.restore();
}

function drawHypocycloid(
  ctx: CanvasRenderingContext2D,
  params: CurveParams,
  amount: number,
  scale: number,
  centerX: number,
  centerY: number,
  rotationDegrees: number,
) {
  const { R, r, xRotation, yRotation } = params;
  const divisor = gcd(R, r);
  const endPoint = Math.ceil((2 * Math.PI * r) / divisor) * amount;

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate((rotationDegrees * Math.PI) / 180);

  ctx.beginPath();
  for (let theta = 0; theta <= endPoint; theta += 0.01) {
    const x =
      ((R - r) * Math.cos(theta) +
        r * Math.cos(((R - r) / r) * theta) * xRotation) *
      scale;
    const y =
      ((R - r) * Math.sin(theta) -
        r * Math.sin(((R - r) / r) * theta) * yRotation) *
      scale;

    if (theta === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.stroke();
  ctx.restore();
}

function generateRandomParams(): CurveParams {
  return {
    R: Math.random() * 256,
    r: Math.random() * 256,
    d: Math.random() * 256,
    xRotation: Math.random() * 2 - 1,
    yRotation: Math.random() * 2 - 1,
    allRotation: Math.random() * 360,
  };
}

export type TouchMode = "generate" | "rotate";

export interface RetinaCanvasHandle {
  setZoom: (zoom: number) => void;
  getZoom: () => number;
}

interface RetinaCanvasProps {
  className?: string;
  strokeColor?: string;
  strokeWidth?: number;
  touchMode?: TouchMode;
  onColorModeChange?: (colorMode: boolean) => void;
  onZoomChange?: (zoom: number) => void;
}

export const RetinaCanvas = forwardRef<RetinaCanvasHandle, RetinaCanvasProps>(
  function RetinaCanvas(
    {
      className = "",
      strokeColor = "rgba(255, 255, 255, 0.6)",
      strokeWidth = 0.5,
      touchMode = "generate",
      onColorModeChange,
      onZoomChange,
    },
    ref,
  ) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const paramsRef = useRef<CurveParams>(generateRandomParams());
    const amountRef = useRef(0.05);
    const directionRef = useRef(1);
    const lastMousePosRef = useRef<{ x: number; y: number } | null>(null);
    const lastTouchPosRef = useRef<{ x: number; y: number } | null>(null);
    const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);
    const touchStartTimeRef = useRef<number>(0);
    const animationFrameRef = useRef<number | null>(null);
    const scaleRef = useRef(1);
    const targetScaleRef = useRef(1);
    const zoomAnimationRef = useRef<number | null>(null);
    const colorModeRef = useRef(false);
    const touchModeRef = useRef<TouchMode>(touchMode);
    const drawRef = useRef<() => void>(() => {});

    // Keep touchMode ref in sync
    useEffect(() => {
      touchModeRef.current = touchMode;
    }, [touchMode]);

    const draw = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);

      ctx.clearRect(0, 0, rect.width, rect.height);

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const baseScale = Math.min(rect.width, rect.height) / 600;
      const scale = baseScale * scaleRef.current;
      console.log(
        "[zoom:draw] baseScale:",
        baseScale,
        "scaleRef:",
        scaleRef.current,
        "final scale:",
        scale,
      );

      const params = paramsRef.current;
      const amount = amountRef.current;

      ctx.lineWidth = strokeWidth;

      const curveColors = colorModeRef.current
        ? {
            hypotrochoid: getCSSVariableValue("--color-copper"),
            epitrochoid: getCSSVariableValue("--color-cream"),
            hypocycloid: getCSSVariableValue("--color-blue-400"),
          }
        : null;

      ctx.strokeStyle = curveColors ? curveColors.hypotrochoid : strokeColor;
      drawHypotrochoid(
        ctx,
        params,
        amount,
        scale,
        centerX,
        centerY,
        params.allRotation * 1.25,
      );

      ctx.strokeStyle = curveColors ? curveColors.epitrochoid : strokeColor;
      drawEpitrochoid(
        ctx,
        params,
        amount,
        scale,
        centerX,
        centerY,
        params.allRotation * 0.5,
      );

      ctx.strokeStyle = curveColors ? curveColors.hypocycloid : strokeColor;
      drawHypocycloid(
        ctx,
        params,
        amount,
        scale,
        centerX,
        centerY,
        params.allRotation * 0.25,
      );
    }, [strokeColor, strokeWidth]);

    // Keep drawRef in sync
    useEffect(() => {
      drawRef.current = draw;
    }, [draw]);

    // Zoom animation using ref for recursive calls
    const animateZoomRef = useRef<() => void>(() => {});

    useEffect(() => {
      animateZoomRef.current = () => {
        const diff = targetScaleRef.current - scaleRef.current;
        console.log(
          "[zoom:animateZoom] tick — target:",
          targetScaleRef.current,
          "current:",
          scaleRef.current,
          "diff:",
          diff,
        );
        if (Math.abs(diff) > 0.001) {
          scaleRef.current += diff * 0.15;
          drawRef.current();
          zoomAnimationRef.current = requestAnimationFrame(() =>
            animateZoomRef.current(),
          );
        } else {
          scaleRef.current = targetScaleRef.current;
          drawRef.current();
          zoomAnimationRef.current = null;
          console.log(
            "[zoom:animateZoom] animation complete, scale settled at:",
            scaleRef.current,
          );
        }
      };
    }, []);

    const startZoomAnimation = useCallback(() => {
      console.log(
        "[zoom:startZoomAnimation] called, existing rAF id:",
        zoomAnimationRef.current,
        "target:",
        targetScaleRef.current,
        "current:",
        scaleRef.current,
      );
      if (zoomAnimationRef.current) {
        cancelAnimationFrame(zoomAnimationRef.current);
        console.log(
          "[zoom:startZoomAnimation] cancelled existing rAF:",
          zoomAnimationRef.current,
        );
      }
      zoomAnimationRef.current = requestAnimationFrame(() =>
        animateZoomRef.current(),
      );
      console.log(
        "[zoom:startZoomAnimation] scheduled rAF:",
        zoomAnimationRef.current,
      );
    }, []);

    // Expose imperative handle for zoom control
    useImperativeHandle(
      ref,
      () => ({
        setZoom: (zoom: number) => {
          console.log(
            "[zoom:setZoom imperative] called with:",
            zoom,
            "current scale:",
            scaleRef.current,
          );
          const clamped = Math.max(0.2, Math.min(5, zoom));
          targetScaleRef.current = clamped;
          console.log("[zoom:setZoom imperative] targetScale set to:", clamped);
          startZoomAnimation();
        },
        getZoom: () => scaleRef.current,
      }),
      [startZoomAnimation],
    );

    // Initialize on mount
    useEffect(() => {
      paramsRef.current = generateRandomParams();
      amountRef.current = 0.05;
      draw();
    }, [draw]);

    // Event handlers
    useEffect(() => {
      const handleMouseMove = (e: MouseEvent) => {
        if (lastMousePosRef.current) {
          const dx = e.clientX - lastMousePosRef.current.x;
          const dy = e.clientY - lastMousePosRef.current.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          const delta = distance * 0.0002 * directionRef.current;
          amountRef.current = amountRef.current + delta;

          if (amountRef.current >= 1) {
            amountRef.current = 1;
            directionRef.current = -1;
          } else if (amountRef.current <= 0) {
            paramsRef.current = generateRandomParams();
            amountRef.current = 0;
            directionRef.current = 1;
          }

          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
          }
          animationFrameRef.current = requestAnimationFrame(draw);
        }

        lastMousePosRef.current = { x: e.clientX, y: e.clientY };
      };

      const handleResize = () => {
        draw();
      };

      const handleTouchStart = (e: TouchEvent) => {
        if (e.touches.length === 1) {
          const touch = e.touches[0];
          touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };
          lastTouchPosRef.current = { x: touch.clientX, y: touch.clientY };
          touchStartTimeRef.current = Date.now();
        }
      };

      const handleTouchMove = (e: TouchEvent) => {
        if (e.touches.length === 1 && lastTouchPosRef.current) {
          const touch = e.touches[0];
          const dx = touch.clientX - lastTouchPosRef.current.x;

          if (touchModeRef.current === "generate") {
            const delta = dx * 0.002 * directionRef.current;
            amountRef.current = amountRef.current + delta;

            if (amountRef.current >= 1) {
              amountRef.current = 1;
              directionRef.current = -1;
            } else if (amountRef.current <= 0) {
              paramsRef.current = generateRandomParams();
              amountRef.current = 0;
              directionRef.current = 1;
            }
          } else {
            const rotationSpeed = 0.003;
            let newXRotation = paramsRef.current.xRotation + dx * rotationSpeed;

            if (newXRotation > 1) newXRotation = -1 + (newXRotation - 1);
            if (newXRotation < -1) newXRotation = 1 + (newXRotation + 1);

            paramsRef.current.xRotation = newXRotation;
          }

          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
          }
          animationFrameRef.current = requestAnimationFrame(draw);

          lastTouchPosRef.current = { x: touch.clientX, y: touch.clientY };
        }
      };

      const handleTouchEnd = () => {
        const touchDuration = Date.now() - touchStartTimeRef.current;
        const startPos = touchStartPosRef.current;
        const endPos = lastTouchPosRef.current;

        if (startPos && endPos && touchDuration < 300) {
          const dx = Math.abs(endPos.x - startPos.x);
          const dy = Math.abs(endPos.y - startPos.y);

          if (dx < 10 && dy < 10) {
            colorModeRef.current = !colorModeRef.current;
            onColorModeChange?.(colorModeRef.current);
            draw();
          }
        }

        lastTouchPosRef.current = null;
        touchStartPosRef.current = null;
      };

      const handleWheel = (e: WheelEvent) => {
        if (e.shiftKey) {
          e.preventDefault();

          const rotationSpeed = 0.002;

          let newXRotation =
            paramsRef.current.xRotation + e.deltaY * rotationSpeed;
          let newYRotation =
            paramsRef.current.yRotation + e.deltaX * rotationSpeed;

          if (newXRotation > 1) newXRotation = -1 + (newXRotation - 1);
          if (newXRotation < -1) newXRotation = 1 + (newXRotation + 1);
          if (newYRotation > 1) newYRotation = -1 + (newYRotation - 1);
          if (newYRotation < -1) newYRotation = 1 + (newYRotation + 1);

          paramsRef.current.xRotation = newXRotation;
          paramsRef.current.yRotation = newYRotation;

          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
          }
          animationFrameRef.current = requestAnimationFrame(draw);
        }
      };

      const handleKeyDown = (e: KeyboardEvent) => {
        console.log(
          "[zoom:keydown] key:",
          e.key,
          "meta:",
          e.metaKey,
          "ctrl:",
          e.ctrlKey,
          "alt:",
          e.altKey,
        );
        if (e.metaKey || e.ctrlKey || e.altKey) return;

        const zoomSpeed = 0.2;
        const minScale = 0.2;
        const maxScale = 5;

        if (e.key === "=" || e.key === "+") {
          e.preventDefault();
          const newZoom = Math.min(
            maxScale,
            targetScaleRef.current + zoomSpeed,
          );
          console.log(
            "[zoom:keydown +] targetScale before:",
            targetScaleRef.current,
            "newZoom:",
            newZoom,
          );
          targetScaleRef.current = newZoom;
          onZoomChange?.(newZoom);
          startZoomAnimation();
        } else if (e.key === "-" || e.key === "_") {
          e.preventDefault();
          const newZoom = Math.max(
            minScale,
            targetScaleRef.current - zoomSpeed,
          );
          console.log(
            "[zoom:keydown -] targetScale before:",
            targetScaleRef.current,
            "newZoom:",
            newZoom,
          );
          targetScaleRef.current = newZoom;
          onZoomChange?.(newZoom);
          startZoomAnimation();
        } else if (e.key === "c" || e.key === "C") {
          colorModeRef.current = !colorModeRef.current;
          onColorModeChange?.(colorModeRef.current);
          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
          }
          animationFrameRef.current = requestAnimationFrame(draw);
        }
      };

      const canvas = canvasRef.current;

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("resize", handleResize);
      window.addEventListener("wheel", handleWheel, { passive: false });
      window.addEventListener("keydown", handleKeyDown);

      canvas?.addEventListener("touchstart", handleTouchStart);
      canvas?.addEventListener("touchmove", handleTouchMove);
      canvas?.addEventListener("touchend", handleTouchEnd);

      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("resize", handleResize);
        window.removeEventListener("wheel", handleWheel);
        window.removeEventListener("keydown", handleKeyDown);
        canvas?.removeEventListener("touchstart", handleTouchStart);
        canvas?.removeEventListener("touchmove", handleTouchMove);
        canvas?.removeEventListener("touchend", handleTouchEnd);
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        if (zoomAnimationRef.current) {
          cancelAnimationFrame(zoomAnimationRef.current);
        }
      };
    }, [draw, onColorModeChange, onZoomChange, startZoomAnimation]);

    return (
      <canvas
        ref={canvasRef}
        className={className}
        style={{ width: "100%", height: "100%" }}
      />
    );
  },
);
