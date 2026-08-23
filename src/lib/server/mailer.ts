import fs from "node:fs";
import path from "node:path";
import type { Order } from "@/lib/types";
import { EMAILS, EXPRESS_DELIVERY_COST, SITE_URL } from "@/lib/site";
import { formatPrice } from "@/lib/utils";
import { logEmail } from "@/lib/server/store";
import { createLeadAccessToken } from "@/lib/server/lead-access";
import { createOrderAccessToken } from "@/lib/server/order-access";

const EMAIL_DIR = path.join(process.cwd(), ".data", "emails");

// -----------------------------------------------------------------------------
// EMAIL BRANDING — REPLACE THESE VALUES WITH YOUR OWN ASSETS/LINKS.
// Leave a social URL blank if you do not want that social link shown in emails.
// -----------------------------------------------------------------------------
const EMAIL_LOGO_URL = `${SITE_URL}/android-chrome-192x192.png`; // TODO: Replace with the final public Vicarious logo URL.
const EMAIL_INSTAGRAM_URL = ""; // TODO: Add the full Instagram URL.
const EMAIL_TIKTOK_URL = ""; // TODO: Add the full TikTok URL.
const EMAIL_FACEBOOK_URL = ""; // TODO: Add the full Facebook URL if used.

function esc(s: unknown) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function firstName(full: unknown) {
  const s = String(full ?? "").trim();
  return esc(s.split(" ")[0] ?? s);
}

function formatAddress(
  addr:
    | { line1?: string; line2?: string; city?: string; postcode?: string; country?: string }
    | undefined
) {
  if (!addr) return "";
  const parts: string[] = [];
  if (addr.line1) parts.push(esc(addr.line1));
  if (addr.line2) parts.push(esc(addr.line2));
  if (addr.city) parts.push(esc(addr.city));
  if (addr.postcode) parts.push(esc(addr.postcode));
  if (addr.country) parts.push(esc(addr.country));
  return parts.join("<br>");
}

export type EmailTemplate =
  | "welcome"
  | "order-confirmed"
  | "order-dispatched"
  | "order-delivered"
  | "order-refunded"
  | "order-cancelled"
  | "password-reset"
  | "lead-enquiry"
  | "lead-offer";

function socialLinks() {
  const links = [
    { label: "Instagram", url: EMAIL_INSTAGRAM_URL },
    { label: "TikTok", url: EMAIL_TIKTOK_URL },
    { label: "Facebook", url: EMAIL_FACEBOOK_URL },
  ].filter((link) => link.url.trim());
  if (!links.length) return "";
  return `<p style="margin:10px 0 0;font-size:11px;line-height:1.7;">${links
    .map(
      (link) =>
        `<a href="${esc(link.url)}" style="color:#56565e;text-decoration:underline;">${link.label}</a>`
    )
    .join(" &nbsp;·&nbsp; ")}</p>`;
}

function layout(title: string, bodyHtml: string) {
  return `<!doctype html>
<html>
<body style="margin:0;padding:0;background:#f7f6f2;font-family:Arial,Helvetica,sans-serif;color:#101014;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 16px;">
      <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border:1px solid #e4e2d9;">
        <tr><td style="padding:36px 40px;">
          <p style="margin:0 0 24px;"><img src="${EMAIL_LOGO_URL}" width="56" height="56" alt="Vicarious Clothing" style="display:block;border-radius:50%;" /></p>
          <p style="margin:0 0 24px;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#007587;">VICARIOUS CLOTHING</p>
          <h1 style="margin:0 0 16px;font-size:24px;letter-spacing:0.02em;text-transform:uppercase;line-height:1.15;">${title}</h1>
          ${bodyHtml}
        </td></tr>
        <tr><td style="padding:24px 40px;border-top:1px solid #e4e2d9;">
          <p style="margin:0;font-size:11px;color:#8b8b93;line-height:1.7;">Vicarious Clothing · ${SITE_URL}<br>Curated clothing, ready to go again.</p>
          ${socialLinks()}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function button(label: string, href: string) {
  return `<p style="margin:20px 0;"><a href="${esc(href)}" style="display:inline-block;background:#101014;color:#ffffff;text-decoration:none;padding:12px 18px;font-size:12px;font-weight:bold;letter-spacing:0.08em;text-transform:uppercase;">${esc(label)}</a></p>`;
}

function itemsTable(order: Order) {
  const rows = order.items
    .map(
      (i) => `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #e4e2d9;">${esc(i.brand)} ${esc(i.name)} <span style="color:#8b8b93;">· ${esc(i.size)}</span></td>
        <td style="padding:8px 0;border-bottom:1px solid #e4e2d9;text-align:right;white-space:nowrap;">${formatPrice(i.price)}</td>
      </tr>`
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;margin:12px 0;">${rows}</table>`;
}

