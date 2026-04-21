import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/supabase/auth";
import { createAuthServerClient } from "@/lib/supabase/server";
import { PortfolioForm, type PortfolioFormValues } from "@/components/admin/PortfolioForm";
import { normalizeStoredContent } from "@/lib/supabase/content";
import { updatePortfolio, deletePortfolio } from "../../actions";
import { type BaseArticleRow } from "@/lib/db/articles";

export const dynamic = "force-dynamic";

type ArticleRow = BaseArticleRow<Record<string, unknown>>;

function toInitial(row: ArticleRow): Partial<PortfolioFormValues> {
  const meta = row.metadata ?? {};

  return {
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt ?? "",
    status: (row.status === "archived" ? "draft" : row.status) as "draft" | "published",
    subcategory: (meta.subcategory as string) ?? "",
    sort_order: row.sort_order ?? 0,
    blocks: normalizeStoredContent(row.content),
    tags: (meta.tags as string[]) ?? [],
    period: (meta.period as string) ?? "",
    client: (meta.client as string) ?? "",
    role: (meta.role as string) ?? "",
    stack: (meta.stack as string[]) ?? [],
    image: (meta.image as string) ?? "",
    thumbnail: (meta.thumbnail as string) ?? "",
  };
}

export default async function EditPortfolioPage({
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
    .eq("category", "portfolio")
    .is("deleted_at", null)
    .maybeSingle();

  if (!article) notFound();

  const boundUpdate = updatePortfolio.bind(null, id);
  const boundDelete = async () => {
    "use server";
    await deletePortfolio(id, { redirectAfter: true });
  };

  return (
    <div>
      <Link
        href="/admin/portfolio"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        목록으로
      </Link>

      <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-8">
        활동기록 편집
      </h1>

      <PortfolioForm
        action={boundUpdate}
        deleteAction={boundDelete}
        initial={toInitial(article as ArticleRow)}
        submitLabel="저장"
      />
    </div>
  );
}
