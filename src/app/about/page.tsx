import type { Metadata } from "next";
import { AboutLayout } from "@/components/about/AboutLayout";
import { CaseStudyProse } from "@/components/case-study/CaseStudyProse";
import Content from "@/content/about.mdx";

export const metadata: Metadata = {
  title: "About | Intrinsic Labs",
  description:
    "Learn more about the developer and designer behind Intrinsic Labs.",
};

export default function AboutPage() {
  return (
    <AboutLayout title="Asher Pope" subtitle="Developer · Designer · Builder">
      <CaseStudyProse>
        <Content />
      </CaseStudyProse>
    </AboutLayout>
  );
}
