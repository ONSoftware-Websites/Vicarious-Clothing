import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { Container } from "@/components/ui";
import { HELP_TOPICS, EMAILS, FREE_DELIVERY_THRESHOLD, STANDARD_DELIVERY_COST, EXPRESS_DELIVERY_COST } from "@/lib/site";
import type { Condition } from "@/lib/types";
import { CONDITION_LABELS } from "@/lib/utils";

export const dynamic = "force-dynamic";

const CONDITIONS_ORDER: Condition[] = [
  "new_with_tags",
  "new_without_tags",
  "excellent",
  "very_good",
  "good",
  "fair",
];

const CONDITION_MEANINGS: Record<Condition, string> = {
  new_with_tags: "Unused with original tags attached.",
  new_without_tags: "Unused but no original tags.",
  excellent: "Minimal or no obvious signs of previous wear.",
  very_good:
    "Light signs of previous wear; no significant defects unless specifically disclosed.",
  good: "Noticeable signs of wear; all material defects disclosed.",
  fair: "Significant visible wear but still considered saleable.",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const topic = HELP_TOPICS.find((t) => t.slug === slug);
  if (!topic) return {};
  return {
    title: topic.title,
    description: topic.description,
  };
}

function HelpLayout({
  topic,
  children,
}: {
  topic: (typeof HELP_TOPICS)[number];
  children: ReactNode;
}) {
  return (
    <Container className="grid grid-cols-1 gap-12 py-12 sm:py-16 lg:grid-cols-4">
      <aside className="lg:col-span-1">
        <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.24em] text-accent-deep">
          Help
        </p>
        <nav aria-label="Help topics" className="flex flex-row flex-wrap gap-x-6 gap-y-2 lg:flex-col">
          {HELP_TOPICS.map((t) => (
            <Link
              key={t.slug}
              href={`/help/${t.slug}`}
              className={
                t.slug === topic.slug
                  ? "font-display text-sm font-semibold uppercase tracking-[0.14em] text-accent-deep"
                  : "font-display text-sm uppercase tracking-[0.14em] text-ink-soft hover:text-accent-deep"
              }
            >
              {t.title}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="lg:col-span-3">
        <h1 className="mb-8 border-b border-line pb-6 font-display text-3xl font-semibold uppercase tracking-tight sm:text-4xl">
          {topic.title}
        </h1>
        {children}
      </div>
    </Container>
  );
}

function Prose({ children }: { children: ReactNode }) {
  return (
    <div className="max-w-2xl space-y-5 text-sm leading-relaxed text-ink-soft [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:uppercase [&_h2]:tracking-tight [&_h2]:text-ink [&_strong]:text-ink">
      {children}
    </div>
  );
}

export default async function HelpPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const topic = HELP_TOPICS.find((t) => t.slug === slug);
  if (!topic) notFound();

  let content: ReactNode = null;

  switch (slug) {
    case "contact":
      content = (
        <Prose>
          <p>
            The fastest way to reach us is email. We answer everything within
            one working day, usually much faster.
          </p>
          <div className="space-y-2">
            <p>
              <strong>General enquiries</strong> —{" "}
              <a href={`mailto:${EMAILS.general}`} className="text-accent-deep underline underline-offset-2">
                {EMAILS.general}
              </a>
            </p>
            <p>
              <strong>Orders</strong> —{" "}
              <a href={`mailto:${EMAILS.orders}`} className="text-accent-deep underline underline-offset-2">
                {EMAILS.orders}
              </a>
            </p>
            <p>
              <strong>Returns & support</strong> —{" "}
              <a href={`mailto:${EMAILS.support}`} className="text-accent-deep underline underline-offset-2">
                {EMAILS.support}
              </a>
            </p>
          </div>
          <p>
            Selling to us? Head over to{" "}
            <Link href="/sell-to-us" className="text-accent-deep underline underline-offset-2">
              Sell To Us
            </Link>{" "}
            and use the form — photos included.
          </p>
        </Prose>
      );
      break;

    case "delivery":
      content = (
        <Prose>
          <p>
            Everything ships from our studio, tracked, within 2 working days of
            your order. You&apos;ll get a tracking link as soon as it leaves.
          </p>
          <h2>UK delivery</h2>
          <ul className="list-inside list-disc space-y-2">
            <li>
              Standard (Royal Mail Tracked 48) — {`£${STANDARD_DELIVERY_COST.toFixed(2)}`}
            </li>
            <li>
              Express (Royal Mail Tracked 24) — {`£${EXPRESS_DELIVERY_COST.toFixed(2)}`}
            </li>
            <li>
              Free standard delivery on orders over £{FREE_DELIVERY_THRESHOLD}
            </li>
          </ul>
          <h2>Packaging</h2>
          <p>
            Pieces are folded and packed in recyclable mailers. Footwear ships
            in a reinforced box. Every order includes a returns slip.
          </p>
        </Prose>
      );
      break;

    case "returns":
      content = (
        <Prose>
          <p>Changed your mind? No problem. You have 14 days from delivery.</p>
          <h2>How to return</h2>
          <ol className="list-decimal space-y-2 pl-5">
            <li>
              Email{" "}
              <a href={`mailto:${EMAILS.support}`} className="text-accent-deep underline underline-offset-2">
                {EMAILS.support}
              </a>{" "}
              with your order number.
            </li>
            <li>We&apos;ll send you a returns label.</li>
            <li>Post the piece back in the condition it arrived.</li>
            <li>We refund within 5 working days of receiving it.</li>
          </ol>
          <p>
            Items should be returned unworn and in the condition they were
            sent, with any tags still attached.
          </p>
        </Prose>
      );
      break;

    case "faqs":
      content = (
        <Prose>
          {[
            {
              q: "Are the photos of the actual item?",
              a: "Always. Every listing is photographed in our studio — no stock photos, no screenshots.",
            },
            {
              q: "Is everything authentic?",
              a: "Yes. Pieces are checked against brand details before listing. If we're not sure, it doesn't go up.",
            },
            {
              q: "Can I reserve an item?",
              a: "Items are reserved automatically while you're checking out. Once a piece sells, it's gone — most things are one of one.",
            },
            {
              q: "Do you buy from the public?",
              a: "Yes — see the Sell To Us page. Tell us what you've got and we'll come back with an offer.",
            },
            {
              q: "Do you ship internationally?",
              a: "UK only for now. We're working on it.",
            },
          ].map((item) => (
            <div key={item.q}>
              <h2>{item.q}</h2>
              <p>{item.a}</p>
            </div>
          ))}
        </Prose>
      );
      break;

    case "size-guide":
      content = (
        <Prose>
          <p>
            Every listing includes hand-taken measurements. Compare them with a
            piece you already own and love the fit of — it&apos;s more reliable
            than the size label, because sizing varies wildly between brands
            and eras.
          </p>
          <h2>How we measure</h2>
          <ul className="list-inside list-disc space-y-2">
            <li>
              <strong>Pit to pit</strong> — chest width, seam to seam under the arms, laid flat
            </li>
            <li>
              <strong>Length</strong> — top of the collar to the hem
            </li>
            <li>
              <strong>Sleeve</strong> — shoulder seam to cuff
            </li>
            <li>
              <strong>Waist</strong> — across the waistband, laid flat
            </li>
            <li>
              <strong>Rise</strong> — crotch seam to top of waistband
            </li>
            <li>
              <strong>Inseam</strong> — crotch seam to hem
            </li>
          </ul>
          <p>
            Not sure? Email us with a piece you wear often and we&apos;ll help
            you compare.
          </p>
        </Prose>
      );
      break;

    case "condition-guide":
      content = (
        <div className="max-w-2xl">
          <p className="mb-8 text-sm leading-relaxed text-ink-soft">
            Every piece is graded on a six-point scale. The grade is a summary,
            not a replacement for item-specific disclosure — any known defect
            is also photographed and written in the listing.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-ink text-left">
                  <th className="py-3 pr-4 font-display text-xs font-semibold uppercase tracking-[0.16em]">
                    Grade
                  </th>
                  <th className="py-3 font-display text-xs font-semibold uppercase tracking-[0.16em]">
                    Meaning
                  </th>
                </tr>
              </thead>
              <tbody>
                {CONDITIONS_ORDER.map((c) => (
                  <tr key={c} className="border-b border-line align-top">
                    <td className="py-4 pr-4 font-mono text-xs uppercase tracking-[0.1em] text-accent-deep">
                      {CONDITION_LABELS[c]}
                    </td>
                    <td className="py-4 text-ink-soft">{CONDITION_MEANINGS[c]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
      break;
  }

  return <HelpLayout topic={topic}>{content}</HelpLayout>;
}
