import type { MDXProps } from "mdx/types";
import type { ReactElement } from "react";

import { homeProjects } from "@/content/home";

/** Derived from the single source of truth in home.ts */
export type CaseStudySlug = NonNullable<
  (typeof homeProjects)[number]["caseStudySlug"]
>;

export type CaseStudyMeta = {
  slug: CaseStudySlug;
  projectName: string;
  subtitle: string;
  description: string;
};

type MdxContentComponent = (props: MDXProps) => ReactElement;

export type CaseStudyModule = {
  default: MdxContentComponent;
};
