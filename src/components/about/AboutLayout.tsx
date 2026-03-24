import Link from "next/link";
import type { ReactNode } from "react";

type AboutLayoutProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

export function AboutLayout({ title, subtitle, children }: AboutLayoutProps) {
  return (
    <section className="section-spacing pb-[clamp(5rem,8vw,8rem)]">
      <div className="container-shell">
        <header className="border-b border-border-subtle pb-6">
          <p className="mono-label type-xs text-copper text-center border border-copper rounded-full flex justify-center w-fit mx-auto px-3 py-1">
            About
          </p>
          <h1 className="mt-3 font-mono type-3xl md:type-5xl type-tracking-tight type-leading-snug py-2 md:py-0 text-cream text-center">
            {title}
          </h1>
          <p className="mt-3 type-sm text-blue-400 text-center">{subtitle}</p>

          <Link
            href="/#about"
            className="mt-12 block text-center mono-label type-xs text-cream-muted transition-colors hover:text-cream"
          >
            ← Back To Home
          </Link>
        </header>

        <div className="mt-10">{children}</div>

        <div className="border-t border-border-subtle mt-16" />
        <Link
          href="/#about"
          className="mt-12 block text-center mono-label type-xs text-cream-muted transition-colors hover:text-cream"
        >
          ← Back To Home
        </Link>
      </div>
    </section>
  );
}
