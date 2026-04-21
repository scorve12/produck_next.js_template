import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/supabase/auth";
import { PortfolioForm } from "@/components/admin/PortfolioForm";
import { createPortfolio } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewPortfolioPage() {
  await requireAdmin("editor");

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
        새 활동기록
      </h1>

      <PortfolioForm action={createPortfolio} submitLabel="생성" />
    </div>
  );
}
