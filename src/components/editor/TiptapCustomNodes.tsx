"use client";

import { Node } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { Plus, Trash2, X } from "lucide-react";
import type { ActivityEvent } from "@/types/blocks";
import { useNodeListItems } from "./useNodeListItems";

// ─── 공용 NodeView 프리미티브 ─────────────────────────────────────────────

function AddItemButton({
  onClick,
  label,
  colorClass,
}: {
  onClick: () => void;
  label: string;
  colorClass: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`mt-3 text-sm font-medium flex items-center gap-1 ${colorClass}`}
    >
      <Plus className="h-4 w-4" /> {label}
    </button>
  );
}

function DeleteItemButton({ onClick, asText = false }: { onClick: () => void; asText?: boolean }) {
  if (asText) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="mt-2 text-sm text-red-500 hover:text-red-700 flex items-center gap-1"
      >
        <X className="h-4 w-4" /> 삭제
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className="p-1 text-red-500 hover:bg-red-50 rounded"
      title="삭제"
    >
      <X className="h-4 w-4" />
    </button>
  );
}

// ─── Highlights Node ───────────────────────────────────────────────────────

export const HighlightsNode = Node.create({
  name: "highlights",
  group: "block",
  atom: true,
  addAttributes() {
    return { items: { default: [] } };
  },
  parseHTML() {
    return [{ tag: 'div[data-type="highlights"]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["div", { ...HTMLAttributes, "data-type": "highlights" }, 0];
  },
  addNodeView() {
    return ReactNodeViewRenderer(HighlightsNodeView);
  },
});

function HighlightsNodeView({ node, updateAttributes, deleteNode }: NodeViewProps) {
  const items = (node.attrs.items as string[] | undefined) ?? [];
  const list = useNodeListItems<string>(items, "items", () => "", updateAttributes);

  return (
    <NodeViewWrapper className="bg-blue-50 border border-blue-300 rounded-lg p-4 my-2">
      <div className="flex items-center justify-between mb-3">
        <div className="font-semibold text-sm text-blue-900">핵심 성과</div>
        <button
          type="button"
          onClick={deleteNode}
          className="p-1 text-blue-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
          title="블록 삭제"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="space-y-2">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
              {idx + 1}
            </div>
            <input
              type="text"
              value={item}
              onChange={(e) => list.update(idx, e.target.value)}
              placeholder="성과 항목"
              className="flex-grow px-2 py-1 border border-gray-300 rounded text-sm"
            />
            <DeleteItemButton onClick={() => list.remove(idx)} />
          </div>
        ))}
      </div>
      <AddItemButton onClick={list.add} label="항목 추가" colorClass="text-blue-600 hover:text-blue-700" />
    </NodeViewWrapper>
  );
}

// ─── Deliverables Node ─────────────────────────────────────────────────────

export const DeliverablesNode = Node.create({
  name: "deliverables",
  group: "block",
  atom: true,
  addAttributes() {
    return { items: { default: [] } };
  },
  parseHTML() {
    return [{ tag: 'div[data-type="deliverables"]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["div", { ...HTMLAttributes, "data-type": "deliverables" }, 0];
  },
  addNodeView() {
    return ReactNodeViewRenderer(DeliverablesNodeView);
  },
});

function DeliverablesNodeView({ node, updateAttributes, deleteNode }: NodeViewProps) {
  const items = (node.attrs.items as string[] | undefined) ?? [];
  const list = useNodeListItems<string>(items, "items", () => "", updateAttributes);

  return (
    <NodeViewWrapper className="bg-green-50 border border-green-300 rounded-lg p-4 my-2">
      <div className="flex items-center justify-between mb-3">
        <div className="font-semibold text-sm text-green-900">산출물</div>
        <button
          type="button"
          onClick={deleteNode}
          className="p-1 text-green-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
          title="블록 삭제"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="space-y-2">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <input
              type="checkbox"
              className="w-5 h-5 rounded text-green-600"
              checked={false}
              readOnly
            />
            <input
              type="text"
              value={item}
              onChange={(e) => list.update(idx, e.target.value)}
              placeholder="산출물 항목"
              className="flex-grow px-2 py-1 border border-gray-300 rounded text-sm"
            />
            <DeleteItemButton onClick={() => list.remove(idx)} />
          </div>
        ))}
      </div>
      <AddItemButton onClick={list.add} label="항목 추가" colorClass="text-green-600 hover:text-green-700" />
    </NodeViewWrapper>
  );
}

// ─── Activity Node ─────────────────────────────────────────────────────────

export const ActivityNode = Node.create({
  name: "activity",
  group: "block",
  atom: true,
  addAttributes() {
    return { events: { default: [] } };
  },
  parseHTML() {
    return [{ tag: 'div[data-type="activity"]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["div", { ...HTMLAttributes, "data-type": "activity" }, 0];
  },
  addNodeView() {
    return ReactNodeViewRenderer(ActivityNodeView);
  },
});

function ActivityNodeView({ node, updateAttributes, deleteNode }: NodeViewProps) {
  const events = (node.attrs.events as ActivityEvent[] | undefined) ?? [];
  const list = useNodeListItems<ActivityEvent>(
    events,
    "events",
    () => ({ date: "", title: "", description: "" }),
    updateAttributes,
  );

  return (
    <NodeViewWrapper className="bg-purple-50 border border-purple-300 rounded-lg p-4 my-2">
      <div className="flex items-center justify-between mb-3">
        <div className="font-semibold text-sm text-purple-900">활동 타임라인</div>
        <button
          type="button"
          onClick={deleteNode}
          className="p-1 text-purple-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
          title="블록 삭제"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="space-y-3">
        {events.map((event, idx) => (
          <div key={idx} className="pl-4 border-l-2 border-purple-400">
            <input
              type="text"
              value={event.date}
              onChange={(e) => list.patch(idx, "date", e.target.value)}
              placeholder="날짜 (예: 2024-01)"
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm mb-2"
            />
            <input
              type="text"
              value={event.title}
              onChange={(e) => list.patch(idx, "title", e.target.value)}
              placeholder="제목"
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm mb-2 font-medium"
            />
            <textarea
              value={event.description || ""}
              onChange={(e) => list.patch(idx, "description", e.target.value)}
              placeholder="설명 (선택사항)"
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              rows={2}
            />
            <DeleteItemButton onClick={() => list.remove(idx)} asText />
          </div>
        ))}
      </div>
      <AddItemButton
        onClick={list.add}
        label="이벤트 추가"
        colorClass="text-purple-600 hover:text-purple-700"
      />
    </NodeViewWrapper>
  );
}
