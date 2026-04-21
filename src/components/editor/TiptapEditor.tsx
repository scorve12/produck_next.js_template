"use client";

import {
  useEditor, EditorContent, Extension,
  ReactNodeViewRenderer, NodeViewWrapper,
  type Editor, type NodeViewProps,
} from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { Placeholder } from "@tiptap/extension-placeholder";
import { Image } from "@tiptap/extension-image";
import { Link } from "@tiptap/extension-link";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { Highlight } from "@tiptap/extension-highlight";
import { Underline } from "@tiptap/extension-underline";
import { CodeBlockLowlight } from "@tiptap/extension-code-block-lowlight";
import { TextAlign } from "@tiptap/extension-text-align";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { TaskList } from "@tiptap/extension-task-list";
import { TaskItem } from "@tiptap/extension-task-item";
import { Youtube } from "@tiptap/extension-youtube";
import { Typography } from "@tiptap/extension-typography";
import { CharacterCount } from "@tiptap/extension-character-count";
import { Subscript } from "@tiptap/extension-subscript";
import { Superscript } from "@tiptap/extension-superscript";
import { Mathematics } from "@tiptap/extension-mathematics";
import { common, createLowlight } from "lowlight";
import Suggestion from "@tiptap/suggestion";
import type { EditorView } from "@tiptap/pm/view";
import "katex/dist/katex.min.css";
import {
  type Dispatch, type MutableRefObject, type SetStateAction,
  useEffect, useRef, useState,
} from "react";
import { createPortal } from "react-dom";
import type { SlashCommandItem } from "@/types/blocks";
import { SLASH_COMMANDS } from "@/types/blocks";
import { normalizeInitialContent } from "@/lib/supabase/content";
import { EditorToolbar } from "./TiptapEditorToolbar";
import { SlashCommandMenu } from "./TiptapSlashCommandMenu";
import {
  HighlightsNode, DeliverablesNode, ActivityNode
} from "./TiptapCustomNodes";

// ────────────────────────────────────────────────────────────────────────────

const lowlight = createLowlight(common);
const PORTFOLIO_ONLY_BLOCKS = new Set(["highlights", "deliverables", "activity"]);

// TextStyle에 fontSize attribute 추가 (네이버 블로그처럼 글자 크기 조절 지원)
const TextStyleWithFontSize = TextStyle.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      fontSize: {
        default: null,
        parseHTML: (el) =>
          (el as HTMLElement).style.fontSize?.replace(/['"]/g, "") || null,
        renderHTML: (attrs) => {
          if (!attrs.fontSize) return {};
          return { style: `font-size: ${attrs.fontSize}` };
        },
      },
    };
  },
});

// paragraph/heading/blockquote에 lineHeight 전역 속성 추가
const LineHeight = Extension.create({
  name: "lineHeight",
  addGlobalAttributes() {
    return [
      {
        types: ["paragraph", "heading", "blockquote"],
        attributes: {
          lineHeight: {
            default: null,
            parseHTML: (el) =>
              (el as HTMLElement).style.lineHeight || null,
            renderHTML: (attrs) => {
              if (!attrs.lineHeight) return {};
              return { style: `line-height: ${attrs.lineHeight}` };
            },
          },
        },
      },
    ];
  },
});

// ─── YouTube NodeView (삭제 버튼 포함) ────────────────────────────────────

function YoutubeNodeView({ node, deleteNode }: NodeViewProps) {
  const src = (node.attrs.src as string) || "";
  return (
    <NodeViewWrapper data-youtube-video="" className="youtube-node-view">
      <button
        type="button"
        className="youtube-delete-btn"
        onClick={deleteNode}
        title="삭제"
      >
        &times;
      </button>
      <iframe
        src={src}
        allowFullScreen
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      />
    </NodeViewWrapper>
  );
}

type ArticleType = "feed" | "portfolio";

type SlashState = {
  open: boolean;
  items: SlashCommandItem[];
  selectedIndex: number;
  coords: { top: number; left: number };
  range: { from: number; to: number };
};

const DEFAULT_SLASH_STATE: SlashState = {
  open: false,
  items: [],
  selectedIndex: 0,
  coords: { top: 0, left: 0 },
  range: { from: 0, to: 0 },
};

type SlashCommandOptions = {
  articleTypeRef: MutableRefObject<ArticleType>;
  setSlashState: Dispatch<SetStateAction<SlashState>>;
  slashStateRef: MutableRefObject<SlashState>;
  slashCommandRef: MutableRefObject<((item: SlashCommandItem) => void) | null>;
  onUploadRef: MutableRefObject<(v: boolean) => void>;
};