function deliveryMethod(order: Order) {
  return order.delivery === EXPRESS_DELIVERY_COST
    ? "Express — Royal Mail Tracked 24"
    : "Standard — Royal Mail Tracked 48";
}

function customerOrderUrl(order: Order) {
  const token = createOrderAccessToken(order.id, order.email);
  return `${SITE_URL}/order/${encodeURIComponent(order.id)}?token=${encodeURIComponent(token)}`;
}

function visibleLeadNotes(notes: unknown) {
  return String(notes ?? "")
    .split("\n")
    .filter((line) => !line.startsWith("PHOTO: "))
    .join("\n")
    .trim();
}

function leadItems(lead: any) {
  const notes = visibleLeadNotes(lead.notes);
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;margin:12px 0;">
    <tr><td style="padding:5px 0;color:#56565e;"><strong>Brand:</strong></td><td style="padding:5px 0;text-align:right;">${esc(lead.brand ?? "—")}</td></tr>
    <tr><td style="padding:5px 0;color:#56565e;"><strong>Item:</strong></td><td style="padding:5px 0;text-align:right;">${esc(lead.itemType ?? "—")}</td></tr>
    <tr><td style="padding:5px 0;color:#56565e;"><strong>Size:</strong></td><td style="padding:5px 0;text-align:right;">${esc(lead.size ?? "—")}</td></tr>
    <tr><td style="padding:5px 0;color:#56565e;"><strong>Condition:</strong></td><td style="padding:5px 0;text-align:right;">${esc(lead.condition ?? "—")}</td></tr>
    ${notes ? `<tr><td style="padding:5px 0;color:#56565e;"><strong>Notes:</strong></td><td style="padding:5px 0;text-align:right;">${esc(notes)}</td></tr>` : ""}
  </table>`;
}

function customerLeadUrl(lead: any, intent?: "accept" | "decline") {
  const id = String(lead.id ?? "");
  const email = String(lead.email ?? "");
  const token = createLeadAccessToken(id, email);
  const params = new URLSearchParams({ token });
  if (intent) params.set("intent", intent);
  return `${SITE_URL}/leads/${encodeURIComponent(id)}?${params.toString()}`;
}

function buildTemplate(
  template: EmailTemplate,
  data: Record<string, unknown>
): { subject: string; html: string } {
  switch (template) {
    case "welcome": {
      const name = String(data.name ?? "");
      return {
        subject: "Welcome to Vicarious Clothing",
        html: layout(
          "Welcome to Vicarious Clothing.",
          `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#3f3f46;">Hi ${firstName(name)},</p>
          <p style="margin:0 0 16px;font-size:14px;color:#3f3f46;">Welcome to Vicarious Clothing.</p>
          <p style="margin:0 0 10px;font-size:14px;color:#3f3f46;">Your account is ready, so you can now:</p>
          <ul style="color:#3f3f46;line-height:1.7;"><li>track your orders;</li><li>save pieces to your wishlist;</li><li>manage your addresses;</li><li>update your preferences; and</li><li>see your order history.</li></ul>
          ${button("My account", `${SITE_URL}/account`)}
          <p style="margin:16px 0;color:#3f3f46;">Want to see what’s just arrived?</p>
          ${button("Shop new in", `${SITE_URL}/shop/new-in`)}
          <p style="margin:16px 0 8px;color:#3f3f46;">Thanks for joining us.</p>
          <p style="margin:0 0 8px;font-weight:bold;">Vicarious Clothing</p>
          <p style="margin:0;font-style:italic;color:#8b8b93;">Clothes worth another life.</p>`
        ),
      };
    }

    case "order-confirmed": {
      const order = data.order as Order;
      return {
        subject: `It's yours — order ${order.id}`,
        html: layout(
          "Order confirmed.",
          `<p style="margin:0 0 8px;font-size:15px;color:#3f3f46;">Hi ${firstName(order.name)},</p>
          <p style="margin:0 0 8px;font-size:14px;color:#3f3f46;">Thanks for your order.</p>
          <p style="margin:0 0 16px;font-size:14px;color:#3f3f46;">We’ve received your payment and your piece is now yours.</p>
          <p style="margin:8px 0;font-weight:bold;">Order ${esc(order.id)}</p>
          <p style="margin:0 0 8px;color:#8b8b93;">Placed ${esc(order.createdAt)}</p>
          ${itemsTable(order)}
          <p style="margin:12px 0;color:#3f3f46;line-height:1.8;"><strong>Subtotal:</strong> ${formatPrice(order.subtotal)}<br><strong>Delivery:</strong> ${order.delivery === 0 ? "Free" : formatPrice(order.delivery)}<br><strong>Discount:</strong> ${order.discount ? `${esc(order.discount.code)} — ${formatPrice(order.discount.amount || 0)}` : "—"}<br><strong>Total:</strong> <strong>${formatPrice(order.total)}</strong></p>
          <p style="margin:16px 0 4px;font-weight:bold;">Delivering to</p>
          <p style="margin:6px 0;line-height:1.6;">${esc(order.name)}<br>${formatAddress(order.address)}</p>
          <p style="margin:6px 0;"><strong>Delivery method:</strong> ${deliveryMethod(order)}</p>
          <p style="margin:16px 0;color:#3f3f46;">We’ll email you again when your order is on its way.</p>
          ${button("View order", customerOrderUrl(order))}
          <p style="margin:16px 0 8px;color:#3f3f46;">Thanks for giving something another life.</p>
          <p style="margin:0;font-weight:bold;">Vicarious Clothing</p>`
        ),
      };
    }

    case "order-dispatched": {
      const order = data.order as Order;
      return {
        subject: `On its way — order ${order.id}`,
        html: layout(
          "It's on the way.",
          `<p style="margin:0 0 8px;font-size:15px;color:#3f3f46;">Hi ${firstName(order.name)},</p>
          <p style="margin:0 0 16px;font-size:14px;color:#3f3f46;">Your order is on its way.</p>
          <p style="margin:8px 0;font-weight:bold;">Order ${esc(order.id)}</p>
          ${itemsTable(order)}
          <p style="margin:12px 0;color:#3f3f46;line-height:1.8;"><strong>Carrier:</strong> ${esc(order.carrier ?? "—")}<br><strong>Delivery service:</strong> ${deliveryMethod(order)}<br><strong>Tracking number:</strong> ${esc(order.tracking ?? "—")}</p>
          ${button("Track your order", customerOrderUrl(order))}
          <p style="margin:16px 0 6px;color:#3f3f46;">Your order is being delivered to:</p>
          <p style="margin:6px 0;line-height:1.6;">${esc(order.name)}<br>${formatAddress(order.address)}</p>
          <p style="margin:16px 0;color:#3f3f46;">We hope it likes where it’s going next.</p>
          <p style="margin:0;font-weight:bold;">Vicarious Clothing</p>`
        ),
      };
    }

    case "order-delivered": {
      const order = data.order as Order;
      return {
        subject: `Delivered — order ${order.id}`,
        html: layout(
          "It's arrived.",
          `<p style="margin:0 0 8px;font-size:15px;color:#3f3f46;">Hi ${firstName(order.name)},</p>
          <p style="margin:0 0 16px;font-size:14px;color:#3f3f46;">Your Vicarious order has been marked as delivered.</p>
          <p style="margin:8px 0;font-weight:bold;">Order ${esc(order.id)}</p>
          ${itemsTable(order)}
          <p style="margin:16px 0;color:#3f3f46;">We hope it’s found the right wardrobe.</p>
          ${button("View order", customerOrderUrl(order))}
          <p style="margin:16px 0;color:#3f3f46;">If something isn’t right, contact us and we’ll help.</p>
          ${button("Get support", `${SITE_URL}/help`)}
          <p style="margin:16px 0 8px;color:#3f3f46;">Thanks for shopping with Vicarious.</p>
          <p style="margin:0;font-weight:bold;">Vicarious Clothing</p>`
        ),
      };
    }

    case "order-refunded": {
      const order = data.order as Order;
      const refundAmount =
        typeof data.refundAmount === "number" ? data.refundAmount : order.total;
      return {
        subject: `Your refund has been issued — order ${order.id}`,
        html: layout(
          "Refund issued.",
          `<p style="margin:0 0 8px;font-size:15px;color:#3f3f46;">Hi ${firstName(order.name)},</p>
          <p style="margin:0 0 16px;font-size:14px;color:#3f3f46;">We’ve issued a refund relating to order <strong>${esc(order.id)}</strong>.</p>
          <p style="margin:12px 0;color:#3f3f46;line-height:1.8;"><strong>Refund amount:</strong> ${formatPrice(refundAmount)}<br><strong>Refund reference:</strong> ${esc(String(data.refundReference ?? order.paymentIntentId ?? "—"))}</p>
          <p style="margin:16px 0;color:#3f3f46;">The refund has been sent to the original payment method used for your order.</p>
          <p style="margin:16px 0;color:#3f3f46;">Depending on your bank or payment provider, it may take some time for the funds to appear on your account.</p>
          <p style="margin:16px 0;color:#3f3f46;">If you have any questions about the refund, reply to this email or contact our support team.</p>
          <p style="margin:16px 0 0;font-weight:bold;">Vicarious Clothing</p>`
        ),
      };
    }

    case "order-cancelled": {
      const order = data.order as Order;
      return {
        subject: `Order ${order.id} has been cancelled`,
        html: layout(
          "Order cancelled.",
          `<p style="margin:0 0 8px;font-size:15px;color:#3f3f46;">Hi ${firstName(order.name)},</p>
          <p style="margin:0 0 16px;font-size:14px;color:#3f3f46;">Your order <strong>${esc(order.id)}</strong> has been cancelled.</p>
          ${data.cancellationReason ? `<p style="margin:16px 0;color:#3f3f46;">${esc(String(data.cancellationReason))}</p>` : ""}
          <p style="margin:12px 0;color:#3f3f46;"><strong>Order total:</strong> ${formatPrice(order.total)}</p>
          ${data.refundInformation ? `<p style="margin:16px 0;color:#3f3f46;">${esc(String(data.refundInformation))}</p>` : ""}
          <p style="margin:16px 0;color:#3f3f46;">If a refund is due, it will be returned to the original payment method.</p>
          <p style="margin:16px 0;color:#3f3f46;">If you weren’t expecting this cancellation or need any help, reply to this email.</p>
          ${button("Contact support", `${SITE_URL}/help`)}
          <p style="margin:16px 0 0;font-weight:bold;">Vicarious Clothing</p>`
        ),
      };
    }

    case "password-reset": {
      const link = String(data.link ?? "");
      return {
        subject: "Reset your Vicarious Clothing password",
        html: layout(
          "Reset your password.",
          `<p style="margin:0 0 8px;font-size:15px;color:#3f3f46;">Hi ${firstName(data.name)},</p>
          <p style="margin:0 0 16px;font-size:14px;color:#3f3f46;">We received a request to reset the password for your Vicarious account.</p>
          ${button("Reset password", link)}
          <p style="margin:16px 0;color:#3f3f46;">This link will expire in ${esc(String(data.expiryTime ?? "1 hour"))}.</p>
          <p style="margin:16px 0;color:#3f3f46;">If you didn’t request a password reset, you can ignore this email. Your existing password will remain unchanged.</p>
          <p style="margin:16px 0;color:#3f3f46;">For your security, we will never ask you to send us your password by email.</p>
          <p style="margin:16px 0 0;font-weight:bold;">Vicarious Clothing</p>`
        ),
      };
    }

    case "lead-enquiry": {
      const lead = data as any;
      return {
        subject: `We've received your submission — ${String(lead.id ?? "")}`,
        html: layout(
          "We've received your submission.",
          `<p style="margin:0 0 8px;font-size:15px;color:#3f3f46;">Hi ${firstName(lead.name)},</p>
          <p style="margin:0 0 8px;font-size:14px;color:#3f3f46;">Thanks for offering your clothes to Vicarious.</p>
          <p style="margin:0 0 16px;font-size:14px;color:#3f3f46;">We’ve received your submission and will take a look at the information and photographs you’ve provided.</p>
          <p style="margin:12px 0;"><strong>Reference:</strong> ${esc(lead.id)}</p>
          ${leadItems(lead)}
          <p style="margin:16px 0 8px;color:#3f3f46;">We’ll review your items based on factors including:</p>
          <ul style="color:#3f3f46;line-height:1.7;"><li>condition;</li><li>brand;</li><li>authenticity where relevant;</li><li>current demand; and</li><li>the stock we already hold.</li></ul>
          <p style="margin:16px 0;color:#3f3f46;">Submitting your items does not oblige you to sell them, and it does not oblige Vicarious Clothing to purchase them.</p>
          <p style="margin:16px 0;color:#3f3f46;">We’ll contact you once we’ve reviewed your submission.</p>
          ${button("View submission", customerLeadUrl(lead))}
          <p style="margin:16px 0 8px;color:#3f3f46;">Thanks for thinking of Vicarious.</p>
          <p style="margin:0;font-weight:bold;">Vicarious Clothing</p>`
        ),
      };
    }

    case "lead-offer": {
      const lead = data as any;
      const raw = String(lead.offer ?? "").trim();
      const amount = raw
        ? /^\d/.test(raw) && !raw.includes("£")
          ? `£${raw}`
          : raw
        : "an amount";
      return {
        subject: `We'd like to make you an offer — ${String(lead.id ?? "")}`,
        html: layout(
          "We'd like to make you an offer.",
          `<p style="margin:0 0 8px;font-size:15px;color:#3f3f46;">Hi ${firstName(lead.name)},</p>
          <p style="margin:0 0 16px;font-size:14px;color:#3f3f46;">We’ve reviewed your submission <strong>${esc(lead.id)}</strong> and we’re interested in buying some or all of your items.</p>
          ${leadItems(lead)}
          <p style="margin:16px 0;color:#3f3f46;"><strong>Total provisional offer:</strong> <strong>${esc(amount)}</strong></p>
          <p style="margin:16px 0;color:#3f3f46;"><strong>Offer expires:</strong> ${esc(String(lead.offerExpiry ?? "7 days"))}</p>
          <p style="margin:16px 0;color:#3f3f46;">This offer is provisional and is based on the information and photographs you supplied.</p>
          <p style="margin:16px 0 8px;color:#3f3f46;">The final purchase remains subject to the items being received and matching the:</p>
          <ul style="color:#3f3f46;line-height:1.7;"><li>description;</li><li>condition;</li><li>authenticity information;</li><li>photographs; and</li><li>other information supplied with your submission.</li></ul>
          <p style="margin:16px 0;color:#3f3f46;">If everything matches, we’ll complete the purchase at the agreed amount.</p>
          ${button("Accept offer", customerLeadUrl(lead, "accept"))}
          ${button("Decline offer", customerLeadUrl(lead, "decline"))}
          <p style="margin:16px 0;color:#3f3f46;">If you have any questions before deciding, reply to this email.</p>
          <p style="margin:16px 0 0;font-weight:bold;">Vicarious Clothing</p>`
        ),
      };
    }
  }
}

