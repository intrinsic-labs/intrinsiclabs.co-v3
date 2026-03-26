import "server-only";

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type {
  CaseStudyFrontmatter,
  CaseStudyMeta,
  CaseStudyModule,
  CaseStudySlug,
  HomeProject,
  HomeProjectStatus,
} from "@/content/case-studies/types";
import type { ViewportSceneId } from "@/components/shared/sceneRegistry";
import { isViewportSceneId } from "@/components/shared/sceneRegistry";

type CaseStudyRecord = {
  slug: CaseStudySlug;
  frontmatter: CaseStudyFrontmatter;
};

type FrontmatterContext = {
  fileName: string;
  slugFromFileName: string;
};

const CASE_STUDIES_DIR = path.join(
  process.cwd(),
  "src",
  "content",
  "case-studies",
  "files",
);

function keyToSlug(fileName: string): CaseStudySlug {
  return fileName.replace(/\.mdx$/i, "");
}

function parseNumericId(id: string): number {
  const parsed = Number(id);
  return Number.isFinite(parsed) ? parsed : Number.MAX_SAFE_INTEGER;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function describeValue(value: unknown): string {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (Array.isArray(value)) return `array(${value.length})`;
  return `${typeof value}: ${JSON.stringify(value)}`;
}

function frontmatterFieldError(
  ctx: FrontmatterContext,
  field: string,
  message: string,
  value?: unknown,
): Error {
  const suffix =
    arguments.length >= 4 ? ` Received ${describeValue(value)}.` : ".";
  return new Error(
    `[case-studies] Invalid frontmatter in "${ctx.fileName}" for field "${field}": ${message}${suffix}`,
  );
}

function parseRequiredString(
  raw: Record<string, unknown>,
  field: string,
  ctx: FrontmatterContext,
): string {
  const value = raw[field];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw frontmatterFieldError(
      ctx,
      field,
      "Expected a non-empty string",
      value,
    );
  }
  return value.trim();
}