const SlashCommand = Extension.create<SlashCommandOptions>({
  name: "slashCommand",

  addOptions() {
    return {
      articleTypeRef: { current: "feed" } as MutableRefObject<ArticleType>,
      setSlashState: () => {},
      slashStateRef: { current: DEFAULT_SLASH_STATE } as MutableRefObject<SlashState>,
      slashCommandRef: { current: null } as MutableRefObject<((item: SlashCommandItem) => void) | null>,
      onUploadRef: { current: () => {} } as MutableRefObject<(v: boolean) => void>,
    };
  },

  addProseMirrorPlugins() {
    const opts = this.options;
    return [
      Suggestion({
        editor: this.editor,
        char: "/",
        command: ({ editor, range, props }) => {
          editor.chain().focus().deleteRange(range).run();
          runSlashCommand(editor, (props as SlashCommandItem).type, opts.articleTypeRef.current, opts.onUploadRef.current);
        },
        items: ({ query }) => filterSlashItems(query, opts.articleTypeRef.current),
        render: () => ({
          onStart: (props) => {
            const rect = resolveRect(props.clientRect);
            opts.slashCommandRef.current = props.command as (item: SlashCommandItem) => void;
            const next: SlashState = {
              open: true,
              items: props.items as SlashCommandItem[],
              selectedIndex: 0,
              coords: rect ?? { top: 0, left: 0 },
              range: props.range,
            };
            opts.slashStateRef.current = next;
            opts.setSlashState(next);
          },
          onUpdate: (props) => {
            const rect = resolveRect(props.clientRect);
            opts.slashCommandRef.current = props.command as (item: SlashCommandItem) => void;
            opts.setSlashState((s) => {
              const next: SlashState = {
                ...s,
                items: props.items as SlashCommandItem[],
                selectedIndex: 0,
                coords: rect ?? s.coords,
                range: props.range,
              };
              opts.slashStateRef.current = next;
              return next;
            });
          },
          onKeyDown: (props) => {
            const state = opts.slashStateRef.current;
            if (props.event.key === "ArrowUp") {
              opts.setSlashState((s) => {
                const next = { ...s, selectedIndex: Math.max(0, s.selectedIndex - 1) };
                opts.slashStateRef.current = next;
                return next;
              });
              return true;
            }
            if (props.event.key === "ArrowDown") {
              opts.setSlashState((s) => {
                const next = { ...s, selectedIndex: Math.min(s.items.length - 1, s.selectedIndex + 1) };
                opts.slashStateRef.current = next;
                return next;
              });
              return true;
            }
            if (props.event.key === "Enter") {
              const item = state.items[state.selectedIndex];
              if (item) {
                opts.slashCommandRef.current?.(item);
                return true;
              }
            }
            if (props.event.key === "Escape") {
              const next = { ...state, open: false };
              opts.slashStateRef.current = next;
              opts.setSlashState(next);
              return true;
            }
            return false;
          },
          onExit: () => {
            opts.setSlashState((s) => {
              const next = { ...s, open: false };
              opts.slashStateRef.current = next;
              return next;
            });
          },
        }),
      }),
    ];
  },
});

function filterSlashItems(query: string, articleType: ArticleType): SlashCommandItem[] {
  const base = articleType === "feed"
    ? SLASH_COMMANDS.filter((cmd) => !PORTFOLIO_ONLY_BLOCKS.has(cmd.type))
    : SLASH_COMMANDS;
  const q = query.toLowerCase();
  return base.filter((item) =>
    item.label.toLowerCase().includes(q) || item.description.toLowerCase().includes(q)
  );
}

function resolveRect(
  clientRect: (() => DOMRect | null) | DOMRect | null | undefined,
): { top: number; left: number } | null {
  const rect = typeof clientRect === "function" ? clientRect() : clientRect;
  if (!rect) return null;
  return { top: rect.bottom || rect.top || 0, left: rect.left || 0 };
}

async function uploadImage(
  file: File,
  articleType: string,
  signal: AbortSignal,
): Promise<string | null> {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("articleType", articleType);

    const response = await fetch("/api/admin/upload-image", {
      method: "POST",
      body: formData,
      signal,
    });

    if (!response.ok) throw new Error("Image upload failed");
    const { url } = await response.json();
    return url as string;
  } catch (error) {
    if ((error as Error).name === "AbortError") return null;
    console.error("Image upload error:", error);
    alert("이미지 업로드 실패");
    return null;
  }
}

async function insertUploadedImages(
  view: EditorView,
  files: File[],
  pos: number,
  articleType: string,
  signal: AbortSignal,
  onUpload?: (v: boolean) => void,
): Promise<void> {
  onUpload?.(true);
  try {
    for (const file of files) {
      if (signal.aborted || view.isDestroyed) return;
      const url = await uploadImage(file, articleType, signal);
      if (!url || signal.aborted || view.isDestroyed) continue;
      const imageType = view.state.schema.nodes.image;
      if (!imageType) continue;
      const node = imageType.create({ src: url });
      view.dispatch(view.state.tr.insert(pos, node));
    }
  } finally {
    onUpload?.(false);
  }
}

