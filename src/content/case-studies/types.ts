import type { MDXProps } from "mdx/types";
import type { ReactElement } from "react";

export type CaseStudySlug = "aspen-grove" | "dog-body-mind" | "church-ops";

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
