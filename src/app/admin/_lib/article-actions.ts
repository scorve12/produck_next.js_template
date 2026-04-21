import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/supabase/auth";
import { TENANT_ID } from "@/lib/supabase/tenant";
import { isLegacyBlocks, isTiptapDoc } from "@/lib/supabase/content";

// Server Actions run outside of the SSR cookie context so auth-based RLS
// cannot be evaluated. App-level RBAC (requireAdmin) is the access gate;
// the actual DB writes use service role to bypass RLS safely.
function createAdminDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export type ArticleStatus = "draft" | "published";

type Session = { userId: string };

type Paths = { listPath: string; publicPath: string };

type BuildArgs<TMeta> = {
  formData: FormData;
  session: Session;
  category: string;
  buildMetadata: (formData: FormData) => TMeta;
};

function parseContent(value: FormDataEntryValue | null): unknown[] | Record<string, unknown> {
  if (typeof value !== "string" || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    if (isTiptapDoc(parsed)) return parsed as Record<string, unknown>;
    if (isLegacyBlocks(parsed)) return parsed as unknown[];
    return [];
  } catch {
    return [];
  }
}

function buildArticlePayload<TMeta>({
  formData,
  session,
  category,
  buildMetadata,
}: BuildArgs<TMeta>) {
  const title = String(formData.get("title") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const excerpt = String(formData.get("excerpt") ?? "").trim();
  const status = String(formData.get("status") ?? "draft") as ArticleStatus;
  const sort_order = Number(formData.get("sort_order") ?? 0) || 0;
  const content = parseContent(formData.get("blocks"));
  const metadata = buildMetadata(formData);

  return {
    tenant_id: TENANT_ID,
    author_id: session.userId,
    category,
    title,
    slug,
    excerpt,
    status,
    sort_order,
    content,
    metadata,
    published_at: status === "published" ? new Date().toISOString() : null,
  };
}

export type ArticleActions = {
  create: (formData: FormData) => Promise<void>;
  update: (id: string, formData: FormData) => Promise<void>;
  remove: (id: string, opts?: { redirectAfter?: boolean }) => Promise<void>;
};

/**
 * Article CRUD 서버 액션 팩토리.
 * category 별로 메타데이터 빌더와 revalidate 경로만 다르게 주입한다.
 */
export function createArticleActions<TMeta>(
  category: string,
  paths: Paths,
  buildMetadata: (formData: FormData) => TMeta,
): ArticleActions {
  const op = (label: string) => `[${category}/${label}]`;

  async function create(formData: FormData) {
    const session = await requireAdmin("editor");
    const supabase = await createAdminDb();

    const payload = buildArticlePayload({ formData, session, category, buildMetadata });
    const { error } = await supabase.from("articles").insert(payload);
    if (error) throw new Error(`${op("create")} ${error.message}`);

    revalidatePath(paths.listPath);
    revalidatePath(paths.publicPath);
    redirect(paths.listPath);
  }

  async function update(id: string, formData: FormData) {
    const session = await requireAdmin("editor");
    const supabase = await createAdminDb();

    const payload = buildArticlePayload({ formData, session, category, buildMetadata });
    const { author_id: _ignored, ...updateFields } = payload;
    void _ignored;

    const { error } = await supabase
      .from("articles")
      .update(updateFields)
      .eq("id", id);
    if (error) throw new Error(`${op("update")} ${error.message}`);

    revalidatePath(paths.listPath);
    revalidatePath(paths.publicPath);
    revalidatePath(`${paths.publicPath}/${payload.slug}`);
    redirect(paths.listPath);
  }

  async function remove(id: string, opts?: { redirectAfter?: boolean }) {
    await requireAdmin("admin");
    const supabase = await createAdminDb();

    const { error } = await supabase
      .from("articles")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw new Error(`${op("delete")} ${error.message}`);

    revalidatePath(paths.listPath);
    revalidatePath(paths.publicPath);

    if (opts?.redirectAfter) redirect(paths.listPath);
  }

  return { create, update, remove };
}
