import type {
  CaseStudyMeta,
  CaseStudyModule,
  CaseStudySlug,
} from "@/content/case-studies/types";
import { homeProjects } from "@/content/home";

const caseStudyMetaBySlug: Record<CaseStudySlug, CaseStudyMeta> =
  homeProjects.reduce(
    (acc, project) => {
      if (project.caseStudySlug) {
        const slug = project.caseStudySlug as CaseStudySlug;
        acc[slug] = {
          slug,
          projectName: project.name,
          subtitle: project.subtitle,
          description: project.summary,
        };
      }
      return acc;
    },
    {} as Record<CaseStudySlug, CaseStudyMeta>,
  );

const caseStudyLoaders: Record<CaseStudySlug, () => Promise<CaseStudyModule>> =
  {
    "aspen-grove": () => import("@/content/case-studies/files/aspen-grove.mdx"),
    "dog-body-mind": () =>
      import("@/content/case-studies/files/dog-body-mind.mdx"),
    "church-ops": () => import("@/content/case-studies/files/church-ops.mdx"),
    gfbr: () => import("@/content/case-studies/files/gfbr.mdx"),
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
