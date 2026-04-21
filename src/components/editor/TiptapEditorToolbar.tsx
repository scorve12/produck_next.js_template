"use client";

import { type Editor, useEditorState } from "@tiptap/react";
import {
  Bold, Italic, Underline, Strikethrough,
  Code2, Link2, Undo2, Redo2,
  Palette, Minus, Image as ImageIcon, Upload,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Rows3, ChevronDown,
  Subscript, Superscript, Table2, ListChecks, Play, Sigma,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ToolbarToggle, ToolbarSeparator } from "./TiptapToolbarPrimitives";

type EditorToolbarProps = {
  editor: Editor;
  articleType?: "feed" | "portfolio";
  onUpload?: (v: boolean) => void;
};

type OpenPicker = null | "block" | "color" | "fontSize" | "lineHeight";
type BlockKind = "paragraph" | "heading" | "blockquote";
type Align = "left" | "center" | "right" | "justify";

const FONT_SIZES = ["12px", "14px", "16px", "18px", "20px", "24px", "28px", "32px"];
const LINE_HEIGHTS = ["1.0", "1.25", "1.5", "1.75", "2.0", "2.5"];
const COLORS = [
  "#000000", "#EF4444", "#F97316", "#EAB308",
  "#22C55E", "#0EA5E9", "#6366F1", "#8B5CF6",
  "#EC4899", "#6B7280",
];

const BLOCK_OPTIONS: Array<{ kind: BlockKind; label: string }> = [
  { kind: "paragraph", label: "본문" },
  { kind: "heading", label: "소제목" },
  { kind: "blockquote", label: "인용구" },
];

function activeBlockKind(editor: Editor): BlockKind {
  if (editor.isActive("heading")) return "heading";
  if (editor.isActive("blockquote")) return "blockquote";
  return "paragraph";
}

