import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui";
import {
  BUSINESS_ADDRESS,
  BUSINESS_ADDRESS_LINES,
  EMAILS,
  EXPRESS_DELIVERY_COST,
  FREE_DELIVERY_THRESHOLD,
  LEGAL_TOPICS,
  SITE_NAME,
  SITE_URL,
  STANDARD_DELIVERY_COST,
  TRADING_NAME,
} from "@/lib/site";

export const dynamic = "force-dynamic";

const LAST_UPDATED = "24 August 2026";

type Section = {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
  ordered?: string[];
};

type LegalDocument = {
  title: string;
  intro: string;
  sections: Section[];
};

const CONTACT_LINE = `${TRADING_NAME}, ${BUSINESS_ADDRESS}. Email: ${EMAILS.legal}.`;

const documents: Record<string, LegalDocument> = {
  terms: {
    title: "Terms & Conditions",
    intro:
      "These terms explain how purchases from Vicarious Clothing work. They apply when you browse the website, place an order, create an account, use discounts, or otherwise buy from us online.",
    sections: [
      {
        heading: "1. Who we are",
        paragraphs: [
          `${TRADING_NAME} is the trading name used for this website. Our contact address is ${BUSINESS_ADDRESS}.`,
          `For legal notices, complaints, cancellation notices or questions about these terms, email ${EMAILS.legal}. For order support, email ${EMAILS.support} or ${EMAILS.orders}.`,
          `Our website is ${SITE_URL}.`,
        ],
      },
      {
        heading: "2. What we sell",
        paragraphs: [
          "We sell curated pre-owned clothing and accessories. Most items are one-of-one second-hand pieces, so availability is limited to the individual item shown in the listing.",
          "Each listing is intended to describe the item, price, size, condition, measurements, known defects and product photographs as accurately as possible. Pre-owned clothing may show signs of previous use. Any known material defects should be described in the listing.",
          "Colours can appear differently depending on screen settings, lighting and photography. Measurements are taken by hand and should be treated as close practical measurements rather than factory specifications.",
        ],
      },
      {
        heading: "3. Your account, bag and wishlist",
        paragraphs: [
          "You can browse without an account. If you create an account, you are responsible for keeping your login details secure and for making sure the details saved to your account are accurate.",
          "Adding an item to your bag or wishlist does not create a contract and does not guarantee availability. Items are only reserved during checkout or once an order has been created, depending on the checkout state.",
        ],
      },
      {
        heading: "4. Orders and contract formation",
        paragraphs: [
          "Your order is an offer to buy the items shown at checkout. A contract is formed only when we accept the order by confirming it, taking or authorising payment, and sending an order confirmation.",
          "Because most items are one-of-one, an item may become unavailable before payment completes. If this happens, we may reject, cancel or refund the affected order and release any remaining items.",
          "We may refuse or cancel an order where payment is not authorised, fraud checks fail, pricing or stock information is clearly wrong, the delivery details are incomplete, or we cannot legally or practically fulfil the order.",
        ],
      },
      {
        heading: "5. Prices, payment and discounts",
        paragraphs: [
          "Prices are shown in pounds sterling. Delivery costs are shown before checkout is completed. If VAT or another tax becomes applicable, prices will be shown inclusive of applicable taxes unless stated otherwise.",
          "Payment is handled securely by Stripe or another payment processor shown at checkout. We do not store your full card number or card security code.",
          "Discount codes are subject to their displayed conditions, including expiry dates, usage limits, category restrictions and minimum basket values. A discount code has no cash value and can be refused or cancelled if misused, duplicated, shared in breach of its terms, or applied because of a technical error.",
        ],
      },
      {
        heading: "6. Delivery",
        paragraphs: [
          `We currently deliver within the United Kingdom only. Standard delivery is £${STANDARD_DELIVERY_COST.toFixed(2)} unless your order qualifies for free standard delivery over £${FREE_DELIVERY_THRESHOLD}. Express delivery is £${EXPRESS_DELIVERY_COST.toFixed(2)} where available.`,
          "We aim to dispatch orders within 2 working days. Unless a different delivery period is agreed with you, goods will be delivered within 30 days of the order being accepted.",
          "You are responsible for providing a complete and accurate delivery address. If a parcel is returned because the address was incomplete, incorrect or not collected, we may need to charge a reasonable redelivery cost.",
        ],
      },
      {
        heading: "7. Returns, cancellation and refunds",
        paragraphs: [
          `Your cancellation and returns rights are set out in our Returns & Cancellation Policy. To cancel or return an order, contact ${EMAILS.legal} or ${EMAILS.support}.`,
          "Your statutory rights are not affected. If an item is faulty, not as described or otherwise fails to meet legal requirements, we will deal with it under your consumer rights.",
        ],
      },
      {
        heading: "8. Product care and responsibility after delivery",
        paragraphs: [
          "Once delivered, you are responsible for taking reasonable care of the items. You should check items promptly and contact us as soon as possible if something is wrong.",
          "We are not responsible for damage caused by misuse, unsuitable washing or drying, alteration, storage, ordinary wear after delivery, or use that is inconsistent with the item description or care label.",
        ],
      },
      {
        heading: "9. Sell To Us",
        paragraphs: [
          "If you use the Sell To Us form, the separate Sell To Us Terms apply to that process. Submitting an item through the form does not require us to make an offer or buy the item.",
        ],
      },
      {
        heading: "10. Website use",
        paragraphs: [
          "You must not misuse the website, attempt to interfere with checkout, attempt to access admin or customer systems without permission, scrape the site in a way that affects service availability, or submit false information.",
          "We may suspend access, cancel orders or take appropriate action if the website is misused or if we reasonably suspect fraud, abuse or unlawful activity.",
        ],
      },
      {
        heading: "11. Liability",
        paragraphs: [
          "Nothing in these terms limits or excludes liability that cannot legally be limited or excluded, including liability for death or personal injury caused by negligence, fraud, fraudulent misrepresentation, or your statutory consumer rights.",
          "Subject to that, we are not responsible for indirect losses, business losses, loss of profit, loss of opportunity, or losses that were not reasonably foreseeable when the contract was formed.",
        ],
      },
      {
        heading: "12. Changes to these terms",
        paragraphs: [
          "We may update these terms from time to time. The version that applies to your order is the version available when the order is placed, unless a change is required by law or is clearly beneficial to you.",
        ],
      },
      {
        heading: "13. Governing law and complaints",
        paragraphs: [
          "These terms are governed by the laws of England and Wales. If you live elsewhere in the UK, you may also have rights to bring a claim in your local courts.",
          `Please raise complaints first by emailing ${EMAILS.legal}. We will try to resolve issues directly and fairly.`,
        ],
      },
    ],
  },
  returns: {
    title: "Returns & Cancellation Policy",
    intro:
      "This policy explains your cancellation, return and refund rights for online orders from Vicarious Clothing.",
    sections: [
      {
        heading: "1. Your right to cancel",
        paragraphs: [
          "For most online orders, you can cancel without giving a reason by telling us within 14 days after the day you receive the goods. If your order is delivered in separate parcels, the 14-day period runs from the day you receive the final parcel for that order.",
          `To cancel, email ${EMAILS.legal} or ${EMAILS.support}. You can use the cancellation form below, but you do not have to use this exact wording as long as your cancellation decision is clear.`,
        ],
      },
      {
        heading: "2. Returning the item",
        paragraphs: [
          "After telling us you want to cancel, you have another 14 days to send the goods back unless we agree otherwise in writing.",
          "Items must be returned with reasonable care. You can inspect and try an item on in the same way you could in a shop, but you should not wear it beyond that, remove attached tags unnecessarily, wash it, alter it, damage it, mark it, stain it, or return it with odours such as smoke, perfume or damp.",
          "You are normally responsible for return postage unless the item is faulty, not as described, or we have agreed to cover return postage.",
        ],
      },
      {
        heading: "3. Refunds",
        paragraphs: [
          "We will refund the price paid for returned items and the standard outbound delivery charge where required by law. If you chose a more expensive delivery option, we only need to refund the cost of the least expensive standard delivery option we offered.",
          "We will make the refund within 14 days after we receive the returned goods or, if earlier, within 14 days after you provide evidence that you have sent the goods back.",
          "We may reduce the refund if handling beyond what is necessary to inspect the item reduces its value. This is especially important for pre-owned clothing because condition is part of the item value.",
          "Refunds are usually made to the original payment method. If that is not possible, we will contact you to arrange a reasonable alternative.",
        ],
      },
      {
        heading: "4. Faulty, damaged or misdescribed items",
        paragraphs: [
          "If an item arrives faulty, damaged in transit, or materially not as described, contact us as soon as possible with your order number, a description of the issue and photos where helpful.",
          "Known defects that were clearly described or photographed in the listing are part of the condition of the pre-owned item. This does not affect your rights where the item is not as described overall or has an undisclosed fault.",
        ],
      },
      {
        heading: "5. Return address",
        paragraphs: [
          `Unless we give you a different return address in writing, returns should be sent to: ${BUSINESS_ADDRESS}.`,
          "Please include your order number or the email address used for the order so we can identify the return quickly.",
        ],
      },
      {
        heading: "6. Cancellation form",
        paragraphs: [
          "You can copy and complete the wording below if you want to cancel an order:",
        ],
        bullets: [
          `To: ${TRADING_NAME}, ${BUSINESS_ADDRESS}, ${EMAILS.legal}`,
          "I give notice that I cancel my contract for the sale of the following goods:",
          "Order number:",
          "Ordered on / received on:",
          "Name:",
          "Address:",
          "Email used for the order:",
          "Date:",
        ],
      },
    ],
  },
  delivery: {
    title: "Delivery Policy",
    intro:
      "This policy explains where we deliver, what delivery costs, and what to expect after placing an order.",
    sections: [
      {
        heading: "1. Delivery area",
        paragraphs: [
          "We currently deliver to addresses in the United Kingdom only. International delivery is not currently available through the website.",
        ],
      },
      {
        heading: "2. Delivery options and costs",
        bullets: [
          `Standard delivery: Royal Mail Tracked 48 or an equivalent tracked service, £${STANDARD_DELIVERY_COST.toFixed(2)} unless free standard delivery applies.`,
          `Express delivery: Royal Mail Tracked 24 or an equivalent tracked service, £${EXPRESS_DELIVERY_COST.toFixed(2)} where available.`,
          `Free standard delivery applies to eligible orders over £${FREE_DELIVERY_THRESHOLD}.`,
        ],
      },
      {
        heading: "3. Dispatch and delivery time",
        paragraphs: [
          "We aim to dispatch orders within 2 working days after payment is completed and the order is accepted.",
          "Standard delivery is usually expected to arrive within 2 to 3 working days after dispatch. Express delivery is usually expected to arrive on the next working day after dispatch, but carrier delays can happen.",
          "Unless we agree a different delivery date with you, we will deliver within 30 days after accepting your order.",
        ],
      },
      {
        heading: "4. Tracking",
        paragraphs: [
          "Where tracking is available, tracking details will be shown on the order page or sent by email after dispatch. Tracking may not update immediately after a parcel is handed to the carrier.",
        ],
      },
      {
        heading: "5. Failed delivery, missing parcels and address issues",
        paragraphs: [
          "You are responsible for entering the correct delivery address at checkout. Contact us immediately if you notice an error; we cannot guarantee changes after dispatch.",
          "If a parcel is returned to us because it was refused, uncollected, or the address was incomplete or incorrect, we may need to deduct or request reasonable postage costs before resending or refunding, unless the issue was our fault.",
          "If tracking shows a parcel has been delivered but you cannot find it, contact us promptly so we can help you check with the carrier.",
        ],
      },
      {
        heading: "6. Risk and ownership",
        paragraphs: [
          "The goods become your responsibility when they are delivered to you, to a person you nominate, or to a safe place or collection point you selected through the carrier. Ownership passes when payment has been received in full.",
        ],
      },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    intro:
      "This policy explains how Vicarious Clothing collects, uses, stores and shares personal data when you use the website, buy from us, create an account, join the newsletter or use Sell To Us.",
    sections: [
      {
        heading: "1. Controller and contact details",
        paragraphs: [
          `${TRADING_NAME} is the controller for personal data processed through this website unless stated otherwise. Our contact address is ${BUSINESS_ADDRESS}.`,
          `For privacy rights, data protection questions and legal notices, email ${EMAILS.legal}.`,
        ],
      },
      {
        heading: "2. Personal data we collect",
        bullets: [
          "Identity and contact data: name, email address, delivery address, billing/contact details and account profile information.",
          "Order data: items bought, order number, delivery method, order status, discounts, returns, refunds and customer support messages.",
          "Payment data: payment status, payment references and limited payment metadata from Stripe. We do not store full card numbers or card security codes.",
          "Account and preference data: wishlist items, saved addresses, marketing preferences and password reset activity.",
          "Sell To Us data: name, email, item details, condition descriptions, notes, offer decisions and photos you upload.",
          "Newsletter data: email address, source of sign-up, consent timestamp and unsubscribe status.",
          "Technical data: IP-derived request information, device/browser information, cookies or browser storage choices, basic visit counts and security logs.",
        ],
      },
      {
        heading: "3. How we use personal data and our lawful bases",
        bullets: [
          "To process and deliver orders, handle payments, send order emails, provide customer accounts and deal with returns: contract necessity.",
          "To keep financial, tax, fraud-prevention and business records: legal obligation and legitimate interests.",
          "To respond to enquiries, manage complaints, improve products and maintain the security of the website: legitimate interests.",
          "To send marketing emails where you opt in: consent. You can withdraw consent at any time by using an unsubscribe link or contacting us.",
          "To process optional analytics/storage choices: consent, where consent is required.",
          "To process Sell To Us submissions and offers: steps before entering a contract, contract necessity where an offer is accepted, and legitimate interests in assessing submissions.",
        ],
      },
      {
        heading: "4. Who we share personal data with",
        paragraphs: [
          "We only share personal data where needed to run the store, comply with law, protect the business, or provide the service you requested.",
        ],
        bullets: [
          "Payment providers, including Stripe, to process payments and refunds.",
          "Delivery carriers, such as Royal Mail or equivalent services, to deliver orders and handle delivery issues.",
          "Website hosting, database and storage providers, including Vercel and Supabase, to run the website and store order/account data.",
          "Email service providers, including Resend, to send order, account, Sell To Us and newsletter emails.",
          "Professional advisers, insurers, HMRC, regulators, law enforcement or courts where required or reasonably necessary.",
        ],
      },
      {
        heading: "5. International transfers",
        paragraphs: [
          "Some service providers may process data outside the UK. Where this happens, we expect appropriate safeguards to be used, such as UK adequacy regulations, standard contractual clauses, equivalent transfer mechanisms, or the provider's approved transfer arrangements.",
        ],
      },
      {
        heading: "6. How long we keep personal data",
        bullets: [
          "Order, payment, refund and accounting records: normally up to 6 years where needed for tax, accounting, legal and business records.",
          "Account data: while your account remains open, then for a reasonable period needed for security, disputes and legal records.",
          "Customer support and complaint records: for as long as needed to resolve the issue and maintain a reasonable record afterwards.",
          "Newsletter consent records: until you unsubscribe, and then we may keep a suppression record so we know not to email you again.",
          "Sell To Us submissions: for as long as needed to assess the submission, manage any accepted offer, keep purchase records, and handle disputes or legal obligations.",
          "Cookie and analytics preference records: until they expire, are replaced, or you clear your browser storage.",
        ],
      },
      {
        heading: "7. Your rights",
        paragraphs: [
          "Depending on the circumstances, you may have the right to access your personal data, ask us to correct it, ask us to delete it, object to or restrict processing, request portability, and withdraw consent where processing is based on consent.",
          `To exercise your rights, email ${EMAILS.legal}. We may need to verify your identity before acting on a request.`,
          "You also have the right to complain to the Information Commissioner's Office if you are unhappy with how your data is handled, although we ask that you contact us first so we can try to resolve the issue.",
        ],
      },
      {
        heading: "8. Security",
        paragraphs: [
          "We use reasonable technical and organisational measures to protect personal data, including access controls, secure hosted services, HTTPS, server-side secrets for sensitive actions, and limited access to admin functions.",
          "No online service can be guaranteed completely secure. You should use a strong, unique password and tell us promptly if you think your account has been misused.",
        ],
      },
      {
        heading: "9. Children",
        paragraphs: [
          "The website is intended for general retail use and is not directed at children. If you believe a child has provided personal data without appropriate permission, contact us so we can review it.",
        ],
      },
      {
        heading: "10. Changes to this policy",
        paragraphs: [
          "We may update this policy when the website, suppliers, law or business processes change. The latest version will be published on this page.",
        ],
      },
    ],
  },
  cookies: {
    title: "Cookie Policy",
    intro:
      "This policy explains how Vicarious Clothing uses cookies, local storage, session storage and similar browser technologies.",
    sections: [
      {
        heading: "1. What browser storage we use",
        paragraphs: [
          "Cookies and similar technologies are small pieces of information stored on or accessed from your device. The website uses them to keep the store working, remember choices, support secure checkout and, if you agree, count visits.",
        ],
      },
      {
        heading: "2. Strictly necessary storage",
        paragraphs: [
          "These technologies are needed to provide the website or a feature you request. They do not require optional analytics consent.",
        ],
        bullets: [
          "Bag and checkout storage, such as vc_cart, to remember items in your bag.",
          "Wishlist storage, such as vc_wishlist, to remember saved items.",
          "Cookie choice storage, such as vc_cookie_consent, to remember whether you accepted, rejected or managed optional storage.",
          "Guest address and preference storage, such as vc_addresses and vc_marketing_pref, where you choose to save details locally before signing in.",
          "Authentication and account session storage used by Supabase Auth to keep you signed in securely.",
          "Admin and signed order-access cookies used to protect admin areas or let customers view their own order pages.",
          "Stripe payment technologies used during secure checkout for payment processing and fraud prevention.",
        ],
      },
      {
        heading: "3. Optional analytics storage",
        paragraphs: [
          "If you accept optional analytics, the site may use a short session marker, such as vc_tracked, so one browser session is counted once in the internal visit counter. This is used to understand basic site usage and does not involve third-party advertising trackers.",
          "If you reject optional analytics, the visit counter does not run for that browser session.",
        ],
      },
      {
        heading: "4. Third parties",
        paragraphs: [
          "Some strictly necessary services may set or access storage when you use their features, especially Stripe during payment and Supabase during authentication. These providers process information under their own service terms and privacy notices as well as our privacy arrangements with them.",
          "We do not currently use third-party behavioural advertising cookies through the website.",
        ],
      },
      {
        heading: "5. Changing your choices",
        paragraphs: [
          "You can accept all or reject optional storage through the cookie banner. You can also clear cookies, local storage and session storage in your browser settings. Clearing storage may empty your bag, sign you out, remove wishlist data saved locally or show the banner again.",
          `For questions about cookies or storage, email ${EMAILS.legal}.`,
        ],
      },
    ],
  },
  "sell-to-us": {
    title: "Sell To Us Terms",
    intro:
      "These terms apply when you submit an item through the Sell To Us form or accept an offer from Vicarious Clothing to buy stock from you.",
    sections: [
      {
        heading: "1. Submitting an item",
        paragraphs: [
          "You can use the Sell To Us form to tell us about clothing or accessories you may want to sell. You may be asked to provide your name, email address, brand, item type, size, condition notes and photographs.",
          "Submitting a form does not require us to make an offer, inspect the item, reserve money, or buy the item. We may decline a submission for any reason, including condition, authenticity concerns, stock priorities or commercial suitability.",
        ],
      },
      {
        heading: "2. Your promises to us",
        bullets: [
          "You own the item or have permission from the owner to sell it.",
          "The item is genuine and not counterfeit, stolen, unsafe or subject to finance, dispute or another person's rights.",
          "The information and photographs you provide are accurate and not misleading.",
          "You have disclosed material defects, alterations, damage, odours, missing labels, authenticity concerns and anything else that could affect value.",
        ],
      },
      {
        heading: "3. Offers",
        paragraphs: [
          "If we make an offer, it will usually be sent by email. Unless the offer says otherwise, an offer is valid for 7 days from when it is sent.",
          "An offer is based on the information and photographs you provide. If the item later appears to be different, damaged, inauthentic, misdescribed or commercially unsuitable, we may withdraw or revise the offer before completing the purchase.",
        ],
      },
      {
        heading: "4. Accepting or declining an offer",
        paragraphs: [
          "You can accept or decline using the secure link in the offer email. Once an offer is accepted, we will contact you with the next steps for delivery, collection, inspection or payment as applicable.",
          "If an offer expires or is withdrawn, you may need to submit the item again if you still want us to consider it.",
        ],
      },
      {
        heading: "5. Inspection and final purchase",
        paragraphs: [
          "Acceptance of an offer creates an agreement in principle, but final payment may depend on receiving or inspecting the item where inspection is required. We may refuse or revise the purchase if the item is materially different from the submission.",
          "If we decide not to proceed after inspection, we will explain the reason and agree a reasonable next step, such as returning the item if it has already been provided to us.",
        ],
      },
      {
        heading: "6. Payment",
        paragraphs: [
          "Payment timing and method will be agreed with you after an offer is accepted. You are responsible for giving accurate payment details where needed.",
          "We may need to keep purchase records for accounting, tax, fraud-prevention and stock history purposes.",
        ],
      },
      {
        heading: "7. Photos and content you provide",
        paragraphs: [
          "By uploading photographs or notes, you confirm you have the right to provide them and allow us to use them to assess the item, keep records, make an offer, and manage the purchase process.",
          "We will handle personal data from Sell To Us submissions in line with our Privacy Policy.",
        ],
      },
      {
        heading: "8. Contact",
        paragraphs: [
          `For Sell To Us questions, email ${EMAILS.general} or ${EMAILS.legal}.`,
        ],
      },
    ],
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const topic = LEGAL_TOPICS.find((t) => t.slug === slug);
  if (!topic) return {};
  const document = documents[slug];
  return {
    title: topic.title,
    description: document?.intro,
  };
}

function ContactPanel() {
  return (
    <div className="mb-10 border border-line bg-cream p-5 text-sm leading-relaxed text-ink-soft">
      <p className="font-display text-sm font-semibold uppercase tracking-[0.14em] text-ink">
        Legal contact
      </p>
      <p className="mt-2">{CONTACT_LINE}</p>
      <address className="mt-3 not-italic">
        {BUSINESS_ADDRESS_LINES.map((line) => (
          <span key={line}>
            {line}
            <br />
          </span>
        ))}
      </address>
      <p className="mt-3">
        Email: <a href={`mailto:${EMAILS.legal}`} className="text-accent-deep underline underline-offset-2">{EMAILS.legal}</a>
      </p>
    </div>
  );
}

export default async function LegalPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const topic = LEGAL_TOPICS.find((t) => t.slug === slug);
  const document = documents[slug];
  if (!topic || !document) notFound();

  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.24em] text-accent-deep">
          {SITE_NAME} legal
        </p>
        <h1 className="mb-2 border-b border-line pb-8 font-display text-3xl font-semibold uppercase tracking-tight sm:text-4xl">
          {document.title}
        </h1>
        <p className="mb-4 mt-4 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-faint">
          Last updated: {LAST_UPDATED}
        </p>
        <p className="mb-8 text-sm leading-relaxed text-ink-soft">
          {document.intro}
        </p>
        <ContactPanel />
        <div className="space-y-10">
          {document.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="mb-3 font-display text-lg font-semibold uppercase tracking-tight">
                {section.heading}
              </h2>
              {section.paragraphs?.map((paragraph) => (
                <p key={paragraph.slice(0, 42)} className="mb-3 text-sm leading-relaxed text-ink-soft">
                  {paragraph}
                </p>
              ))}
              {section.bullets && (
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-ink-soft">
                  {section.bullets.map((item) => (
                    <li key={item.slice(0, 42)}>{item}</li>
                  ))}
                </ul>
              )}
              {section.ordered && (
                <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-ink-soft">
                  {section.ordered.map((item) => (
                    <li key={item.slice(0, 42)}>{item}</li>
                  ))}
                </ol>
              )}
            </section>
          ))}
        </div>
      </div>
    </Container>
  );
}
