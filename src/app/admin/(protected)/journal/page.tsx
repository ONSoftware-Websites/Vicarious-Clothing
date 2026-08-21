import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { JournalForm } from "@/components/admin/journal-form";
import { JournalRow } from "@/components/admin/journal-row";
import { listPosts } from "@/lib/server/store";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Journal" };

export default async function AdminJournalPage() {
  const posts = await listPosts(true);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold uppercase tracking-tight">
          Journal
        </h1>
        <p className="mt-1 max-w-xl text-sm text-ink-soft">
          Long-form content for the site — condition explainers, drop stories,
          and everything that makes the brand more than a shop.
        </p>
      </div>

      <JournalForm />

      <div className="overflow-x-auto border border-line">
        <table className="w-full min-w-[700px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-line bg-cream text-left">
              <th className="px-4 py-3 font-display text-[10px] font-semibold uppercase tracking-[0.16em]">Post</th>
              <th className="px-4 py-3 font-display text-[10px] font-semibold uppercase tracking-[0.16em]">Status</th>
              <th className="px-4 py-3 font-display text-[10px] font-semibold uppercase tracking-[0.16em]">Published</th>
              <th className="px-4 py-3 font-display text-[10px] font-semibold uppercase tracking-[0.16em]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post.id} className="border-b border-line align-top hover:bg-cream/50">
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    {post.coverImage && (
                      <Image
                        src={post.coverImage}
                        alt=""
                        width={56}
                        height={35}
                        className="h-[35px] w-14 object-cover"
                      />
                    )}
                    <div>
                      <p className="font-display text-sm font-medium">{post.title}</p>
                      <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-faint">
                        /journal/{post.slug}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span
                    className={
                      post.published
                        ? "border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-emerald-800"
                        : "border border-line px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-faint"
                    }
                  >
                    {post.published ? "Published" : "Draft"}
                  </span>
                </td>
                <td className="px-4 py-4 font-mono text-xs">
                  {formatDate(post.publishedAt)}
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/journal/${post.slug}`}
                      className="font-mono text-[10px] uppercase tracking-[0.12em] text-accent-deep underline underline-offset-2"
                    >
                      View
                    </Link>
                    <JournalRow id={post.id} title={post.title} />
                  </div>
                </td>
              </tr>
            ))}
            {posts.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center font-mono text-[11px] uppercase tracking-[0.16em] text-ink-faint">
                  No posts yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
