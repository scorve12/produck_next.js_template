"use client";

import { useState } from "react";

export function DeleteButton({
  onDelete,
}: {
  onDelete: () => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    setLoading(true);
    try {
      await onDelete();
    } catch (e) {
      alert(e instanceof Error ? e.message : "삭제 실패");
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      className="text-xs text-rose-600 hover:text-rose-700 font-medium disabled:opacity-50"
    >
      {loading ? "삭제 중..." : "삭제"}
    </button>
  );
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

export const inputCls =
  "w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-stone-400";
export const selectCls = `${inputCls} admin-select`;
export const textareaCls = `${inputCls} font-mono`;
