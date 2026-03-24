import Link from "next/link";
import { FitText } from "@/components/FitText";

export function ContactStrip() {
  return (
    <section id="contact" className="pb-28 pt-24 lg:pb-36">
      <div className="container-shell border-t border-border-subtle">
        <div className="section-divider mb-9" />
        <p className="section-label italic opacity-60 lg:opacity-100 text-xs lg:text-sm">
          ~/get-in-touch
        </p>
        <Link
          href="mailto:helloworld@intrinsiclabs.co"
          className="mt-5 block text-blue-400 transition-colors hover:text-blue-300 underline"
        >
          <FitText as="span" className="font-serif text-4xl normal-case pr-2">
            helloworld@intrinsiclabs.co
          </FitText>
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
            href="https://github.com/intrinsic-labs"
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
