import fs from "node:fs";
import path from "node:path";
import type { Order } from "@/lib/types";
import { EMAILS, SITE_URL } from "@/lib/site";
import { formatPrice } from "@/lib/utils";
import { logEmail } from "@/lib/server/store";

const EMAIL_DIR = path.join(process.cwd(), ".data", "emails");

function esc(s: unknown) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function firstName(full: unknown) {
  const s = String(full ?? "").trim();
  return esc(s.split(" ")[0] ?? s);
}

function formatAddress(addr: { line1?: string; line2?: string; city?: string; postcode?: string; country?: string } | undefined) {
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

function layout(title: string, bodyHtml: string) {
  return `<!doctype html>
<html>
<body style="margin:0;padding:0;background:#f7f6f2;font-family:Arial,Helvetica,sans-serif;color:#101014;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 16px;">
      <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border:1px solid #e4e2d9;">
        <tr><td style="padding:36px 40px;">
          <p style="margin:0 0 24px;">
            <img src="${SITE_URL}/android-chrome-192x192.png" width="56" height="56" alt="Vicarious Clothing" style="display:block;border-radius:50%;" />
          </p>
          <p style="margin:0 0 24px;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#007587;">VICARIOUS CLOTHING</p>
          <h1 style="margin:0 0 16px;font-size:24px;letter-spacing:0.02em;text-transform:uppercase;line-height:1.15;">${title}</h1>
          ${bodyHtml}
        </td></tr>
        <tr><td style="padding:24px 40px;border-top:1px solid #e4e2d9;">
          <p style="margin:0;font-size:11px;color:#8b8b93;line-height:1.7;">
            Vicarious Clothing · ${SITE_URL}<br>
            Curated clothing, ready to go again.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function itemsTable(order: Order) {
  const rows = order.items
    .map(
      (i) => `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #e4e2d9;">${i.brand} ${i.name} <span style="color:#8b8b93;">· ${i.size}</span></td>
        <td style="padding:8px 0;border-bottom:1px solid #e4e2d9;text-align:right;white-space:nowrap;">${formatPrice(i.price)}</td>
      </tr>`
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
    ${rows}
    <tr>
      <td style="padding:12px 0 4px;color:#56565e;">Subtotal</td>
      <td style="padding:12px 0 4px;text-align:right;">${formatPrice(order.subtotal)}</td>
    </tr>
    ${order.discount ? `<tr>
      <td style="padding:4px 0;color:#007587;">${order.discount.code} — ${order.discount.description}</td>
      <td style="padding:4px 0;text-align:right;color:#007587;">-${formatPrice(order.discount.amount || order.delivery)}</td>
    </tr>` : ""}
    <tr>
      <td style="padding:4px 0;color:#56565e;">Delivery</td>
      <td style="padding:4px 0;text-align:right;">${order.delivery === 0 ? "Free" : formatPrice(order.delivery)}</td>
    </tr>
    <tr>
      <td style="padding:10px 0;font-weight:bold;text-transform:uppercase;font-size:13px;letter-spacing:0.08em;">Total</td>
      <td style="padding:10px 0;font-weight:bold;text-align:right;">${formatPrice(order.total)}</td>
    </tr>
  </table>`;
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
        html: layout("Welcome to Vicarious Clothing.", `
          <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#3f3f46;">Hi ${esc(firstName(name))},</p>
          <p style="margin:0 0 16px;font-size:14px;color:#3f3f46;">Welcome to Vicarious Clothing.</p>
          <ul style="color:#3f3f46;">
            <li>track your orders;</li>
            <li>save pieces to your wishlist;</li>
            <li>manage your addresses;</li>
            <li>update your preferences; and</li>
            <li>see your order history.</li>
          </ul>
          <p style="margin:16px 0;"><a href="${SITE_URL}/account" style="color:#007587;">My account</a></p>
          <p style="margin:0 0 16px;"><a href="${SITE_URL}/shop/new-in" style="color:#007587;">Shop new in</a></p>
          <p style="margin:0 0 8px;color:#3f3f46;">Thanks for joining us.</p>
          <p style="margin:0 0 8px;font-weight:bold;">Vicarious Clothing</p>
          <p style="margin:0;font-style:italic;color:#8b8b93;">Clothes worth another life.</p>
        `),
      };
    }
    case "order-confirmed": {
      const order = data.order as Order;
      return {
        subject: `It's yours — order ${order.id}`,
        html: layout("Order confirmed.", `
          <p style="margin:0 0 8px;font-size:15px;color:#3f3f46;">Hi ${firstName(order.name)},</p>
          <p style="margin:0 0 8px;font-size:14px;color:#3f3f46;">Thanks for your order.</p>
          <p style="margin:8px 0;font-weight:bold;">Order ${esc(order.id)}</p>
          <p style="margin:0 0 8px;color:#8b8b93;">Placed ${esc(order.createdAt)}</p>
          ${itemsTable(order)}
          <p style="margin:8px 0;color:#3f3f46;"><strong>Subtotal:</strong> ${formatPrice(order.subtotal)}<br>
          <strong>Delivery:</strong> ${order.delivery === 0 ? "Free" : formatPrice(order.delivery)}<br>
          <strong>Discount:</strong> ${order.discount ? esc(order.discount.code) : "—"}<br>
          <strong>Total:</strong> <strong>${formatPrice(order.total)}</strong></p>
          <p style="margin:12px 0 0;font-weight:bold;">Delivering to</p>
          <p style="margin:6px 0;">${esc(order.name)}<br>${formatAddress(order.address)}</p>
          <p style="margin:6px 0;"><strong>Delivery method:</strong> ${esc(order.channel)}</p>
          <p style="margin:16px 0 0;"><a href="${SITE_URL}/order/${order.id}" style="color:#007587;">View order →</a></p>
          <p style="margin:16px 0 0;color:#3f3f46;">Thanks for giving something another life.</p>
          <p style="margin:0;font-weight:bold;">Vicarious Clothing</p>
        `),
      };
    }
    case "order-dispatched": {
      const order = data.order as Order;
      return {
        subject: `On its way — order ${order.id}`,
        html: layout("It's on the way.", `
          <p style="margin:0 0 8px;font-size:15px;color:#3f3f46;">Hi ${firstName(order.name)},</p>
          <p style="margin:0 0 8px;font-size:14px;color:#3f3f46;">Your order is on its way.</p>
          <p style="margin:8px 0;font-weight:bold;">Order ${esc(order.id)}</p>
          ${itemsTable(order)}
          <p style="margin:8px 0;color:#3f3f46;"><strong>Carrier:</strong> ${esc(order.carrier ?? "—")}<br>
          <strong>Delivery service:</strong> ${esc(order.channel)}<br>
          <strong>Tracking number:</strong> ${esc(order.tracking ?? "—")}</p>
          <p style="margin:12px 0;"><a href="${SITE_URL}/order/${order.id}" style="color:#007587;">Track your order →</a></p>
          <p style="margin:8px 0;color:#3f3f46;">Your order is being delivered to:<br>${esc(order.name)}<br>${formatAddress(order.address)}</p>
          <p style="margin:12px 0;color:#3f3f46;">We hope it likes where it’s going next.</p>
          <p style="margin:0;font-weight:bold;">Vicarious Clothing</p>
        `),
      };
    }
    case "order-delivered": {
      const order = data.order as Order;
      return {
        subject: `Delivered — order ${order.id}`,
        html: layout("It's arrived.", `
          <p style="margin:0 0 8px;font-size:15px;color:#3f3f46;">Hi ${firstName(order.name)},</p>
          <p style="margin:0 0 8px;font-size:14px;color:#3f3f46;">Your Vicarious order has been marked as delivered.</p>
          <p style="margin:8px 0;font-weight:bold;">Order ${esc(order.id)}</p>
          ${itemsTable(order)}
          <p style="margin:12px 0;color:#3f3f46;">We hope it’s found the right wardrobe.</p>
          <p style="margin:12px 0;"><a href="${SITE_URL}/order/${order.id}" style="color:#007587;">View order →</a></p>
          <p style="margin:8px 0;color:#3f3f46;">If something isn’t right, contact us and we’ll help.</p>
          <p style="margin:8px 0;"><a href="${SITE_URL}/help" style="color:#007587;">Get support →</a></p>
          <p style="margin:12px 0;font-weight:bold;">Vicarious Clothing</p>
        `),
      };
    }
    case "order-refunded": {
      const order = data.order as Order;
      return {
        subject: `Your refund has been issued — order ${order.id}`,
        html: layout("Refund issued.", `
          <p style="margin:0 0 8px;font-size:15px;color:#3f3f46;">Hi ${firstName(order.name)},</p>
          <p style="margin:0 0 8px;font-size:14px;color:#3f3f46;">We’ve issued a refund relating to order <strong>${esc(order.id)}</strong>.</p>
          <p style="margin:8px 0;color:#3f3f46;"><strong>Refund amount:</strong> ${formatPrice(order.total)}<br>
          <strong>Refund reference:</strong> ${esc(order.paymentIntentId ?? "—")}</p>
          <p style="margin:8px 0;color:#3f3f46;">The refund has been sent to the original payment method used for your order.</p>
          <p style="margin:8px 0;color:#8b8b93;">Depending on your bank or payment provider, it may take some time for the funds to appear on your account.</p>
          <p style="margin:8px 0;color:#3f3f46;">If you have any questions about the refund, reply to this email or contact our support team.</p>
          <p style=margin:12px 0;font-weight:bold;"> Vicarious Clothing</p> 
        `),
      };
    }
    case "order-cancelled": {
      const order = data.order as Order;
      return {
        subject: `Order ${order.id} has been cancelled`,
        html: layout("Order cancelled.", `
          <p style="margin:0 0 8px;font-size:15px;color:#3f3f46;">Hi ${firstName(order.name)},</p>
          <p style="margin:0 0 8px;font-size:14px;color:#3f3f46;">Your order <strong>${esc(order.id)}</strong> has been cancelled.</p>
          <p style="margin:8px 0;color:#3f3f46;">${esc(String(data.cancellationReason ?? ""))}</p>
          <p style="margin:8px 0;color:#3f3f46;"><strong>Order total:</strong> ${formatPrice(order.total)}</p>
          <p style="margin:8px 0;color:#3f3f46;">${esc(String(data.refundInformation ?? ""))}</p>
          <p style="margin:8px 0;color:#3f3f46;">If a refund is due, it will be returned to the original payment method.</p>
          <p style="margin:8px 0;color:#3f3f46;">If you weren’t expecting this cancellation or need any help, reply to this email.</p>
          <p style="margin:8px 0;"><a href="${SITE_URL}/help" style="color:#007587;">Contact support →</a></p>
          <p style="margin:12px 0;font-weight:bold;">Vicarious Clothing</p>
        `),
      };
    }
    case "password-reset": {
      const link = String(data.link ?? "");
      return {
        subject: "Reset your Vicarious Clothing password",
        html: layout("Reset your password.", `
          <p style="margin:0 0 8px;font-size:15px;color:#3f3f46;">Hi ${esc(firstName(data.name))},</p>
          <p style="margin:0 0 8px;font-size:14px;color:#3f3f46;">We received a request to reset the password for your Vicarious account.</p>
          <p style="margin:8px 0;"><a href="${link}" style="color:#007587;">Reset password →</a></p>
          <p style="margin:8px 0;color:#8b8b93;">This link will expire in ${esc(String(data.expiryTime ?? "1 hour"))}.</p>
          <p style="margin:8px 0;color:#8b8b93;">If you didn’t request a password reset, you can ignore this email. Your existing password will remain unchanged.</p>
          <p style="margin:8px 0;color:#8b8b93;">For your security, we will never ask you to send us your password by email.</p>
          <p style="margin:12px 0;font-weight:bold;">Vicarious Clothing</p>
        `),
      };
    }
    case "lead-enquiry": {
      const lead = data as any;
      return {
        subject: `We've received your submission — ${String(lead.id ?? "")}`,
        html: layout("We've received your submission.", `
          <p style="margin:0 0 8px;font-size:15px;color:#3f3f46;">Hi ${esc(firstName(lead.name))},</p>
          <p style="margin:0 0 8px;font-size:14px;color:#3f3f46;">Thanks for offering your clothes to Vicarious.</p>
          <p style="margin:8px 0;"><strong>Reference:</strong> ${esc(lead.id)}</p>
          <p style="margin:8px 0;color:#3f3f46;">${esc(String(lead.notes ?? ""))}</p>
          <p style="margin:12px 0;color:#3f3f46;">We’ll review your items based on factors including:</p>
          <ul style="color:#3f3f46;">
            <li>condition;</li>
            <li>brand;</li>
            <li>authenticity where relevant;</li>
            <li>current demand; and</li>
            <li>the stock we already hold.</li>
          </ul>
          <p style="margin:8px 0;color:#3f3f46;">Submitting your items does not oblige you to sell them, and it does not oblige Vicarious Clothing to purchase them.</p>
          <p style="margin:8px 0;color:#3f3f46;">We’ll contact you once we’ve reviewed your submission.</p>
          <p style="margin:12px 0;"><a href="${SITE_URL}/leads/${lead.id}" style="color:#007587;">View submission →</a></p>
          <p style="margin:12px 0;font-weight:bold;">Vicarious Clothing</p>
        `),
      };
    }
    case "lead-offer": {
      const lead = data;
      const l = lead as any;
      const raw = String(l.offer ?? "").trim();
      const amount = raw ? (/^\d/.test(raw) && !raw.includes("£") ? `£${raw}` : raw) : "an amount";
      return {
        subject: `We'd like to make you an offer — ${String(l.id ?? "")}`,
        html: layout("Offer received.", `
          <p style="margin:0 0 8px;font-size:15px;color:#3f3f46;">Hi ${esc(firstName(l.name))},</p>
          <p style="margin:0 0 8px;font-size:14px;color:#3f3f46;">We’ve reviewed your submission <strong>${esc(l.id)}</strong> and we’re interested in buying some or all of your items.</p>
          <p style="margin:8px 0;color:#3f3f46;">${esc(String(l.notes ?? ""))}</p>
          <p style="margin:8px 0;color:#3f3f46;"><strong>Total provisional offer:</strong> <strong>${esc(amount)}</strong></p>
          <p style="margin:8px 0;color:#3f3f46;"><strong>Offer expires:</strong> ${esc(String(l.offerExpiry ?? "7 days"))}</p>
          <p style="margin:8px 0;color:#3f3f46;">This offer is provisional and is based on the information and photographs you supplied.</p>
          <p style="margin:8px 0;color:#3f3f46;">The final purchase remains subject to the items being received and matching the:</p>
          <ul style="color:#3f3f46;">
            <li>description;</li>
            <li>condition;</li>
            <li>authenticity information;</li>
            <li>photographs; and</li>
            <li>other information supplied with your submission.</li>
          </ul>
          <p style="margin:8px 0;color:#3f3f46;">If everything matches, we’ll complete the purchase at the agreed amount.</p>
          <p style="margin:12px 0;"><a href="${SITE_URL}/leads/${l.id}" style="color:#007587;">Accept offer →</a> &nbsp; <a href="${SITE_URL}/leads/${l.id}" style="color:#8b8b93;">Decline offer →</a></p>
          <p style="margin:8px 0;color:#3f3f46;">If you have any questions before deciding, reply to this email.</p>
          <p style="margin:12px 0;font-weight:bold;">Vicarious Clothing</p>
        `),
      };
    }
  }
}

function writeHtmlFile(filename: string, html: string) {
  try {
    fs.mkdirSync(EMAIL_DIR, { recursive: true });
    fs.writeFileSync(path.join(EMAIL_DIR, filename), html, "utf-8");
  } catch {
    // read-only filesystem — the email is still recorded in the log
  }
}

export async function sendEmail(input: {
  to: string;
  template: EmailTemplate;
  data: Record<string, unknown>;
}): Promise<"sent" | "logged"> {
  let subject: string;
  let html: string;
  try {
    const built = buildTemplate(input.template, input.data);
    subject = built.subject;
    html = built.html;
  } catch (err) {
    console.error("Failed to build email template:", err, { template: input.template, to: input.to });
    throw err;
  }
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
        body: JSON.stringify({
          from,
          to: input.to,
          subject,
          html,
        }),
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
