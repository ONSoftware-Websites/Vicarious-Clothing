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
        html: layout("Welcome in.", `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#3f3f46;">Hi ${name},<br>Thanks for joining. New pieces don't tend to stay around — you'll hear from us when the next drop lands.</p>
          <p style="margin:0;"><a href="${SITE_URL}/shop/new-in" style="color:#007587;">Shop new in →</a></p>`),
      };
    }
    case "order-confirmed": {
      const order = data.order as Order;
      return {
        subject: `Your Vicarious order ${order.id}`,
        html: layout("It's yours.", `<p style="margin:0 0 8px;font-size:15px;color:#3f3f46;">Thanks ${order.name} — order <strong>${order.id}</strong> is confirmed.</p>
          <p style="margin:0 0 24px;font-size:13px;color:#8b8b93;">We'll let you know when it's on the way.</p>
          ${itemsTable(order)}
          <p style="margin:24px 0 0;"><a href="${SITE_URL}/order/${order.id}" style="color:#007587;">View order →</a></p>`),
      };
    }
    case "order-dispatched": {
      const order = data.order as Order;
      return {
        subject: `Your Vicarious order ${order.id} is on the way`,
        html: layout("It's on the way.", `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#3f3f46;">Order <strong>${order.id}</strong> has left the studio.</p>
          ${order.tracking ? `<p style="margin:0 0 16px;font-size:13px;color:#3f3f46;">${order.carrier ?? "Tracking"}: <strong>${order.tracking}</strong></p>` : ""}
          <p style="margin:0;"><a href="${SITE_URL}/order/${order.id}" style="color:#007587;">View order →</a></p>`),
      };
    }
    case "order-delivered": {
      const order = data.order as Order;
      return {
        subject: `Your Vicarious order ${order.id} has been delivered`,
        html: layout("It's arrived.", `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#3f3f46;">Order <strong>${order.id}</strong> has been delivered. Give it a proper first outing.</p>
          <p style="margin:0;font-size:13px;color:#8b8b93;">Changed your mind? You have 14 days — <a href="${SITE_URL}/help/returns" style="color:#007587;">returns</a>.</p>`),
      };
    }
    case "order-refunded": {
      const order = data.order as Order;
      return {
        subject: `Your refund for order ${order.id}`,
        html: layout("You've been refunded.", `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#3f3f46;">We've refunded <strong>${formatPrice(order.total)}</strong> for order <strong>${order.id}</strong>. It should land back on your original payment method within 5 working days.</p>`),
      };
    }
    case "order-cancelled": {
      const order = data.order as Order;
      return {
        subject: `Your Vicarious order ${order.id} was cancelled`,
        html: layout("Order cancelled.", `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#3f3f46;">Order <strong>${order.id}</strong> has been cancelled. If you've been charged, your refund is on its way.</p>
          <p style="margin:0;"><a href="${SITE_URL}/shop" style="color:#007587;">Browse everything →</a></p>`),
      };
    }
    case "password-reset": {
      const link = String(data.link ?? "");
      return {
        subject: "Reset your Vicarious Clothing password",
        html: layout("Reset your password.", `<p style="margin:0 0 16px;font-size:15px;color:#3f3f46;">Use the link below to set a new password. It expires in 1 hour.</p>
          <p style="margin:0 0 24px;"><a href="${link}" style="color:#007587;">Reset password →</a></p>
          <p style="margin:0;font-size:12px;color:#8b8b93;">Didn't ask for this? You can ignore this email.</p>`),
      };
    }
    case "lead-enquiry": {
      const lead = data;
      return {
        subject: `Sell To Us: ${String(lead.brand ?? "")} ${String(lead.itemType ?? "")} from ${String(lead.name ?? "")}`,
        html: layout("New sell-to-us enquiry.", `<table role="presentation" cellpadding="0" cellspacing="0" style="font-size:14px;">
          ${[["Seller", lead.name], ["Email", lead.email], ["Item", `${lead.brand} ${lead.itemType}`], ["Size", lead.size], ["Condition", lead.condition], ["Notes", lead.notes ?? "—"]]
            .map(([k, v]) => `<tr><td style="padding:6px 0;color:#56565e;width:120px;">${k}</td><td style="padding:6px 0;">${v}</td></tr>`)
            .join("")}
        </table>
        <p style="margin:20px 0 0;"><a href="${SITE_URL}/admin/leads" style="color:#007587;">Open in admin →</a></p>`),
      };
    }
    case "lead-offer": {
      const lead = data;
      const raw = String(lead.offer ?? "").trim();
      const amount = raw ? (/^\d/.test(raw) && !raw.includes("£") ? `£${raw}` : raw) : "an amount";
      return {
        subject: `An offer on your ${String(lead.itemType ?? "item")} — Vicarious Clothing`,
        html: layout("We'd like to buy it.", `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#3f3f46;">Hi ${esc(lead.name ?? "")},<br>Good news — we'd like to offer you <strong>${esc(amount)}</strong> for your ${esc(lead.brand ?? "")} ${esc(lead.itemType ?? "")} <span style="color:#8b8b93;">(Size ${esc(lead.size ?? "")}, ${esc(lead.condition ?? "")})</span>.</p>
          <p style="margin:0 0 8px;font-size:13px;color:#3f3f46;">If you accept, reply to this email and we'll sort postage and payment. Offer valid for 7 days.</p>
          <p style="margin:0;font-size:12px;color:#8b8b93;">Questions — just reply. Your item: ${esc(lead.brand ?? "")} ${esc(lead.itemType ?? "")}.</p>`),
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
