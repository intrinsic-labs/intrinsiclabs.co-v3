import Link from "next/link";
import type { HomeProject } from "@/content/home";

type ProjectCardProps = {
  project: HomeProject;
};

export function ProjectCard({ project }: ProjectCardProps) {
  const statusColor =
    project.status === "Live" ? "text-status-live" : "text-status-progress";

  return (
    <article className="glass-panel relative overflow-hidden border  border-white p-12  text-cream">
      <div className="relative z-10">
        <div className="flex items-center justify-between gap-4 border-b border-border-subtle pb-4">
          <span className="mono-label type-xs text-cream-muted">
            PROJECT_ID: {project.id}
          </span>
          <span className={`mono-label type-xs ${statusColor}`}>
            STATUS: {project.status.toUpperCase()}
          </span>
        </div>

        <div className="mt-5 space-y-2">
          <h3 className="font-mono type-xl type-tracking-wider font-light uppercase text-cream">
            {project.name}
          </h3>
          <p className="type-sm text-cream-muted">{project.subtitle}</p>
        </div>

        <p className="mt-6 type-sm type-leading-relaxed text-cream">
          {project.summary}
        </p>

        <ul className="mt-6 flex flex-wrap gap-2">
          {project.stack.map((item) => (
            <li
              key={item}
              className="mono-label rounded-full border border-border-visible px-2 py-1 type-2xs text-cream-muted"
            >
              {item}
            </li>
          ))}
        </ul>

        <div className="mt-8">
          {project.href ? (
            <Link
              href={project.href}
              className="mono-label type-xs text-copper transition-colors hover:text-copper-deep"
            >
              VIEW CASE STUDY →
            </Link>
          ) : (
            <span className="mono-label type-xs text-ink-dim">
              CASE STUDY IN PROGRESS
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
