import Link from "next/link";
import { requireAdmin } from "@/lib/supabase/auth";
import { createAuthServerClient } from "@/lib/supabase/server";
import { Plus } from "lucide-react";
import { ArticleTable, type ArticleRow } from "@/components/admin/ArticleTable";

export const dynamic = "force-dynamic";

export default async function AdminPortfolioList() {
  await requireAdmin();
  const supabase = await createAuthServerClient();

  const { data, error } = await supabase
    .from("articles")
    .select("id, slug, title, status, sort_order, updated_at, metadata")
    .eq("category", "portfolio")
    .is("deleted_at", null)
    .order("sort_order", { ascending: true });

  if (error) return <div className="text-rose-600">{error.message}</div>;
  const rows = (data ?? []) as unknown as ArticleRow[];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-1">
            포트폴리오
          </h1>
          <p className="text-sm text-gray-500">활동기록 총 {rows.length}개</p>
        </div>
        <Link
          href="/admin/portfolio/new"
          className="inline-flex items-center gap-1.5 bg-gray-900 text-white font-semibold px-4 py-2.5 rounded-full text-sm shadow-lg shadow-stone-300/50 hover:bg-gray-800 hover:shadow-xl transition-all"
        >
          <Plus className="h-4 w-4" />
          새 활동기록
        </Link>
      </div>

      <ArticleTable
        rows={rows}
        editBasePath="/admin/portfolio"
        emptyLabel="아직 등록된 활동기록이 없어요."
      />
    </div>
  );
}
