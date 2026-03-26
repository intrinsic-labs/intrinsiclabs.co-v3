import type { MDXProps } from "mdx/types";
import type { ReactElement } from "react";
import type { ViewportSceneId } from "@/components/shared/sceneRegistry";

/**
 * Shared scene identifiers used by both the home carousel and case-study pages.
 * Sourced from the centralized scene registry.
 */
export type { ViewportSceneId };

/**
 * Shared project status labels.
 */
export type HomeProjectStatus = "Live" | "In Progress";

/**
 * Canonical project shape used by the home carousel.
 * Derived from case-study frontmatter records.
 */
export type HomeProject = {
  id: string;
  status: HomeProjectStatus;
  name: string;
  subtitle: string;
  stack: string[];
  summary: string;
  caseStudySlug: string;
  viewportScene?: ViewportSceneId;
};

export type CaseStudySlug = string;

/**
 * Frontmatter contract expected in each case-study MDX file.
 * This is the source-of-truth for project metadata.
 */
export type CaseStudyFrontmatter = {
  slug: CaseStudySlug;
  id: string;
  status: HomeProjectStatus;
  name: string;
  subtitle: string;
  stack: string[];
  summary: string;
  description?: string;
  viewportScene?: ViewportSceneId;
  featuredOnHome?: boolean;
  order?: number;
};

export type CaseStudyMeta = {
  slug: CaseStudySlug;
  projectName: string;
  subtitle: string;
  description: string;
};

type MdxContentComponent = (props: MDXProps) => ReactElement;

export type CaseStudyModule = {
  default: MdxContentComponent;
  frontmatter?: Partial<CaseStudyFrontmatter>;
};
