"use client";

import { useState } from "react";
import { Field, inputCls, selectCls } from "./ArticleFormShared";
import { TiptapEditor } from "@/components/editor/TiptapEditor";
import type { Block } from "@/types/blocks";
import type { JSONContent } from "@tiptap/react";

export type PortfolioFormValues = {
  title: string;
  slug: string;
  excerpt: string;
  status: "draft" | "published";
  subcategory: string;
  sort_order: number;
  blocks?: Block[] | JSONContent;
  summary?: string;
  highlights?: string[];
  deliverables?: string[];
  activity?: { date: string; title: string; description?: string }[];
  tags: string[];
  period: string;
  client: string;
  role: string;
  stack: string[];
  image: string;
  thumbnail: string;
};

const PORTFOLIO_SUBCATEGORIES = ["웹사이트", "웹앱", "앱"] as const;

export function PortfolioForm({
  action,
  initial,
  submitLabel,
  deleteAction,
}: {
  action: (formData: FormData) => void | Promise<void>;
  initial?: Partial<PortfolioFormValues>;
  submitLabel: string;
  deleteAction?: () => Promise<void>;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!deleteAction) return;
    if (!confirm("정말 삭제하시겠습니까? 되돌릴 수 없습니다.")) return;
    setDeleting(true);
    try {
      await deleteAction();
    } catch (e) {
      alert(e instanceof Error ? e.message : "삭제 실패");
      setDeleting(false);
    }
  }

  const v: PortfolioFormValues = {
    title: initial?.title ?? "",
    slug: initial?.slug ?? "",
    excerpt: initial?.excerpt ?? "",
    status: initial?.status ?? "draft",
    subcategory: initial?.subcategory ?? PORTFOLIO_SUBCATEGORIES[0],
    sort_order: initial?.sort_order ?? 0,
    blocks: initial?.blocks,
    summary: initial?.summary,
    highlights: initial?.highlights,
    deliverables: initial?.deliverables,
    activity: initial?.activity,
    tags: initial?.tags ?? [],
    period: initial?.period ?? "",
    client: initial?.client ?? "",
    role: initial?.role ?? "",
    stack: initial?.stack ?? [],
    image: initial?.image ?? "",
    thumbnail: initial?.thumbnail ?? "",
  };

  function legacyToBlocks(): Block[] {
    const blocks: Block[] = [];
    if (v.summary) blocks.push({ id: "", type: "summary", text: v.summary });
    if (v.highlights?.length) blocks.push({ id: "", type: "highlights", items: v.highlights });
    if (v.deliverables?.length) blocks.push({ id: "", type: "deliverables", items: v.deliverables });
    if (v.activity?.length) blocks.push({ id: "", type: "activity", events: v.activity });
    return blocks;
  }

  return (
    <form
      action={async (formData) => {
        setSubmitting(true);
        try {
          await action(formData);
        } finally {
          setSubmitting(false);
        }
      }}
      className="space-y-6"
    >
      <div className="grid md:grid-cols-2 gap-4">
        <Field label="제목">
          <input name="title" required defaultValue={v.title} className={inputCls} />
        </Field>
        <Field label="슬러그 (URL)" hint="예: global-pm-website">
          <input
            name="slug"
            required
            pattern="[a-z0-9-]+"
            defaultValue={v.slug}
            className={inputCls}
          />
        </Field>
      </div>

      <Field label="짧은 설명 (카드 & 히어로)">
        <textarea
          name="excerpt"
          rows={2}
          defaultValue={v.excerpt}
          className={inputCls}
        />
      </Field>

      <div className="grid md:grid-cols-3 gap-4">
        <Field label="카테고리">
          <select name="subcategory" defaultValue={v.subcategory} className={selectCls}>
            {PORTFOLIO_SUBCATEGORIES.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="상태">
          <select name="status" defaultValue={v.status} className={selectCls}>
            <option value="draft">초안</option>
            <option value="published">게시</option>
          </select>
        </Field>
        <Field label="정렬 순서">
          <input
            type="number"
            name="sort_order"
            defaultValue={v.sort_order}
            className={inputCls}
          />
        </Field>
      </div>

      <div className="rounded-xl bg-gray-50 border border-gray-100 p-5 space-y-4">
        <h3 className="font-bold text-sm text-gray-900">본문</h3>
        <TiptapEditor
          name="blocks"
          initialContent={v.blocks ?? legacyToBlocks()}
          articleType="portfolio"
        />
      </div>

      <div className="rounded-xl bg-gray-50 border border-gray-100 p-5 space-y-5">
        <h3 className="font-bold text-sm text-gray-900">메타 정보</h3>

        <div className="grid md:grid-cols-3 gap-4">
          <Field label="기간">
            <input name="period" defaultValue={v.period} className={inputCls} />
          </Field>
          <Field label="클라이언트">
            <input name="client" defaultValue={v.client} className={inputCls} />
          </Field>
          <Field label="역할">
            <input name="role" defaultValue={v.role} className={inputCls} />
          </Field>
        </div>

        <Field label="태그 (쉼표로 구분)">
          <input name="tags" defaultValue={v.tags.join(", ")} className={inputCls} />
        </Field>
        <Field label="기술 스택 (쉼표로 구분)">
          <input name="stack" defaultValue={v.stack.join(", ")} className={inputCls} />
        </Field>

        <div className="grid md:grid-cols-2 gap-4">
          <Field label="대표 이미지 경로">
            <input name="image" defaultValue={v.image} className={inputCls} />
          </Field>
          <Field label="썸네일 경로">
            <input name="thumbnail" defaultValue={v.thumbnail} className={inputCls} />
          </Field>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 pt-2 border-t border-gray-100 pt-6">
        <button
          type="submit"
          disabled={submitting}
          className="bg-gray-900 text-white font-semibold px-6 py-2.5 rounded-full shadow-lg shadow-stone-300/50 hover:bg-gray-800 hover:shadow-xl transition-all disabled:opacity-60"
        >
          {submitting ? "저장 중..." : submitLabel}
        </button>

        {deleteAction && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="text-sm font-medium text-rose-600 hover:text-rose-700 px-4 py-2.5 rounded-full border border-rose-200 hover:bg-rose-50 transition-colors disabled:opacity-60"
          >
            {deleting ? "삭제 중..." : "삭제"}
          </button>
        )}
      </div>
    </form>
  );
}
