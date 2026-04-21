"use client";

import { useState } from "react";
import { Field, inputCls, selectCls } from "./ArticleFormShared";
import { TiptapEditor } from "@/components/editor/TiptapEditor";
import type { Block } from "@/types/blocks";
import type { JSONContent } from "@tiptap/react";
import {
  FEED_SUBCATEGORIES,
  FEED_THUMBNAIL_ICONS,
  FEED_DEFAULT_THUMBNAIL_BG,
  FEED_DEFAULT_THUMBNAIL_ICON,
} from "@/lib/db/feed-constants";

export type FeedFormValues = {
  title: string;
  slug: string;
  excerpt: string;
  status: "draft" | "published";
  subcategory: string;
  sort_order: number;
  author: string;
  readTime: string;
  displayDate: string;
  thumbnail_bg: string;
  thumbnail_icon: string;
  blocks?: Block[] | JSONContent;
  sections?: { heading: string; body: string[] }[];
};

export function FeedForm({
  action,
  initial,
  submitLabel,
  deleteAction,
}: {
  action: (formData: FormData) => void | Promise<void>;
  initial?: Partial<FeedFormValues>;
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

  const v: FeedFormValues = {
    title: initial?.title ?? "",
    slug: initial?.slug ?? "",
    excerpt: initial?.excerpt ?? "",
    status: initial?.status ?? "draft",
    subcategory: initial?.subcategory ?? FEED_SUBCATEGORIES[0],
    sort_order: initial?.sort_order ?? 0,
    author: initial?.author ?? "",
    readTime: initial?.readTime ?? "",
    displayDate: initial?.displayDate ?? "",
    thumbnail_bg: initial?.thumbnail_bg ?? FEED_DEFAULT_THUMBNAIL_BG,
    thumbnail_icon: initial?.thumbnail_icon ?? FEED_DEFAULT_THUMBNAIL_ICON,
    blocks: initial?.blocks,
    sections: initial?.sections,
  };

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
      {/* 기본 정보 */}
      <div className="grid md:grid-cols-2 gap-4">
        <Field label="제목">
          <input name="title" required defaultValue={v.title} className={inputCls} />
        </Field>
        <Field label="슬러그 (URL)">
          <input
            name="slug"
            required
            pattern="[a-z0-9-]+"
            defaultValue={v.slug}
            className={inputCls}
          />
        </Field>
      </div>

      <Field label="짧은 설명">
        <textarea name="excerpt" rows={2} defaultValue={v.excerpt} className={inputCls} />
      </Field>

      <div className="grid md:grid-cols-3 gap-4">
        <Field label="카테고리">
          <select name="subcategory" defaultValue={v.subcategory} className={selectCls}>
            {FEED_SUBCATEGORIES.map((name) => (
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

      {/* 메타 정보 */}
      <div className="rounded-xl bg-gray-50 border border-gray-100 p-5 space-y-5">
        <h3 className="font-bold text-sm text-gray-900">메타 정보</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <Field label="작성자">
            <input name="author" defaultValue={v.author} className={inputCls} />
          </Field>
          <Field label="읽는 시간" hint="예: 5분">
            <input name="readTime" defaultValue={v.readTime} className={inputCls} />
          </Field>
          <Field label="게시일 표시" hint="예: 2026.03.18">
            <input name="displayDate" defaultValue={v.displayDate} className={inputCls} />
          </Field>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <Field label="썸네일 그라디언트" hint="예: from-stone-100 to-stone-50">
            <input name="thumbnail_bg" defaultValue={v.thumbnail_bg} className={inputCls} />
          </Field>
          <Field label="썸네일 아이콘">
            <select name="thumbnail_icon" defaultValue={v.thumbnail_icon} className={selectCls}>
              {FEED_THUMBNAIL_ICONS.map((icon) => (
                <option key={icon} value={icon}>
                  {icon}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </div>

      {/* 본문 에디터 */}
      <div className="rounded-xl bg-gray-50 border border-gray-100 p-5 space-y-4">
        <h3 className="font-bold text-sm text-gray-900">본문</h3>
        <TiptapEditor
          name="blocks"
          initialContent={v.blocks ?? v.sections?.flatMap((s) => [
            { id: "", type: "heading2" as const, text: s.heading },
            ...s.body.map((t) => ({ id: "", type: "paragraph" as const, text: t })),
          ])}
          articleType="feed"
        />
      </div>

      {/* 하단 버튼 */}
      <div className="flex items-center justify-between gap-3 border-t border-gray-100 pt-6">
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
