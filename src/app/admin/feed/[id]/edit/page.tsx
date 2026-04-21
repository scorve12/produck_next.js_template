import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/supabase/auth";
import { createAuthServerClient } from "@/lib/supabase/server";
import { FeedForm, type FeedFormValues } from "@/components/admin/FeedForm";
import { normalizeStoredContent } from "@/lib/supabase/content";
import { updateFeed, deleteFeed } from "../../actions";
import { type BaseArticleRow } from "@/lib/db/articles";

export const dynamic = "force-dynamic";

type ArticleRow = BaseArticleRow<Record<string, unknown>>;

function toInitial(row: ArticleRow): Partial<FeedFormValues> {
  const meta = row.metadata ?? {};
  const thumb = (meta.thumbnail as { bg?: string; icon?: string } | undefined) ?? {};

  return {
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt ?? "",
    status: (row.status === "archived" ? "draft" : row.status) as "draft" | "published",
    subcategory: (meta.subcategory as string) ?? "",
    sort_order: row.sort_order ?? 0,
    author: (meta.author as string) ?? "",
    readTime: (meta.readTime as string) ?? "",
    displayDate: (meta.displayDate as string) ?? "",
    thumbnail_bg: thumb.bg ?? "from-stone-100 to-stone-50",
    thumbnail_icon: thumb.icon ?? "rocket",
    blocks: normalizeStoredContent(row.content),
  };
}

export default async function EditFeedPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin("editor");
  const { id } = await params;
  const supabase = await createAuthServerClient();

  const { data: article } = await supabase
    .from("articles")
    .select("id, title, slug, excerpt, status, sort_order, content, metadata")
    .eq("id", id)
    .eq("category", "feed")
    .is("deleted_at", null)
    .maybeSingle();

  if (!article) notFound();

  const boundUpdate = updateFeed.bind(null, id);
  const boundDelete = async () => {
    "use server";
    await deleteFeed(id, { redirectAfter: true });
  };

  return (
    <div>
      <Link
        href="/admin/feed"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        목록으로
      </Link>

      <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-8">
        피드 글 편집
      </h1>

      <FeedForm
        action={boundUpdate}
        deleteAction={boundDelete}
        initial={toInitial(article as ArticleRow)}
        submitLabel="저장"
      />
    </div>
  );
}
