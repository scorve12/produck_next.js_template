import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

export type ArticleRow = {
  id: string;
  slug: string;
  title: string;
  status: string;
  sort_order: number | null;
  metadata: { subcategory?: string } | null;
};

type ArticleTableProps = {
  rows: ArticleRow[];
  editBasePath: string;
  emptyLabel: string;
};

export function ArticleTable({ rows, editBasePath, emptyLabel }: ArticleTableProps) {
  return (
    <div className="rounded-2xl bg-white border border-gray-100 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wider">
          <tr>
            <th className="px-5 py-3 w-12">#</th>
            <th className="px-5 py-3">제목</th>
            <th className="px-5 py-3">카테고리</th>
            <th className="px-5 py-3">상태</th>
            <th className="px-5 py-3">슬러그</th>
            <th className="px-5 py-3 w-10"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((row) => {
            const editHref = `${editBasePath}/${row.id}/edit`;
            return (
              <tr
                key={row.id}
                className="hover:bg-stone-50/40 cursor-pointer transition-colors"
              >
                <RowLink href={editHref} className="text-gray-400">
                  {row.sort_order ?? 0}
                </RowLink>
                <RowLink href={editHref} className="font-medium text-gray-900">
                  {row.title}
                </RowLink>
                <RowLink href={editHref} className="text-gray-600">
                  {row.metadata?.subcategory ?? "-"}
                </RowLink>
                <RowLink href={editHref}>
                  <StatusBadge status={row.status} />
                </RowLink>
                <RowLink href={editHref} className="text-gray-500 font-mono text-xs">
                  {row.slug}
                </RowLink>
                <RowLink href={editHref} className="text-right text-gray-300">
                  <ChevronRight className="h-4 w-4 inline" />
                </RowLink>
              </tr>
            );
          })}
          {rows.length === 0 && (
            <tr>
              <td colSpan={6} className="px-5 py-16 text-center text-gray-400">
                {emptyLabel}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function RowLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <td className={`p-0 ${className ?? ""}`}>
      <Link href={href} className="block px-5 py-3">
        {children}
      </Link>
    </td>
  );
}

const STATUS_CLASS: Record<string, string> = {
  published: "bg-emerald-50 text-emerald-600 border-emerald-100",
  draft: "bg-gray-100 text-gray-500 border-gray-200",
  archived: "bg-stone-50 text-stone-600 border-stone-200",
};

const STATUS_LABEL: Record<string, string> = {
  published: "게시",
  draft: "초안",
  archived: "보관",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${
        STATUS_CLASS[status] ?? STATUS_CLASS.draft
      }`}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}
