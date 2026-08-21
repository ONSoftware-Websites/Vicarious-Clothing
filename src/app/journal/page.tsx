import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui";
import { listPosts } from "@/lib/server/store";
import { formatDate, seedImage } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Journal",
  description:
    "Stories from Vicarious Clothing — how we grade condition, why one-of-one matters, and what makes a Vicarious Pick.",
};

export default async function JournalPage() {
  const posts = await listPosts();

  return (
    <Container className="py-12 sm:py-16">
      <div className="mb-10 border-b border-line pb-8">
        <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.24em] text-accent-deep">
          Journal
        </p>
        <h1 className="font-display text-3xl font-semibold uppercase tracking-tight sm:text-4xl">
          Notes from the rails
        </h1>
        <p className="mt-3 max-w-xl text-ink-soft">
          How the store works, why it works that way, and what we&apos;re
          finding along the way.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-x-8 gap-y-14 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((post, i) => (
          <Link
            key={post.id}
            href={`/journal/${post.slug}`}
            className="group block"
          >
            <div className="relative aspect-[16/10] overflow-hidden bg-cream">
              <Image
                src={post.coverImage ?? seedImage(`vc-post-${post.id}`, 1200, 750)}
                alt={post.title}
                fill
                priority={i === 0}
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
            </div>
            <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint">
              {formatDate(post.publishedAt)}
            </p>
            <h2 className="mt-2 font-display text-xl font-semibold uppercase leading-tight tracking-tight transition-colors group-hover:text-accent-deep">
              {post.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              {post.excerpt}
            </p>
            <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.16em] text-accent-deep">
              Read →
            </p>
          </Link>
        ))}
      </div>

      {posts.length === 0 && (
        <div className="py-24 text-center">
          <p className="font-display text-xl font-semibold uppercase">
            Nothing written yet.
          </p>
          <p className="mt-2 text-ink-soft">The first entry is on its way.</p>
        </div>
      )}
    </Container>
  );
}
