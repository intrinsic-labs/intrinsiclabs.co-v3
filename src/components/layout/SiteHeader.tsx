"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const navItems = [
  { href: "#projects", label: "Projects" },
  { href: "#about", label: "About" },
  { href: "#contact", label: "Contact" },
];

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-border-subtle bg-dark-grey/75 backdrop-blur-xl"
          : "bg-transparent"
      }`}
    >
      <div className="container-shell flex items-center justify-between py-4">
        <Link
          href="/"
          className="logo-text type-sm text-cream"
          onClick={() => setMobileMenuOpen(false)}
        >
          {scrolled ? "IL" : "INTRINSIC LABS"}
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="mono-label type-xs text-cream-muted transition-colors hover:text-cream"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="https://github.com/asherpope"
            target="_blank"
            rel="noopener noreferrer"
            className="mono-label type-xs text-cream-muted transition-colors hover:text-cream"
          >
            GitHub ↗
          </Link>
        </nav>

        <button
          type="button"
          aria-label="Toggle menu"
          className="mono-label type-xs text-cream lg:hidden"
          onClick={() => setMobileMenuOpen((open) => !open)}
        >
          {mobileMenuOpen ? "Close" : "Menu"}
        </button>
      </div>

      <div
        className={`lg:hidden transition-all duration-300 overflow-hidden border-t border-transparent ${
          mobileMenuOpen
            ? "max-h-80 border-border-subtle bg-dark-grey/95 backdrop-blur-xl"
            : "max-h-0"
        }`}
      >
        <nav className="container-shell flex flex-col gap-5 py-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="mono-label type-sm text-cream"
              onClick={() => setMobileMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="https://github.com/asherpope"
            target="_blank"
            rel="noopener noreferrer"
            className="mono-label type-sm text-cream-muted"
            onClick={() => setMobileMenuOpen(false)}
          >
            GitHub ↗
          </Link>
        </nav>
      </div>
    </header>
  );
}
