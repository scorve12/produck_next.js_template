// Tiptap JSON handling — intentionally dependency-free so non-UI server code
// (excerpt generation, search indexing, etc.) doesn't pull the editor bundle.

export type TiptapMark = {
  type: string;
  attrs?: Record<string, unknown>;
};

export type TiptapNode = {
  type: string;
  content?: TiptapNode[];
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: TiptapMaimport type { JSONContent } from "@tiptap/react";
import type { Block } from "@/types/blocks";
import { newBlockId } from "@/types/blocks";

// ── 포맷 판별 함수 ──────────────────────────────────────────────────────────

export function isLegacyBlocks(content: unknown): content is Block[] {
  return Array.isArray(content);
}

export function isTiptapDoc(content: unknown): content is JSONContent {
  return (
    typeof content === "object" &&
    content !== null &&
    !Array.isArray(content) &&
    (content as Record<string, unknown>).type === "doc"
  );
}

// ── 정규화 헬퍼 (저장된 JSONB / 폼 입력 둘 다) ───────────────────────────────

/**
 * 에디터 초기 콘텐츠를 정규화한다.
 * Block[] 이면 Tiptap 문서로 변환, 이미 doc이면 그대로 반환.
 * 알 수 없는 형식은 undefined (에디터가 빈 문서로 시작).
 */
export function normalizeInitialContent(raw: unknown): JSONContent | undefined {
  if (!raw) return undefined;
  if (isTiptapDoc(raw)) return raw;
  if (isLegacyBlocks(raw)) return blocksToTiptapDoc(raw);
  return undefined;
}

/**
 * DB에 저장된 콘텐츠를 두 포맷 중 하나로 정규화 (렌더러 분기용).
 * 미정의/잘못된 형식은 빈 Block[] 반환.
 */
export function normalizeStoredContent(raw: unknown): Block[] | JSONContent {
  if (isTiptapDoc(raw)) return raw;
  if (isLegacyBlocks(raw)) return raw;
  return [];
}

/**
 * 저장된 JSONB 콘텐츠를 Block[] / Tiptap doc 두 채널로 분리한다.
 * - `legacyBlocks`: ID 보장된 Block 배열 (포맷이 doc 인 경우 빈 배열)
 * - `tiptapDoc`: Tiptap 문서 (그 외 undefined)
 * - `combined`: 둘 중 비어있지 않은 쪽 (UI 분기용 단일 값)
 */
export function parseStoredContent(raw: unknown): {
  legacyBlocks: Block[];
  tiptapDoc?: JSONContent;
  combined?: Block[] | JSONContent;
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

// ── Block[] → Tiptap JSONContent 변환 ────────────────────────────────────

/**
 * 기존 Block[] 포맷을 Tiptap JSON 문서로 변환한다.
 * portfolio-only 블록은 커스텀 노드 속성으로 저장된다.
 */
export function blocksToTiptapDoc(blocks: Block[]): JSONContent {
  const content: JSONContent[] = blocks.map((block) => blockToTiptapNode(block));
  return {
    type: "doc",
    content: content.length > 0 ? content : [{ type: "paragraph" }],
  };
}

function blockToTiptapNode(block: Block): JSONContent {
  switch (block.type) {
    // ── 텍스트 블록 ──
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

    // ── 목록 블록 ──
    case "bulletList":
      return {
        type: "bulletList",
        content: block.items.map((item) => ({
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: item }],
            },
          ],
        })),
      };

    case "numberedList":
      return {
        type: "orderedList",
        content: block.items.map((item) => ({
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: item }],
            },
          ],
        })),
      };

    // ── 미디어 및 코드 ──
    case "image":
      return {
        type: "image",
        attrs: {
          src: block.url,
          alt: block.caption || "",
        },
      };

    case "code":
      return {
        type: "codeBlock",
        attrs: { language: block.language || "javascript" },
        content: [{ type: "text", text: block.code }],
      };

    // ── 포트폴리오 전용 블록 ──
    case "highlights":
      return {
        type: "highlights",
        attrs: { items: block.items },
      };

    case "deliverables":
      return {
        type: "deliverables",
        attrs: { items: block.items },
      };

    case "activity":
      return {
        type: "activity",
        attrs: { events: block.events },
      };

    // ── 레거시 블록 ──
    case "section": {
      // section: heading + body 문단들로 변환
      // 주의: section 블록 자체는 단일 노드이므로 doc으로 반환하면 안 됨
      // 대신 문단들의 배열로 반환하여 blocksToTiptapDoc에서 처리하도록 함
      // 이는 실제로 여러 노드를 반환해야 하는 문제가 있으므로,
      // 다른 블록들과 일관되게 처리하기 위해 커스텀 블록 타입으로 정의
      return {
        type: "section",
        attrs: {
          heading: block.heading,
          body: block.body,
        },
      };
    }

    case "summary":
      return {
        type: "paragraph",
        content: block.text ? [{ type: "text", text: block.text }] : [],
      };

    default:
      return { type: "paragraph" };
  }
}

// ── Tiptap JSONContent → TOC 추출 ────────────────────────────────────────

export type TocEntry = {
  id: string;
  text: string;
  level: 1 | 2 | 3;
};

/**
 * Tiptap JSON 문서에서 제목 블록을 추출하여 TOC를 생성한다.
 * 각 제목에 id를 부여한다 (e.g. "heading-0", "heading-1").
 */
export function extractTiptapToc(doc: JSONContent): TocEntry[] {
  const toc: TocEntry[] = [];
  let headingIndex = 0;

  function walkNodes(nodes: JSONContent[] | undefined) {
    if (!nodes) return;
    nodes.forEach((node) => {
      if (node.type === "heading") {
        const level = (node.attrs?.level ?? 2) as 1 | 2 | 3;
        const text = extractTextFromNode(node);
        toc.push({
          id: `heading-${headingIndex}`,
          text,
          level,
        });
        headingIndex += 1;
      }
      // 중첩 노드 재귀 처리 (필요하면)
      if (node.content) {
        walkNodes(node.content);
      }
    });
  }

  walkNodes(doc.content);
  return toc;
}

/**
 * Tiptap 노드에서 텍스트 콘텐츠를 추출한다.
 */
function extractTextFromNode(node: JSONContent): string {
  if (!node.content) {
    return node.text || "";
  }
  return node.content
    .map((child) => extractTextFromNode(child))
    .join("");
}
rk[];
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
