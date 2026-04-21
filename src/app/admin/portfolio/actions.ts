"use server";

import { createArticleActions } from "@/app/admin/_lib/article-actions";

function parseCsv(value: FormDataEntryValue | null): string[] {
  if (typeof value !== "string") return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

const portfolioActions = createArticleActions(
  "portfolio",
  { listPath: "/admin/portfolio", publicPath: "/portfolio" },
  (formData) => ({
    tags: parseCsv(formData.get("tags")),
    period: String(formData.get("period") ?? "").trim() || undefined,
    client: String(formData.get("client") ?? "").trim() || undefined,
    role: String(formData.get("role") ?? "").trim() || undefined,
    stack: parseCsv(formData.get("stack")),
    image: String(formData.get("image") ?? "").trim() || undefined,
    thumbnail: String(formData.get("thumbnail") ?? "").trim() || undefined,
    subcategory: String(formData.get("subcategory") ?? "").trim() || undefined,
  }),
);

export async function createPortfolio(formData: FormData) {
  return portfolioActions.create(formData);
}

export async function updatePortfolio(id: string, formData: FormData) {
  return portfolioActions.update(id, formData);
}

export async function deletePortfolio(id: string, opts?: { redirectAfter?: boolean }) {
  return portfolioActions.remove(id, opts);
}
