import "server-only";
import { createServerClient } from "@/lib/supabase/server";

export type BaseArticleRow<M = Record<string, unknown>> = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: unknown;
  cover_image_url: string | null;
  metadata: M | null;
  published_at: string | null;
  sort_order: number | null;
  status: string;
  category: string;
};

export async function listArticles<T>(category: string, select: string): Promise<T[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("articles")
    .select(select)
    .eq("category", category)
    .eq("status", "published")
    .is("deleted_at", null)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(`listArticles(${category}): ${error.message}`);
  return data as unknown as T[];
}

export async function getArticleBySlug<T>(
  category: string,
  slug: string,
  select: string,
): Promise<T | null> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("articles")
    .select(select)
    .eq("category", category)
    .eq("status", "published")
    .eq("slug", slug)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw new Error(`getArticleBySlug(${category}, ${slug}): ${error.message}`);
  return data as unknown as T | null;
}
