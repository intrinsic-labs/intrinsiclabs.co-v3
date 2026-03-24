import Link from "next/link";

const navItems = [
  { href: "/#projects", label: "Projects" },
  { href: "/about", label: "About" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border-subtle">
      <div className="container-shell flex flex-col gap-6 py-10 lg:flex-row lg:items-center lg:justify-between">
        <Link href="/" className="logo-text type-sm text-cream">
          INTRINSIC LABS
        </Link>

        <nav className="flex flex-wrap items-center gap-6">
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
      </div>
    </footer>
  );
}
