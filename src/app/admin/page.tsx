import Link from "next/link";
import { requireAdmin } from "@/lib/supabase/auth";
import { createAuthServerClient } from "@/lib/supabase/server";
import { FolderKanban, Newspaper, Eye, FileEdit } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  await requireAdmin();

  const supabase = await createAuthServerClient();
  const { data, error } = await supabase
    .from("articles")
    .select("category, status")
    .is("deleted_at", null);

  if (error) {
    return (
      <div className="text-rose-600">
        통계를 불러오지 못했어요: {error.message}
      </div>
    );
  }

  const rows = data ?? [];
  const portfolio = rows.filter((r) => r.category === "portfolio");
  const feed = rows.filter((r) => r.category === "feed");
  const published = rows.filter((r) => r.status === "published");
  const drafts = rows.filter((r) => r.status === "draft");

  return (
    <div>
      <h1 className="text-2xl mt-8 md:text-3xl font-extrabold text-gray-900 mb-1">
        대시보드
      </h1>
      <p className="text-sm text-gray-500 mb-8">
        현재 콘텐츠 현황을 한눈에 확인하세요.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <StatCard
          label="포트폴리오"
          value={portfolio.length}
          icon={<FolderKanban className="h-4 w-4" />}
          color="dark"
        />
        <StatCard
          label="피드"
          value={feed.length}
          icon={<Newspaper className="h-4 w-4" />}
          color="violet"
        />
        <StatCard
          label="게시됨"
          value={published.length}
          icon={<Eye className="h-4 w-4" />}
          color="emerald"
        />
        <StatCard
          label="초안"
          value={drafts.length}
          icon={<FileEdit className="h-4 w-4" />}
          color="gray"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <ActionCard
          href="/admin/portfolio"
          title="포트폴리오 관리"
          description="프로젝트 활동기록을 추가, 수정, 삭제합니다."
        />
        <ActionCard
          href="/admin/feed"
          title="피드 관리"
          description="뉴스·인터뷰·라이브러리 글을 관리합니다."
        />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: "dark" | "violet" | "emerald" | "gray";
}) {
  const colorMap = {
    dark: "bg-stone-100 text-gray-900",
    violet: "bg-stone-50 text-gray-700",
    emerald: "bg-stone-50 text-gray-700",
    gray: "bg-gray-100 text-gray-600",
  };
  return (
    <div className="rounded-2xl bg-white border border-gray-100 p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${colorMap[color]}`}>
          {icon}
        </span>
        <span className="text-xs text-gray-500">{label}</span>
      </div>
      <p className="text-2xl font-extrabold text-gray-900">{value}</p>
    </div>
  );
}

function ActionCard({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-2xl bg-white border border-gray-100 p-6 hover:border-stone-300 hover:shadow-sm transition-all"
    >
      <h3 className="text-base font-bold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500">{description}</p>
    </Link>
  );
}
