import type { FeedItem } from "@/data/feed";
import type { Block } from "@/types/blocks";
import { parseStoredContent } from "@/lib/content";
import { listArticles, getArticleBySlug, type BaseArticleRow } from "@/lib/db/articles";

export type FeedMetadata = {
  readTime?: string;
  author?: string;
  displayDate?: string;
  subcategory?: string;
  thumbnail?: { bg: string; icon: string };
};

type ArticleRow = BaseArticleRow<FeedMetadata>;

function mapArticleToFeed(row: ArticleRow): FeedItem {
  const meta = row.metadata ?? {};
  const { legacyBlocks, combined: blocks } = parseStoredContent(row.content);

  const legacySections = legacyBlocks
    .filter((b): b is Extract<Block, { type: "section" }> => b.type === "section")
    .map((b) => ({ heading: b.heading, body: b.body }));

  return {
    id: row.slug,
    category: (meta.subcategory ?? "뉴스") as FeedItem["category"],
    title: row.title,
    description: row.excerpt ?? "",
    date:
      meta.displayDate ??
      (row.published_at ? row.published_at.slice(0, 10).replace(/-/g, ".") : ""),
    readTime: meta.readTime ?? "",
    author: meta.author ?? "",
    thumbnail: meta.thumbnail ?? { bg: "from-gray-100 to-gray-50", icon: "rocket" },
    content: {
      sections: legacySections,
      blocks,
    },
  };
}

const SELECT = `
  id, slug, title, excerpt, content, metadata, published_at, sort_order
`;

export async function listFeedItems(): Promise<FeedItem[]> {
  const rows = await listArticles<ArticleRow>("feed", SELECT);
  return rows.map(mapArticleToFeed);
}

export async function getFeedItemBySlug(slug: string): Promise<FeedItem | null> {
  const row = await getArticleBySlug<ArticleRow>("feed", slug, SELECT);
  return row ? mapArticleToFeed(row) : null;
}