function writeHtmlFile(filename: string, html: string) {
  try {
    fs.mkdirSync(EMAIL_DIR, { recursive: true });
    fs.writeFileSync(path.join(EMAIL_DIR, filename), html, "utf-8");
  } catch {
    // Read-only filesystem — the email is still recorded in the log in development.
  }
}

export async function sendEmail(input: {
  to: string;
  template: EmailTemplate;
  data: Record<string, unknown>;
}): Promise<"sent" | "logged"> {
  const { subject, html } = buildTemplate(input.template, input.data);
  const apiKey = process.env.RESEND_API_KEY;
  const from = `${EMAILS.notifications}`;

  if (apiKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ from, to: input.to, subject, html }),
      });
      if (res.ok) {
        await logEmail({
          to: input.to,
          subject,
          template: input.template,
          status: "sent",
          provider: "resend",
          sentAt: new Date().toISOString(),
          preview: subject,
        });
        return "sent";
      }
      console.error("Email provider error:", res.status, await res.text());
    } catch (err) {
      console.error("Email provider failure:", err);
    }
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("Transactional email could not be delivered");
  }

  const filename = `${Date.now()}-${input.template}-${input.to.replace(/[^a-z0-9@.-]/gi, "_")}.html`;
  writeHtmlFile(filename, html);
  await logEmail({
    to: input.to,
    subject,
    template: input.template,
    status: "logged",
    provider: "file",
    sentAt: new Date().toISOString(),
    preview: subject,
  });
  return "logged";
}
