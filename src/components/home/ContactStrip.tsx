import Link from "next/link";

export function ContactStrip() {
  return (
    <section id="contact" className="pb-28 pt-24 md:pb-36">
      <div className="container-shell border-t border-border-subtle">
        <div className="section-divider mb-9" />
        <p className="section-label italic opacity-60 md:opacity-100 text-xs md:text-sm">~/get-in-touch</p>
        <Link
          href="mailto:helloworld@intrinsiclabs.co"
          className="section-title mt-5 inline-block normal-case text-blue-400 transition-colors hover:text-blue-200 underline"
        >
          helloworld@intrinsiclabs.co
        </Link>

        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            href="https://www.linkedin.com/in/asher-pope/"
            target="_blank"
            rel="noopener noreferrer"
            className="mono-chip"
          >
            LinkedIn ↗
          </Link>
          <Link
            href="https://github.com/asherpope"
            target="_blank"
            rel="noopener noreferrer"
            className="mono-chip"
          >
            GitHub ↗
          </Link>
          <span className="mono-chip mono-chip-muted">Resume (soon)</span>
        </div>
      </div>
    </section>
  );
}