function parseOptionalString(
  raw: Record<string, unknown>,
  field: string,
  ctx: FrontmatterContext,
): string | undefined {
  const value = raw[field];
  if (value == null) return undefined;
  if (typeof value !== "string") {
    throw frontmatterFieldError(ctx, field, "Expected a string", value);
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function parseRequiredStringArray(
  raw: Record<string, unknown>,
  field: string,
  ctx: FrontmatterContext,
): string[] {
  const value = raw[field];
  if (!Array.isArray(value)) {
    throw frontmatterFieldError(ctx, field, "Expected a string[]", value);
  }

  const invalidIndex = value.findIndex(
    (item) => typeof item !== "string" || item.trim().length === 0,
  );
  if (invalidIndex >= 0) {
    throw frontmatterFieldError(
      ctx,
      `${field}[${invalidIndex}]`,
      "Expected a non-empty string item",
      value[invalidIndex],
    );
  }

  return value.map((item) => (item as string).trim());
}

function parseRequiredStatus(
  raw: Record<string, unknown>,
  field: string,
  ctx: FrontmatterContext,
): HomeProjectStatus {
  const value = raw[field];
  if (value === "Live" || value === "In Progress") {
    return value;
  }
  throw frontmatterFieldError(
    ctx,
    field,
    'Expected "Live" or "In Progress"',
    value,
  );
}

function parseOptionalViewportScene(
  raw: Record<string, unknown>,
  field: string,
  ctx: FrontmatterContext,
): ViewportSceneId | undefined {
  const value = raw[field];
  if (value == null) return undefined;
  if (!isViewportSceneId(value)) {
    throw frontmatterFieldError(
      ctx,
      field,
      "Expected a valid viewport scene id",
      value,
    );
  }
  return value;
}

function parseOptionalBoolean(
  raw: Record<string, unknown>,
  field: string,
  defaultValue: boolean,
  ctx: FrontmatterContext,
): boolean {
  const value = raw[field];
  if (value == null) return defaultValue;
  if (typeof value !== "boolean") {
    throw frontmatterFieldError(ctx, field, "Expected a boolean", value);
  }
  return value;
}

function parseOptionalFiniteNumber(
  raw: Record<string, unknown>,
  field: string,
  ctx: FrontmatterContext,
): number | undefined {
  const value = raw[field];
  if (value == null) return undefined;
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw frontmatterFieldError(ctx, field, "Expected a finite number", value);
  }
  return value;
}

function parseFrontmatter(
  raw: unknown,
  ctx: FrontmatterContext,
): CaseStudyFrontmatter {
  if (!isRecord(raw)) {
    throw new Error(
      `[case-studies] Invalid frontmatter in "${ctx.fileName}": expected a YAML object.`,
    );
  }

  const explicitSlug = parseOptionalString(raw, "slug", ctx);
  const slug = explicitSlug ?? ctx.slugFromFileName;
  if (slug !== ctx.slugFromFileName) {
    throw new Error(
      `[case-studies] Slug mismatch in "${ctx.fileName}": frontmatter slug "${slug}" must match filename slug "${ctx.slugFromFileName}".`,
    );
  }

  const id = parseRequiredString(raw, "id", ctx);
  const name = parseRequiredString(raw, "name", ctx);
  const subtitle = parseRequiredString(raw, "subtitle", ctx);
  const summary = parseRequiredString(raw, "summary", ctx);
  const stack = parseRequiredStringArray(raw, "stack", ctx);
  const status = parseRequiredStatus(raw, "status", ctx);
  const viewportScene = parseOptionalViewportScene(raw, "viewportScene", ctx);

  const description = parseOptionalString(raw, "description", ctx) ?? summary;
  const featuredOnHome = parseOptionalBoolean(raw, "featuredOnHome", true, ctx);
  const order = parseOptionalFiniteNumber(raw, "order", ctx);

  return {
    slug,
    id,
    status,
    name,
    subtitle,
    stack,
    summary,
    description,
    viewportScene,
    featuredOnHome,
    order,
  };
}

function discoverCaseStudyRecords(): CaseStudyRecord[] {
  if (!fs.existsSync(CASE_STUDIES_DIR)) {
    throw new Error(
      `[case-studies] Case studies directory not found: ${CASE_STUDIES_DIR}`,
    );
  }

  const fileNames = fs
    .readdirSync(CASE_STUDIES_DIR)
    .filter((name) => name.toLowerCase().endsWith(".mdx"))
    .sort();

  const seenSlugs = new Set<string>();

  return fileNames.map((fileName) => {
    const slugFromFileName = keyToSlug(fileName);
    const absolutePath = path.join(CASE_STUDIES_DIR, fileName);
    const source = fs.readFileSync(absolutePath, "utf8");
    const parsed = matter(source);

    const frontmatter = parseFrontmatter(parsed.data, {
      fileName,
      slugFromFileName,
    });

    if (seenSlugs.has(frontmatter.slug)) {
      throw new Error(
        `[case-studies] Duplicate case study slug "${frontmatter.slug}" found in "${fileName}".`,
      );
    }
    seenSlugs.add(frontmatter.slug);

    return {
      slug: frontmatter.slug,
      frontmatter,
    };
  });
}

const caseStudyRecords = discoverCaseStudyRecords();

const frontmatterBySlug: Record<CaseStudySlug, CaseStudyFrontmatter> =
  Object.fromEntries(
    caseStudyRecords.map((record) => [record.slug, record.frontmatter]),
  );

const caseStudyMetaBySlug: Record<CaseStudySlug, CaseStudyMeta> =
  Object.fromEntries(
    Object.values(frontmatterBySlug).map((fm) => [
      fm.slug,
      {
        slug: fm.slug,
        projectName: fm.name,
        subtitle: fm.subtitle,
        description: fm.description ?? fm.summary,
      },
    ]),
  );

const recordBySlug: Record<CaseStudySlug, CaseStudyRecord> = Object.fromEntries(
  caseStudyRecords.map((record) => [record.slug, record]),
);

export const homeProjects: readonly HomeProject[] = Object.values(
  frontmatterBySlug,
)
  .filter((fm) => fm.featuredOnHome !== false)
  .sort((a, b) => {
    const aOrder = a.order ?? Number.MAX_SAFE_INTEGER;
    const bOrder = b.order ?? Number.MAX_SAFE_INTEGER;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return parseNumericId(a.id) - parseNumericId(b.id);
  })
  .map((fm) => ({
    id: fm.id,
    status: fm.status,
    name: fm.name,
    subtitle: fm.subtitle,
    stack: fm.stack,
    summary: fm.summary,
    caseStudySlug: fm.slug,
    viewportScene: fm.viewportScene,
  }));

export function getHomeProjects(): readonly HomeProject[] {
  return homeProjects;
}

export function isCaseStudySlug(slug: string): slug is CaseStudySlug {
  return slug in caseStudyMetaBySlug;
}

export function getCaseStudyMeta(slug: CaseStudySlug): CaseStudyMeta {
  return caseStudyMetaBySlug[slug];
}

export function getSceneForSlug(slug: string): ViewportSceneId | undefined {
  return frontmatterBySlug[slug]?.viewportScene;
}

export function getAllCaseStudySlugs(): CaseStudySlug[] {
  return Object.keys(caseStudyMetaBySlug);
}

export async function loadCaseStudyModule(
  slug: CaseStudySlug,
): Promise<CaseStudyModule> {
  const record = recordBySlug[slug];
  if (!record) {
    throw new Error(`[case-studies] Unknown case study slug "${slug}".`);
  }

  return (await import(
    `@/content/case-studies/files/${record.slug}.mdx`
  )) as CaseStudyModule;
}

export function getCaseStudyHref(slug: string): string {
  return `/case-studies/${slug}`;
}
