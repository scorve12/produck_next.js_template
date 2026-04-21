import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/supabase/auth";
import { FeedForm } from "@/components/admin/FeedForm";
import { createFeed } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewFeedPage() {
  await requireAdmin("editor");

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
        새 피드 글
      </h1>

      <FeedForm action={createFeed} submitLabel="생성" />
    </div>
  );
}
