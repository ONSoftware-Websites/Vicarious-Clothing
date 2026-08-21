import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui";
import { getPostBySlug, listPosts } from "@/lib/server/store";
import { SITE_URL } from "@/lib/site";
import { formatDate, seedImage } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: post.coverImage
        ? [{ url: post.coverImage }]
        : undefined,
      type: "article",
    },
  };
}

export default async function JournalPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const others = (await listPosts())
    .filter((p) => p.slug !== post.slug)
    .slice(0, 2);

  return (
    <Container className="py-12 sm:py-16">
      <article className="mx-auto max-w-3xl">
        <nav aria-label="Breadcrumb" className="mb-8">
          <Link
            href="/journal"
            className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint underline underline-offset-2 hover:text-accent-deep"
          >
            ← Journal
          </Link>
        </nav>

        <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.24em] text-accent-deep">
          {formatDate(post.publishedAt)}
        </p>
        <h1 className="font-display text-3xl font-semibold uppercase leading-tight tracking-tight sm:text-5xl">
          {post.title}
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-ink-soft">
          {post.excerpt}
        </p>

        <div className="relative mt-8 aspect-[16/9] overflow-hidden bg-cream">
          <Image
            src={post.coverImage ?? seedImage(`vc-post-${post.id}`, 1200, 750)}
            alt={post.title}
            fill
            priority
            sizes="(min-width: 768px) 768px, 100vw"
            className="object-cover"
          />
        </div>

        <div className="mt-10 space-y-6">
          {post.body.map((paragraph, i) => (
            <p key={i} className="text-base leading-[1.85] text-ink-soft">
              {paragraph}
            </p>
          ))}
        </div>
      </article>

      {others.length > 0 && (
        <section className="mx-auto mt-20 max-w-3xl border-t border-line pt-10">
          <h2 className="mb-6 font-display text-sm font-semibold uppercase tracking-[0.2em]">
            More from the journal
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {others.map((other) => (
              <Link
                key={other.id}
                href={`/journal/${other.slug}`}
                className="group block"
              >
                <h3 className="font-display text-base font-semibold uppercase leading-tight tracking-tight transition-colors group-hover:text-accent-deep">
                  {other.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  {other.excerpt}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="mx-auto mt-16 max-w-3xl border-t border-line pt-8 text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">
          Seen something you like?{" "}
          <Link
            href="/shop"
            className="text-accent-deep underline underline-offset-2"
          >
            Shop everything
          </Link>{" "}
          ·{" "}
          <Link
            href={SITE_URL}
            className="text-accent-deep underline underline-offset-2"
          >
            Vicarious Clothing
          </Link>
        </p>
      </div>
    </Container>
  );
}