type TiptapEditorProps = {
  name: string;
  initialContent?: unknown;
  articleType?: ArticleType;
};

export function TiptapEditor({
  name,
  initialContent,
  articleType = "feed",
}: TiptapEditorProps) {
  const hiddenInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [slashState, setSlashState] = useState<SlashState>(DEFAULT_SLASH_STATE);
  const uploadingSetRef = useRef(setUploading);

  const slashStateRef = useRef(slashState);
  const slashCommandRef = useRef<((item: SlashCommandItem) => void) | null>(null);
  const articleTypeRef = useRef<ArticleType>(articleType);
  useEffect(() => {
    slashStateRef.current = slashState;
  }, [slashState]);
  useEffect(() => {
    articleTypeRef.current = articleType;
  }, [articleType]);

  // 컴포넌트 unmount 시 진행 중인 업로드 취소
  const uploadAbortRef = useRef<AbortController | null>(null);
  useEffect(() => {
    uploadAbortRef.current = new AbortController();
    return () => uploadAbortRef.current?.abort();
  }, []);

  const initialDoc = normalizeInitialContent(initialContent);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      Placeholder.configure({
        placeholder: "내용을 입력하세요... (/ 를 눌러 블록 삽입)",
      }),
      Image.configure({
        allowBase64: true,
        HTMLAttributes: { class: "max-w-full rounded-lg" },
      }),
      Link.configure({ openOnClick: false }),
      TextStyleWithFontSize,
      Color,
      Highlight.configure({ multicolor: true }),
      Underline,
      CodeBlockLowlight.configure({ lowlight }),
      TextAlign.configure({
        types: ["paragraph", "heading", "blockquote"],
        alignments: ["left", "center", "right", "justify"],
        defaultAlignment: "left",
      }),
      LineHeight,
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      TaskList,
      TaskItem.extend({ content: "paragraph" }).configure({ nested: false }),
      Youtube.extend({
        addNodeView() {
          return ReactNodeViewRenderer(YoutubeNodeView);
        },
      }).configure({
        controls: true,
        nocookie: true,
        width: 0,
        height: 0,
      }),
      Typography,
      CharacterCount,
      Subscript,
      Superscript,
      Mathematics,
      // eslint-disable-next-line react-hooks/refs -- refs are only dereferenced inside Suggestion callbacks (post-commit)
      SlashCommand.configure({
        articleTypeRef,
        setSlashState,
        slashStateRef,
        slashCommandRef,
        onUploadRef: uploadingSetRef,
      }),
      ...(articleType === "portfolio"
        ? [HighlightsNode, DeliverablesNode, ActivityNode]
        : []),
    ],
    content: initialDoc,
    editorProps: {
      handleDrop(view, event, _slice, moved) {
        if (moved) return false;
        const dragEvent = event as DragEvent;
        const files = dragEvent.dataTransfer?.files;
        if (!files || files.length === 0) return false;

        const imageFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));
        if (imageFiles.length === 0) return false;

        event.preventDefault();
        const coords = { left: dragEvent.clientX, top: dragEvent.clientY };
        const pos = view.posAtCoords(coords)?.pos ?? view.state.selection.to;
        const signal = uploadAbortRef.current?.signal ?? new AbortController().signal;
        void insertUploadedImages(view, imageFiles, pos, articleTypeRef.current, signal, uploadingSetRef.current);
        return true;
      },
      handlePaste(view, event) {
        const clipboardEvent = event as ClipboardEvent;
        const items = clipboardEvent.clipboardData?.items;
        if (!items) return false;

        const imageItem = Array.from(items).find((i) => i.type.startsWith("image/"));
        if (!imageItem) return false;

        const file = imageItem.getAsFile();
        if (!file) return false;

        event.preventDefault();
        const pos = view.state.selection.to;
        const signal = uploadAbortRef.current?.signal ?? new AbortController().signal;
        void insertUploadedImages(view, [file], pos, articleTypeRef.current, signal, uploadingSetRef.current);
        return true;
      },
    },
    onUpdate: ({ editor: ed }) => {
      if (hiddenInputRef.current) {
        hiddenInputRef.current.value = JSON.stringify(ed.getJSON());
      }
    },
  });

  useEffect(() => {
    if (editor && hiddenInputRef.current) {
      hiddenInputRef.current.value = JSON.stringify(editor.getJSON());
    }
  }, [editor]);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !editor) {
    return <div className="border border-gray-300 rounded-lg p-4 min-h-96 bg-white" />;
  }

  const charCount = editor.storage.characterCount;

  return (
    <div ref={editorRef} className="w-full">
      <input type="hidden" name={name} ref={hiddenInputRef} />

      <EditorToolbar editor={editor} articleType={articleType} onUpload={setUploading} />

      <div
        onDragOver={(e) => {
          e.preventDefault();
          e.currentTarget.classList.add("bg-blue-50");
        }}
        onDragLeave={(e) => {
          e.currentTarget.classList.remove("bg-blue-50");
        }}
        onDrop={(e) => {
          e.currentTarget.classList.remove("bg-blue-50");
        }}
        className="relative border border-gray-300 rounded-lg p-4 min-h-96 bg-white focus-within:ring-2 focus-within:ring-stone-400 focus-within:border-transparent transition-all"
      >
        <EditorContent editor={editor} className="prose prose-sm max-w-none" />
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 rounded-lg z-10">
            <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-xl shadow-lg border border-gray-200">
              <div className="h-5 w-5 border-2 border-stone-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-medium text-gray-700">이미지 업로드 중...</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end px-2 py-1 text-xs text-gray-400">
        {charCount?.characters() ?? 0}자 · {charCount?.words() ?? 0}단어
      </div>

      {slashState.open && slashState.items.length > 0 && (
        <SlashCommandMenuPortal
          items={slashState.items}
          selectedIndex={slashState.selectedIndex}
          coords={slashState.coords}
          onSelect={(item) => {
            slashCommandRef.current?.(item);
            setSlashState((s) => ({ ...s, open: false }));
          }}
        />
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────

type SlashHandler = (editor: Editor, articleType: string, onUpload?: (v: boolean) => void) => boolean;

function openFilePicker(editor: Editor, articleType: string, onUpload?: (v: boolean) => void): boolean {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.onchange = async () => {
    const file = input.files?.[0];
    if (!file) return;
    onUpload?.(true);
    try {
      const url = await uploadImage(file, articleType, new AbortController().signal);
      if (url) {
        editor.chain().focus().setImage({ src: url }).run();
      }
    } finally {
      onUpload?.(false);
    }
  };
  input.click();
  return true;
}

const SLASH_HANDLERS: Record<string, SlashHandler> = {
  paragraph: (e) => e.chain().focus().setParagraph().run(),
  heading1: (e) => e.chain().focus().setHeading({ level: 1 }).run(),
  heading2: (e) => e.chain().focus().setHeading({ level: 2 }).run(),
  heading3: (e) => e.chain().focus().setHeading({ level: 3 }).run(),
  quote: (e) => e.chain().focus().setBlockquote().run(),
  bulletList: (e) => e.chain().focus().toggleBulletList().run(),
  numberedList: (e) => e.chain().focus().toggleOrderedList().run(),
  divider: (e) => e.chain().focus().setHorizontalRule().run(),
  code: (e) => e.chain().focus().setCodeBlock().run(),
  image: (e, articleType, onUpload) => openFilePicker(e, articleType, onUpload),
  table: (e) => e.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
  taskList: (e) => e.chain().focus().toggleTaskList().run(),
  youtube: (e) => {
    const url = prompt("YouTube URL을 입력하세요:");
    if (url) return e.chain().focus().setYoutubeVideo({ src: url }).run();
    return false;
  },
  math: (e) => e.chain().focus().insertContent({ type: "math", attrs: { latex: "E = mc^2" } }).run(),
  highlights: (e, articleType) =>
    articleType === "portfolio"
      ? e.chain().focus().insertContent({ type: "highlights", attrs: { items: [""] } }).run()
      : false,
  deliverables: (e, articleType) =>
    articleType === "portfolio"
      ? e.chain().focus().insertContent({ type: "deliverables", attrs: { items: [""] } }).run()
      : false,
  activity: (e, articleType) =>
    articleType === "portfolio"
      ? e.chain().focus().insertContent({
          type: "activity",
          attrs: { events: [{ date: "", title: "", description: "" }] },
        }).run()
      : false,
};

function runSlashCommand(editor: Editor, type: string, articleType: string, onUpload?: (v: boolean) => void): boolean {
  return SLASH_HANDLERS[type]?.(editor, articleType, onUpload) ?? false;
}

function SlashCommandMenuPortal({
  items,
  selectedIndex,
  coords,
  onSelect,
}: {
  items: SlashCommandItem[];
  selectedIndex: number;
  coords: { top: number; left: number };
  onSelect: (item: SlashCommandItem) => void;
}) {
  return createPortal(
    <SlashCommandMenu
      items={items}
      selectedIndex={selectedIndex}
      coords={coords}
      onSelect={onSelect}
    />,
    document.body
  );
}
