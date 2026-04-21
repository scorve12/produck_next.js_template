// ── 노션 스타일 블록 에디터 — 블록 타입 정의 ────────────────────────────────

export type ParagraphBlock    = { id: string; type: "paragraph";    text: string };
export type Heading1Block     = { id: string; type: "heading1";     text: string };
export type Heading2Block     = { id: string; type: "heading2";     text: string };
export type Heading3Block     = { id: string; type: "heading3";     text: string };
export type QuoteBlock        = { id: string; type: "quote";        text: string };
export type DividerBlock      = { id: string; type: "divider" };
export type BulletListBlock   = { id: string; type: "bulletList";   items: string[] };
export type NumberedListBlock = { id: string; type: "numberedList"; items: string[] };
export type ImageBlock        = { id: string; type: "image";        url: string; caption?: string; source: "upload" | "url" };
export type CodeBlock         = { id: string; type: "code";         code: string; language: string };

// Portfolio 전용 구조 블록
export type HighlightsBlock   = { id: string; type: "highlights";   items: string[] };
export type DeliverablesBlock = { id: string; type: "deliverables"; items: string[] };
export type ActivityBlock     = { id: string; type: "activity";     events: ActivityEvent[] };

export type ActivityEvent = {
  date: string;
  title: string;
  description?: string;
};

// 레거시 하위 호환 타입 (id는 런타임에서 항상 보장되므로 required로 선언)
export type LegacySectionBlock   = { id: string; type: "section";  heading: string; body: string[] };
export type LegacySummaryBlock   = { id: string; type: "summary";  text: string };

export type Block =
  | ParagraphBlock
  | Heading1Block
  | Heading2Block
  | Heading3Block
  | QuoteBlock
  | DividerBlock
  | BulletListBlock
  | NumberedListBlock
  | ImageBlock
  | CodeBlock
  | HighlightsBlock
  | DeliverablesBlock
  | ActivityBlock
  | LegacySectionBlock
  | LegacySummaryBlock;

export type BlockType = Block["type"];

// "/" 커맨드 팔레트 항목 정의
export type TiptapSlashType = BlockType | "table" | "taskList" | "youtube" | "math";

export type SlashCommandItem = {
  type: TiptapSlashType;
  label: string;
  description: string;
  icon: string; // lucide icon name
};

export const SLASH_COMMANDS: SlashCommandItem[] = [
  { type: "paragraph",    label: "텍스트",       description: "일반 문단 텍스트",        icon: "AlignLeft" },
  { type: "heading1",     label: "제목 1",        description: "크고 굵은 제목",          icon: "Heading1" },
  { type: "heading2",     label: "제목 2",        description: "중간 크기 제목",          icon: "Heading2" },
  { type: "heading3",     label: "제목 3",        description: "소제목",                 icon: "Heading3" },
  { type: "quote",        label: "인용",          description: "인용 블록",              icon: "Quote" },
  { type: "bulletList",   label: "불릿 목록",     description: "순서 없는 목록",          icon: "List" },
  { type: "numberedList", label: "번호 목록",     description: "순서 있는 번호 목록",     icon: "ListOrdered" },
  { type: "image",        label: "이미지",        description: "이미지 업로드 또는 URL",  icon: "Image" },
  { type: "code",         label: "코드",          description: "코드 블록 (구문 하이라이팅)", icon: "Code2" },
  { type: "divider",      label: "구분선",        description: "수평 구분선",             icon: "Minus" },
  { type: "highlights",   label: "핵심 성과",     description: "번호 카드 목록 (포트폴리오)", icon: "Sparkles" },
  { type: "deliverables", label: "산출물",        description: "체크리스트 항목",         icon: "Package" },
  { type: "activity",     label: "활동 타임라인", description: "날짜별 활동 기록",        icon: "CalendarDays" },
  { type: "table",        label: "테이블",        description: "3×3 테이블 삽입",         icon: "Table2" },
  { type: "taskList",     label: "체크리스트",    description: "체크박스가 있는 목록",    icon: "ListChecks" },
  { type: "youtube",      label: "유튜브",        description: "YouTube 영상 임베드",     icon: "Youtube" },
  { type: "math",         label: "수식",          description: "LaTeX 수학 수식",         icon: "Sigma" },
];

// ID 생성 헬퍼
export function newBlockId(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 12);
}

// 빈 블록 생성 헬퍼
export function createBlock(type: BlockType): Block {
  const id = newBlockId();
  switch (type) {
    case "paragraph":    return { id, type, text: "" };
    case "heading1":     return { id, type, text: "" };
    case "heading2":     return { id, type, text: "" };
    case "heading3":     return { id, type, text: "" };
    case "quote":        return { id, type, text: "" };
    case "divider":      return { id, type };
    case "bulletList":   return { id, type, items: [""] };
    case "numberedList": return { id, type, items: [""] };
    case "image":        return { id, type, url: "", caption: "", source: "url" };
    case "code":         return { id, type, code: "", language: "javascript" };
    case "highlights":   return { id, type, items: [""] };
    case "deliverables": return { id, type, items: [""] };
    case "activity":     return { id, type, events: [{ date: "", title: "", description: "" }] };
    case "section":      return { id, type: "section", heading: "", body: [""] };
    case "summary":      return { id, type: "summary", text: "" };
  }
}
