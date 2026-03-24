import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";
import type { MDXComponents } from "mdx/types";
import { YouTubeEmbed } from "@/components/mdx/YouTubeEmbed";

function MdxAnchor({ href = "", ...props }: ComponentPropsWithoutRef<"a">) {
  const isExternal = href.startsWith("http://") || href.startsWith("https://");

  if (isExternal) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      />
    );
  }

  return <Link href={href} {...props} />;
}

function MdxImage({ alt = "", ...props }: ComponentPropsWithoutRef<"img">) {
  // Markdown-authored images do not reliably provide dimensions for next/image.
  // eslint-disable-next-line @next/next/no-img-element
  return <img alt={alt} loading="lazy" {...props} />;
}

export const caseStudyMdxComponents: MDXComponents = {
  a: MdxAnchor,
  img: MdxImage,
  YouTubeEmbed,
};