export function EditorToolbar({ editor, articleType, onUpload }: EditorToolbarProps) {
  const [open, setOpen] = useState<OpenPicker>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const state = useEditorState({
    editor,
    selector: ({ editor: ed }) => {
      const blockKind = activeBlockKind(ed);
      return {
        bold: ed.isActive("bold"),
        italic: ed.isActive("italic"),
        underline: ed.isActive("underline"),
        strike: ed.isActive("strike"),
        codeBlock: ed.isActive("codeBlock"),
        link: ed.isActive("link"),
        alignLeft: ed.isActive({ textAlign: "left" }),
        alignCenter: ed.isActive({ textAlign: "center" }),
        alignRight: ed.isActive({ textAlign: "right" }),
        alignJustify: ed.isActive({ textAlign: "justify" }),
        blockKind,
        fontSize: (ed.getAttributes("textStyle").fontSize as string | undefined) ?? "16px",
        lineHeight: (ed.getAttributes(blockKind).lineHeight as string | undefined) ?? "1.5",
        subscript: ed.isActive("subscript"),
        superscript: ed.isActive("superscript"),
        taskList: ed.isActive("taskList"),
        canUndo: ed.can().undo(),
        canRedo: ed.can().redo(),
      };
    },
  });

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(null);
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [open]);

  const toggle = useCallback(
    (p: OpenPicker) => setOpen((cur) => (cur === p ? null : p)),
    []
  );

  const handleColor = (color: string) => {
    editor.chain().focus().setColor(color).run();
    setOpen(null);
  };
  const handleFontSize = (size: string) => {
    editor.chain().focus().setMark("textStyle", { fontSize: size }).run();
    setOpen(null);
  };
  const handleLineHeight = (value: string) => {
    editor.chain().focus().updateAttributes(state.blockKind, { lineHeight: value }).run();
    setOpen(null);
  };
  const handleBlock = (kind: BlockKind) => {
    const chain = editor.chain().focus();
    if (kind === "paragraph") chain.setParagraph().run();
    else if (kind === "heading") chain.setHeading({ level: 2 }).run();
    else chain.setBlockquote().run();
    setOpen(null);
  };
  const handleAlign = (align: Align) => {
    editor.chain().focus().updateAttributes(state.blockKind, { textAlign: align }).run();
  };

  const currentBlockLabel =
    BLOCK_OPTIONS.find((o) => o.kind === state.blockKind)?.label ?? "본문";

  return (
    <div
      ref={containerRef}
      className="flex flex-wrap items-center gap-1 p-2 bg-gray-50 border-b border-gray-300 rounded-t-lg"
    >
      {/* 블록 스타일 드롭다운 */}
      <div className="relative">
        <button
          type="button"
          onClick={() => toggle("block")}
          className="flex items-center gap-1 px-3 py-1.5 rounded hover:bg-gray-100 text-sm text-gray-700 min-w-20"
          title="블록 스타일"
        >
          <span>{currentBlockLabel}</span>
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
        {open === "block" && (
          <div
            className="absolute top-full mt-1 left-0 bg-white border border-gray-300 rounded shadow-lg py-1"
            style={{ zIndex: 60, minWidth: "120px" }}
          >
            {BLOCK_OPTIONS.map((o) => (
              <button
                key={o.kind}
                type="button"
                onClick={() => handleBlock(o.kind)}
                className={`block w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 ${
                  state.blockKind === o.kind ? "text-gray-900 font-medium" : "text-gray-700"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <ToolbarSeparator />

      <ToolbarToggle active={state.bold} onClick={() => editor.chain().focus().toggleBold().run()} Icon={Bold} title="Bold" />
      <ToolbarToggle active={state.italic} onClick={() => editor.chain().focus().toggleItalic().run()} Icon={Italic} title="Italic" />
      <ToolbarToggle active={state.underline} onClick={() => editor.chain().focus().toggleUnderline().run()} Icon={Underline} title="Underline" />
      <ToolbarToggle active={state.strike} onClick={() => editor.chain().focus().toggleStrike().run()} Icon={Strikethrough} title="Strikethrough" />
      <ToolbarToggle active={state.subscript} onClick={() => editor.chain().focus().toggleSubscript().run()} Icon={Subscript} title="아래 첨자" />
      <ToolbarToggle active={state.superscript} onClick={() => editor.chain().focus().toggleSuperscript().run()} Icon={Superscript} title="위 첨자" />

      <ToolbarSeparator />

      {/* 색상 */}
      <div className="relative">
        <ToolbarToggle active={false} onClick={() => toggle("color")} Icon={Palette} title="Text Color" />
        {open === "color" && (
          <div
            className="absolute top-full mt-1 left-0 bg-white border border-gray-300 rounded shadow-lg p-2"
            style={{
              zIndex: 60,
              display: "grid",
              gridTemplateColumns: "repeat(5, 24px)",
              gap: "8px",
            }}
          >
            {COLORS.map((color) => (
              <button
                key={color}
                type="button"
                className="rounded border-2 border-gray-200 hover:border-gray-400"
                style={{ backgroundColor: color, width: "24px", height: "24px" }}
                onClick={() => handleColor(color)}
                title={color}
              />
            ))}
          </div>
        )}
      </div>

      {/* 글자 크기 */}
      <div className="relative">
        <button
          type="button"
          onClick={() => toggle("fontSize")}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded hover:bg-gray-100 text-sm text-gray-700 tabular-nums"
          title="Font Size"
        >
          <span style={{ minWidth: "38px", textAlign: "left" }}>{state.fontSize}</span>
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
        {open === "fontSize" && (
          <ValueList
            values={FONT_SIZES}
            current={state.fontSize}
            onSelect={handleFontSize}
            minWidth="88px"
          />
        )}
      </div>

      {/* 줄 간격 */}
      <div className="relative">
        <button
          type="button"
          onClick={() => toggle("lineHeight")}
          className="flex items-center gap-1 p-2 rounded hover:bg-gray-100 text-gray-700"
          title="줄 간격"
        >
          <Rows3 className="h-4 w-4" />
          <ChevronDown className="h-3 w-3" />
        </button>
        {open === "lineHeight" && (
          <ValueList
            values={LINE_HEIGHTS}
            current={state.lineHeight}
            onSelect={handleLineHeight}
            minWidth="80px"
          />
        )}
      </div>

      <ToolbarSeparator />

      <ToolbarToggle active={state.alignLeft} onClick={() => handleAlign("left")} Icon={AlignLeft} title="왼쪽 정렬" />
      <ToolbarToggle active={state.alignCenter} onClick={() => handleAlign("center")} Icon={AlignCenter} title="가운데 정렬" />
      <ToolbarToggle active={state.alignRight} onClick={() => handleAlign("right")} Icon={AlignRight} title="오른쪽 정렬" />
      <ToolbarToggle active={state.alignJustify} onClick={() => handleAlign("justify")} Icon={AlignJustify} title="양끝 정렬" />

      <ToolbarSeparator />

      <ToolbarToggle
        active={state.codeBlock}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        Icon={Code2}
        title="Code Block"
      />
      <ToolbarToggle
        active={state.link}
        onClick={() => {
          const url = prompt("URL을 입력하세요:");
          if (url) editor.chain().focus().setLink({ href: url }).run();
        }}
        Icon={Link2}
        title="Link"
      />
      <ToolbarToggle
        active={false}
        onClick={() => {
          const input = document.createElement("input");
          input.type = "file";
          input.accept = "image/*";
          input.onchange = async () => {
            const file = input.files?.[0];
            if (!file) return;
            onUpload?.(true);
            const fd = new FormData();
            fd.append("file", file);
            fd.append("articleType", articleType ?? "feed");
            try {
              const res = await fetch("/api/admin/upload-image", { method: "POST", body: fd });
              if (!res.ok) throw new Error("업로드 실패");
              const { url } = await res.json();
              editor.chain().focus().setImage({ src: url }).run();
            } catch {
              alert("이미지 업로드 실패");
            } finally {
              onUpload?.(false);
            }
          };
          input.click();
        }}
        Icon={Upload}
        title="이미지 업로드"
      />
      <ToolbarToggle
        active={false}
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        Icon={Minus}
        title="Horizontal Rule"
      />

      <ToolbarSeparator />

      <ToolbarToggle
        active={false}
        onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
        Icon={Table2}
        title="테이블 삽입"
      />
      <ToolbarToggle
        active={state.taskList}
        onClick={() => editor.chain().focus().toggleTaskList().run()}
        Icon={ListChecks}
        title="체크리스트"
      />
      <ToolbarToggle
        active={false}
        onClick={() => {
          const url = prompt("YouTube URL을 입력하세요:");
          if (url) editor.chain().focus().setYoutubeVideo({ src: url }).run();
        }}
        Icon={Play}
        title="YouTube 임베드"
      />
      <ToolbarToggle
        active={false}
        onClick={() => editor.chain().focus().insertContent({ type: "math", attrs: { latex: "" } }).run()}
        Icon={Sigma}
        title="수식 삽입"
      />

      <ToolbarSeparator />

      <ToolbarToggle
        active={false}
        onClick={() => editor.chain().focus().undo().run()}
        Icon={Undo2}
        title="Undo"
        disabled={!state.canUndo}
      />
      <ToolbarToggle
        active={false}
        onClick={() => editor.chain().focus().redo().run()}
        Icon={Redo2}
        title="Redo"
        disabled={!state.canRedo}
      />
    </div>
  );
}

function ValueList({
  values,
  current,
  onSelect,
  minWidth,
}: {
  values: string[];
  current: string;
  onSelect: (v: string) => void;
  minWidth: string;
}) {
  return (
    <div
      className="absolute top-full mt-1 left-0 bg-white border border-gray-300 rounded shadow-lg py-1"
      style={{ zIndex: 60, minWidth }}
    >
      {values.map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => onSelect(v)}
          className={`block w-full text-left px-3 py-1 text-sm hover:bg-gray-100 tabular-nums ${
            current === v ? "text-gray-900 font-medium" : "text-gray-700"
          }`}
        >
          {v}
        </button>
      ))}
    </div>
  );
}
