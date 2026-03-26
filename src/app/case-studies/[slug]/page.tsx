import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CaseStudyLayout } from "@/components/case-study/CaseStudyLayout";
import { CaseStudyProse } from "@/components/case-study/CaseStudyProse";
import {
  getAllCaseStudySlugs,
  getCaseStudyMeta,
  getSceneForSlug,
  isCaseStudySlug,
  loadCaseStudyModule,
} from "@/content/case-studies/registry";

type CaseStudyPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getAllCaseStudySlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: CaseStudyPageProps): Promise<Metadata> {
  const { slug } = await params;

  if (!isCaseStudySlug(slug)) {
    return {
      title: "Case Study Not Found | Intrinsic Labs",
    };
  }

  const caseStudy = getCaseStudyMeta(slug);

  return {
    title: `${caseStudy.projectName} Case Study | Intrinsic Labs`,
    description: caseStudy.description,
  };
}

export default async function CaseStudyPage({ params }: CaseStudyPageProps) {
  const { slug } = await params;

  if (!isCaseStudySlug(slug)) {
    notFound();
  }

  const caseStudy = getCaseStudyMeta(slug);
  const scene = getSceneForSlug(slug);
  const caseStudyModule = await loadCaseStudyModule(slug);
  const Content = caseStudyModule.default;

  return (
    <CaseStudyLayout
      projectName={caseStudy.projectName}
      subtitle={caseStudy.subtitle}
      slug={slug}
      scene={scene}
    >
      <CaseStudyProse>
        <Content />
      </CaseStudyProse>
    </CaseStudyLayout>
  );
}
