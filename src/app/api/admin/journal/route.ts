import type { NextRequest } from "next/server";
import type { JournalPost } from "@/lib/types";
import { requireAdminApi } from "@/lib/server/admin-auth";
import { deletePost, upsertPost } from "@/lib/server/store";
import { slugify } from "@/lib/utils";

export async function POST(request: NextRequest) {
  const authError = await requireAdminApi();
  if (authError) return authError;

  try {
    const body = await request.json();
    const action = String(body.action ?? "save");

    if (action === "delete") {
      deletePost(String(body.id), "Henry");
      return Response.json({ ok: true });
    }

    if (action === "save") {
      const post = body.post as Partial<JournalPost>;
      if (!post.title) {
        return Response.json({ error: "Missing title" }, { status: 400 });
      }

      const slugBase = slugify(post.title);
      const slug = post.slug && post.slug !== slugBase ? post.slug : `${slugBase}-${Date.now().toString(36).slice(-4)}`;

      const full: JournalPost = {
        id: post.id ?? `post-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        slug,
        title: String(post.title),
        excerpt: String(post.excerpt ?? ""),
        body: Array.isArray(post.body)
          ? post.body.filter(Boolean).map(String)
          : [],
        coverImage: post.coverImage ? String(post.coverImage) : undefined,
        published: Boolean(post.published),
        publishedAt: post.publishedAt
          ? String(post.publishedAt)
          : new Date().toISOString(),
      };

      upsertPost(full, "Henry");
      return Response.json({ ok: true, post: full });
    }

    return Response.json({ error: "Unknown action" }, { status: 400 });
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
}
