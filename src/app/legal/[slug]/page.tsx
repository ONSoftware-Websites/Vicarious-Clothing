import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui";
import { LEGAL_TOPICS, EMAILS } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const topic = LEGAL_TOPICS.find((t) => t.slug === slug);
  if (!topic) return {};
  return { title: topic.title };
}

export default async function LegalPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const topic = LEGAL_TOPICS.find((t) => t.slug === slug);
  if (!topic) notFound();

  const sectionsMap: Record<string, Array<[string, string[]]>> = {
    terms: [
      ["Who we are", ["Vicarious Clothing is an independent UK retailer of pre-owned clothing. Contact: " + EMAILS.general + "."]],
      ["What we sell", ["Every product is a pre-owned, second-hand item. Condition grades and any known defects are disclosed in each listing. Slight variations in colour and texture are part of the nature of pre-owned clothing and do not constitute a defect unless disclosed otherwise."]],
      ["Orders & payment", ["Orders are confirmed when payment is authorised. Because most items are one of one, an item may sell while you are browsing; we reserve the right to cancel and refund any order where an item can no longer be supplied."]],
      ["Prices", ["Prices are shown in GBP and include UK VAT where applicable. Prices may change without notice, but confirmed orders are charged at the price shown at checkout."]],
      ["Returns", ["See our Returns page for the full returns policy. Statutory rights are unaffected."]],
      ["Liability", ["Nothing in these terms limits liability that cannot be limited under UK law, including for death or personal injury caused by negligence, or for fraud."]],
      ["Governing law", ["These terms are governed by the laws of England and Wales."]],
    ],
    privacy: [
      ["What we collect", ["Contact details you give us at checkout, order history, delivery addresses, and any enquiries you send. If you opt in, your email address for marketing."]],
      ["Why we collect it", ["To take, fulfil and deliver orders, handle returns, respond to enquiries, and meet our legal obligations around financial records."]],
      ["Marketing", ["Marketing messages are opt-in only and separate from order processing. You can unsubscribe at any time."]],
      ["Who we share it with", ["Delivery carriers (to ship your order), payment processors (to take payment), and service providers who help us run the store. We never sell your data."]],
      ["How long we keep it", ["Order and financial records are kept as required by UK law. Marketing data is kept until you unsubscribe."]],
      ["Your rights", ["You can request access to, correction of, or deletion of your personal data at any time by emailing " + EMAILS.support + "."]],
    ],
    cookies: [
      ["Necessary cookies", ["Required for the store to work — for example keeping your bag contents and remembering cookie choices. These are always on."]],
      ["Optional cookies", ["With your permission we use privacy-respecting analytics to understand how the site is used. No third-party advertising trackers."]],
      ["Managing cookies", ["You can accept, reject or change your choices at any time using the cookie banner controls."]],
    ],
  };

  const sections = sectionsMap[slug] ?? [];

  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-2 border-b border-line pb-8 font-display text-3xl font-semibold uppercase tracking-tight sm:text-4xl">
          {topic.title}
        </h1>
        <p className="mb-10 mt-4 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-faint">
          Last updated: August 2026
        </p>
        <div className="space-y-10">
          {sections.map(([heading, paragraphs]) => (
            <section key={heading}>
              <h2 className="mb-3 font-display text-lg font-semibold uppercase tracking-tight">
                {heading}
              </h2>
              {paragraphs.map((p) => (
                <p key={p.slice(0, 24)} className="mb-3 text-sm leading-relaxed text-ink-soft">
                  {p}
                </p>
              ))}
            </section>
          ))}
        </div>
      </div>
    </Container>
  );
}
