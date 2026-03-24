import type {
  CaseStudyMeta,
  CaseStudyModule,
  CaseStudySlug,
} from "@/content/case-studies/types";

const caseStudyMetaBySlug: Record<CaseStudySlug, CaseStudyMeta> = {
  "aspen-grove": {
    slug: "aspen-grove",
    projectName: "Aspen Grove",
    subtitle: "LLM Interface + Knowledge Tool",
    description:
      "Exploration-first AI interface focused on preserving context, branchable reasoning, and practical model control.",
  },
  "dog-body-mind": {
    slug: "dog-body-mind",
    projectName: "Dog Body Mind",
    subtitle: "Multilingual Fitness Platform",
    description:
      "Client platform focused on conversion and long-term maintainability across multiple locales and service offerings.",
  },
  "church-ops": {
    slug: "church-ops",
    projectName: "Church Ops",
    subtitle: "Check-In + Kiosk Stack",
    description:
      "Operational software for event check-in and on-site flow, designed for reliability in real-world physical environments.",
  },
};

const caseStudyLoaders: Record<CaseStudySlug, () => Promise<CaseStudyModule>> = {
  "aspen-grove": () => import("@/content/case-studies/files/aspen-grove.mdx"),
  "dog-body-mind": () =>
    import("@/content/case-studies/files/dog-body-mind.mdx"),
  "church-ops": () => import("@/content/case-studies/files/church-ops.mdx"),
};

export function isCaseStudySlug(slug: string): slug is CaseStudySlug {
  return slug in caseStudyMetaBySlug;
}

export function getCaseStudyMeta(slug: CaseStudySlug): CaseStudyMeta {
  return caseStudyMetaBySlug[slug];
}

export function getAllCaseStudySlugs(): CaseStudySlug[] {
  return Object.keys(caseStudyMetaBySlug) as CaseStudySlug[];
}

export async function loadCaseStudyModule(
  slug: CaseStudySlug,
): Promise<CaseStudyModule> {
  return caseStudyLoaders[slug]();
}

export function getCaseStudyHref(slug: CaseStudySlug): string {
  return `/case-studies/${slug}`;
}
