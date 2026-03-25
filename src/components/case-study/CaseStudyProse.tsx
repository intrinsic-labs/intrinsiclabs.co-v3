import type { ReactNode } from "react";

type CaseStudyProseProps = {
  children: ReactNode;
};

export function CaseStudyProse({ children }: CaseStudyProseProps) {
  return <article className="case-study-prose font-inter mx-auto type-leading-snug">{children}</article>;
}
