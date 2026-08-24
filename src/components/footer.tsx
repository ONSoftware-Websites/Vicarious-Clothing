import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { Container } from "@/components/ui";
import { BUSINESS_ADDRESS, EMAILS, TRADING_NAME } from "@/lib/site";

const FOOTER_COLUMNS = [
  {
    title: "Shop",
    links: [
      { label: "New In", href: "/shop/new-in" },
      { label: "All Clothing", href: "/shop" },
      { label: "Sale", href: "/shop/sale" },
      { label: "Brands", href: "/brands" },
    ],
  },
  {
    title: "Help",
    links: [
      { label: "Delivery", href: "/help/delivery" },
      { label: "Returns", href: "/help/returns" },
      { label: "Contact", href: "/help/contact" },
      { label: "Condition Guide", href: "/help/condition-guide" },
      { label: "Size Guide", href: "/help/size-guide" },
      { label: "FAQs", href: "/help/faqs" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Sell To Us", href: "/sell-to-us" },
      { label: "Journal", href: "/journal" },
      { label: "Instagram", href: "https://instagram.com", external: true },
      { label: "TikTok", href: "https://tiktok.com", external: true },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms", href: "/legal/terms" },
      { label: "Returns & Cancellation", href: "/legal/returns" },
      { label: "Delivery", href: "/legal/delivery" },
      { label: "Privacy", href: "/legal/privacy" },
      { label: "Cookies", href: "/legal/cookies" },
      { label: "Sell To Us Terms", href: "/legal/sell-to-us" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-24 border-t border-line bg-ink text-paper">
      <Container className="py-14 lg:py-20">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-12">
          <div className="col-span-2 md:col-span-4">
            <BrandMark size={64} className="mb-6 h-14 w-14" />
            <p className="font-display text-xl font-bold uppercase tracking-[0.08em]">
              Vicarious Clothing
            </p>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-paper/70">
              Curated clothing, ready to go again. Independent pre-owned menswear
              and streetwear, picked piece by piece.
            </p>
            <div className="mt-6 flex gap-6 font-mono text-[11px] uppercase tracking-[0.14em] text-paper/70">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-paper"
              >
                Instagram
              </a>
              <a
                href="https://tiktok.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-paper"
              >
                TikTok
              </a>
            </div>
          </div>

          {FOOTER_COLUMNS.map((col) => (
            <nav
              key={col.title}
              className="md:col-span-2"
              aria-label={col.title}
            >
              <h3 className="mb-4 font-display text-xs font-semibold uppercase tracking-[0.2em] text-paper/50">
                {col.title}
              </h3>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      target={link.external ? "_blank" : undefined}
                      rel={link.external ? "noopener noreferrer" : undefined}
                      className="text-sm text-paper/80 transition-colors hover:text-paper"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-14 border-t border-paper/15 pt-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-paper/50">
              © {new Date().getFullYear()} Vicarious Clothing
            </p>
            <p className="text-xs text-paper/50">
              {EMAILS.general} · {EMAILS.support} · {EMAILS.legal}
            </p>
            <p className="max-w-md text-xs leading-relaxed text-paper/40">
              {TRADING_NAME} is a UK-based independent retailer of pre-owned
              clothing. Legal contact address: {BUSINESS_ADDRESS}.
            </p>
          </div>
        </div>
      </Container>
    </footer>
  );
}
