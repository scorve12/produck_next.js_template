"use server";

import { createArticleActions } from "@/app/admin/_lib/article-actions";
import { FEED_DEFAULT_THUMBNAIL_BG, FEED_DEFAULT_THUMBNAIL_ICON } from "@/lib/db/feed";

const feedActions = createArticleActions(
  "feed",
  { listPath: "/admin/feed", publicPath: "/feed" },
  (formData) => ({
    author: String(formData.get("author") ?? "").trim() || undefined,
    readTime: String(formData.get("readTime") ?? "").trim() || undefined,
    displayDate: String(formData.get("displayDate") ?? "").trim() || undefined,
    subcategory: String(formData.get("subcategory") ?? "").trim() || undefined,
    thumbnail: {
      bg: String(formData.get("thumbnail_bg") ?? FEED_DEFAULT_THUMBNAIL_BG),
      icon: String(formData.get("thumbnail_icon") ?? FEED_DEFAULT_THUMBNAIL_ICON),
    },
  }),
);

export async function createFeed(formData: FormData) {
  return feedActions.create(formData);
}

export async function updateFeed(id: string, formData: FormData) {
  return feedActions.update(id, formData);
}

export async function deleteFeed(id: string, opts?: { redirectAfter?: boolean }) {
  return feedActions.remove(id, opts);
}
