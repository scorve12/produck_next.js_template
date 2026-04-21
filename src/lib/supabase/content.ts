// Tiptap JSON handling — intentionally dependency-free so non-UI server code
// (excerpt generation, search indexing, etc.) doesn't pull the editor bundle.
import type { Block } from "@/types/blocks";
import { newBlockId } from "@/types/blocks";

export type TiptapMark = {
  type: string;
  attrs?: Record<string, unknown>;
};

export type TiptapNode = {
  type: string;
  content?: TiptapNode[];
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: TiptapMark[];
};

const EMPTY_DOC: TiptapNode = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

export function emptyDoc(): TiptapNode {
  return structuredClone(EMPTY_DOC);
}

export function isTiptapDoc(value: unknown): value is TiptapNode {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as { type?: unknown }).type === "doc"
  );
}

export function isLegacyBlocks(content: unknown): content is Block[] {
  return Array.isArray(content);
}

export function normalizeInitialContent(raw: unknown): TiptapNode | undefined {
  if (!raw) return undefined;
  if (isTiptapDoc(raw)) return raw;
  if (isLegacyBlocks(raw)) return blocksToTiptapDoc(raw);
  return undefined;
}

export function normalizeStoredContent(raw: unknown): Block[] | TiptapNode {
  if (isTiptapDoc(raw)) return raw;
  if (isLegacyBlocks(raw)) return raw;
  return [];
}

export function parseStoredContent(raw: unknown): {
  legacyBlocks: Block[];
  tiptapDoc?: TiptapNode;
  combined?: Block[] | TiptapNode;
} {
  const legacyBlocks: Block[] = isLegacyBlocks(raw)
    ? (raw as Array<Partial<Block> & { type: string }>).map(
        (b): Block => ({ ...b, id: b.id ?? newBlockId() } as Block),
      )
    : [];
  const tiptapDoc = isTiptapDoc(raw) ? raw : undefined;
  const combined = tiptapDoc ?? (legacyBlocks.length > 0 ? legacyBlocks : undefined);
  return { legacyBlocks, tiptapDoc, combined };
}

export function blocksToTiptapDoc(blocks: Block[]): TiptapNode {
  const content: TiptapNode[] = blocks.map((block) => blockToTiptapNode(block));
  return {
    type: "doc",
    content: content.length > 0 ? content : [{ type: "paragraph" }],
  };
}

function blockToTiptapNode(block: Block): TiptapNode {
  switch (block.type) {
    case "paragraph":
      return {
        type: "paragraph",
        content: block.text ? [{ type: "text", text: block.text }] : [],
      };
    case "heading1":
      return {
        type: "heading",
        attrs: { level: 1 },
        content: block.text ? [{ type: "text", text: block.text }] : [],
      };
    case "heading2":
      return {
        type: "heading",
        attrs: { level: 2 },
        content: block.text ? [{ type: "text", text: block.text }] : [],
      };
    case "heading3":
      return {
        type: "heading",
        attrs: { level: 3 },
        content: block.text ? [{ type: "text", text: block.text }] : [],
      };
    case "quote":
      return {
        type: "blockquote",
        content: [
          {
            type: "paragraph",
            content: block.text ? [{ type: "text", text: block.text }] : [],
          },
        ],
      };
    case "divider":
      return { type: "horizontalRule" };
    case "bulletList":
      return {
        type: "bulletList",
        content: block.items.map((item) => ({
          type: "listItem",
          content: [{ type: "paragraph", content: [{ type: "text", text: item }] }],
        })),
      };
    case "numberedList":
      return {
        type: "orderedList",
        content: block.items.map((item) => ({
          type: "listItem",
          content: [{ type: "paragraph", content: [{ type: "text", text: item }] }],
        })),
      };
    case "image":
      return {
        type: "image",
        attrs: { src: block.url, alt: block.caption ?? "" },
      };
    case "code":
      return {
        type: "codeBlock",
        attrs: { language: block.language || "javascript" },
        content: [{ type: "text", text: block.code }],
      };
    case "highlights":
      return { type: "highlights", attrs: { items: block.items } };
    case "deliverables":
      return { type: "deliverables", attrs: { items: block.items } };
    case "activity":
      return { type: "activity", attrs: { events: block.events } };
    case "section":
      return { type: "section", attrs: { heading: block.heading, body: block.body } };
    case "summary":
      return {
        type: "paragraph",
        content: block.text ? [{ type: "text", text: block.text }] : [],
      };
    default:
      return { type: "paragraph" };
  }
}

const BLOCK_SEPARATORS = new Set([
  "paragraph",
  "heading",
  "blockquote",
  "codeBlock",
  "listItem",
  "bulletList",
  "orderedList",
  "horizontalRule",
  "hardBreak",
]);

export function extractText(node: unknown): string {
  if (!node || typeof node !== "object") return "";
  const n = node as TiptapNode;
  if (typeof n.text === "string") return n.text;
  if (!Array.isArray(n.content)) return "";
  const inner = n.content.map(extractText).join("");
  return BLOCK_SEPARATORS.has(n.type) ? `${inner}\n` : inner;
}

export function buildExcerpt(content: unknown, maxLength = 200): string {
  const text = extractText(content).replace(/\s+/g, " ").trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()}…`;
}

export function parseContent(raw: unknown): TiptapNode {
  if (isTiptapDoc(raw)) return raw;
  if (typeof raw === "string" && raw.trim().startsWith("{")) {
    try {
      const parsed = JSON.parse(raw);
      if (isTiptapDoc(parsed)) return parsed;
    } catch {
      // fall through
    }
  }
  return emptyDoc();
}

export type TocEntry = {
  id: string;
  text: string;
  level: 1 | 2 | 3;
};

export function extractTiptapToc(doc: TiptapNode): TocEntry[] {
  const toc: TocEntry[] = [];
  let headingIndex = 0;

  function walkNodes(nodes: TiptapNode[] | undefined) {
    if (!nodes) return;
    nodes.forEach((node) => {
      if (node.type === "heading") {
        const level = (node.attrs?.level ?? 2) as 1 | 2 | 3;
        const text = extractTextFromNode(node);
        toc.push({ id: `heading-${headingIndex}`, text, level });
        headingIndex += 1;
      }
      if (node.content) walkNodes(node.content);
    });
  }

  walkNodes(doc.content);
  return toc;
}

function extractTextFromNode(node: TiptapNode): string {
  if (!node.content) return node.text ?? "";
  return node.content.map((child) => extractTextFromNode(child)).join("");
}
