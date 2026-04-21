import "server-only";
import type { Block, ActivityEvent } from "@/types/blocks";
import type { TiptapNode } from "@/lib/supabase/content";
import { parseStoredContent } from "@/lib/supabase/content";
import { listArticles, getArticleBySlug, type BaseArticleRow } from "@/lib/db/articles";

// ── 타입 ─────────────────────────────────────────────────────────────────

export type { ActivityEvent };

export type PortfolioItem = {
  id: string;
  displayId: string;
  title: string;
  category: string;
  description: string;
  thumbnail: string;
  image: string;
  tags: string[];
  period?: string;
  client?: string;
  role?: string;
  blocks?: Block[] | TiptapNode;
  summary?: string;
  highlights?: string[];
  deliverables?: string[];
  stack?: string[];
  activity?: ActivityEvent[];
};

// ── DB 쿼리 ───────────────────────────────────────────────────────────────

export type PortfolioMetadata = {
  tags?: string[];
  image?: string;
  thumbnail?: string;
  period?: string;
  client?: string;
  role?: string;
  stack?: string[];
  subcategory?: string;
  legacy_id?: string;
};

type ArticleRow = BaseArticleRow<PortfolioMetadata>;

function mapArticleToPortfolio(row: ArticleRow): PortfolioItem {
  const meta = row.metadata ?? {};
  const order = (row.sort_order ?? 0) + 1;
  const { legacyBlocks, combined: blocks } = parseStoredContent(row.content);

  const summaryBlock = legacyBlocks.find((b) => b.type === "summary") as
    | Extract<Block, { type: "summary" }> | undefined;
  const highlightsBlock = legacyBlocks.find((b) => b.type === "highlights") as
    | Extract<Block, { type: "highlights" }> | undefined;
  const deliverablesBlock = legacyBlocks.find((b) => b.type === "deliverables") as
    | Extract<Block, { type: "deliverables" }> | undefined;
  const activityBlock = legacyBlocks.find((b) => b.type === "activity") as
    | Extract<Block, { type: "activity" }> | undefined;

  return {
    id: row.slug,
    displayId: String(order).padStart(2, "0"),
    title: row.title,
    category: meta.subcategory ?? "기타",
    description: row.excerpt ?? "",
    thumbnail: meta.thumbnail ?? row.cover_image_url ?? "",
    image: meta.image ?? row.cover_image_url ?? "",
    tags: meta.tags ?? [],
    period: meta.period,
    client: meta.client,
    role: meta.role,
    blocks,
    summary: summaryBlock?.text,
    highlights: highlightsBlock?.items,
    deliverables: deliverablesBlock?.items,
    stack: meta.stack,
    activity: activityBlock?.events as ActivityEvent[] | undefined,
  };
}

const SELECT = `
  id, slug, title, excerpt, content, cover_image_url, metadata, sort_order
`;

export async function listPortfolioItems(): Promise<PortfolioItem[]> {
  const rows = await listArticles<ArticleRow>("portfolio", SELECT);
  return rows.map(mapArticleToPortfolio);
}

export async function getPortfolioItemBySlug(slug: string): Promise<PortfolioItem | null> {
  const row = await getArticleBySlug<ArticleRow>("portfolio", slug, SELECT);
  return row ? mapArticleToPortfolio(row) : null;
}
