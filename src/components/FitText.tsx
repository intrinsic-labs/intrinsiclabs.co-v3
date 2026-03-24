"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  type ElementType,
  type ReactNode,
} from "react";

type FitTextProps = {
  /** The HTML element to render (default: "span") */
  as?: ElementType;
  children: ReactNode;
  className?: string;
  /** Minimum font size in px before giving up (default: 10) */
  minSize?: number;
};

/**
 * Renders an inline element whose font-size shrinks until the text
 * fits on a single line without overflowing its container.
 *
 * Set the *maximum* size via className (e.g. `text-4xl`) — FitText
 * will only ever shrink from that starting point, never grow.
 */
export function FitText({
  as: Tag = "span",
  children,
  className,
  minSize = 10,
}: FitTextProps) {
  const ref = useRef<HTMLElement>(null);

  const fit = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    // Reset to stylesheet size so we always start from the max
    el.style.fontSize = "";
    let size = parseFloat(getComputedStyle(el).fontSize);
    // Shrink until the text no longer overflows horizontally
    while (el.scrollWidth > el.clientWidth + 1 && size > minSize) {
      size -= 0.5;
      el.style.fontSize = `${size}px`;
    }
  }, [minSize]);

  // Fit after every render (children / layout may change)
  useLayoutEffect(() => {
    fit();
  }, [children, fit]);

  // Also re-fit on window resize
  useEffect(() => {
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [fit]);

  return (
    <Tag
      ref={ref}
      className={className}
      style={{ whiteSpace: "nowrap", overflow: "hidden", display: "block" }}
    >
      {children}
    </Tag>
  );
}
