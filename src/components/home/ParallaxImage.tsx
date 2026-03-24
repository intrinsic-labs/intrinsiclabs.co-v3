"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

type ParallaxImageProps = {
  src: string;
  alt?: string;
  /** 0 = fixed in place, 1 = scrolls normally. 0.3–0.5 feels nicely "deep". */
  speed?: number;
  className?: string;
  priority?: boolean;
};

export function ParallaxImage({
  src,
  alt = "",
  speed = 1.0,
  className,
  priority = false,
}: ParallaxImageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLDivElement>(null);
  const rafId = useRef<number>(0);
  const isVisible = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    const img = imgRef.current;
    if (!container || !img) return;

    // Only run parallax while the section is in (or near) the viewport
    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible.current = entry.isIntersecting;
      },
      { rootMargin: "200px 0px" },
    );
    observer.observe(container);

    function onScroll() {
      if (!isVisible.current || !container || !img) return;

      // How far the element's top is from the viewport center
      const rect = container.getBoundingClientRect();
      const offset = rect.top;

      // Shift the image opposite to scroll direction, scaled by speed
      const y = offset * speed;
      img.style.transform = `translate3d(0, ${y}px, 0)`;
    }

    function loop() {
      onScroll();
      rafId.current = requestAnimationFrame(loop);
    }

    rafId.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId.current);
      observer.disconnect();
    };
  }, [speed]);

  return (
    <div ref={containerRef} className="absolute inset-0 -z-20 overflow-hidden">
      {/* Extra height + centering so parallax shift never reveals edges */}
      <div
        ref={imgRef}
        className="absolute inset-0 will-change-transform"
        style={{ top: "-20%", bottom: "-20%", height: "140%" }}
      >
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          sizes="100vw"
          className={className ?? "object-cover"}
        />
      </div>
    </div>
  );
}
