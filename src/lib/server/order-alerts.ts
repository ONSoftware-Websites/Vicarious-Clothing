import type { Order } from "@/lib/types";
import { EMAILS, EXPRESS_DELIVERY_COST, SITE_URL } from "@/lib/site";
import { formatPrice } from "@/lib/utils";
import { listEmails, logEmail } from "@/lib/server/store";

const TEMPLATE = "admin-order-alert";

function esc(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;");
}

function notificationRecipients() {
  const configured =
    process.env.ORDER_ALERT_EMAIL ||
    process.env.HENRY_ORDER_NOTIFY_EMAIL ||
    EMAILS.owner;

  return configured
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);
}

function alertFromAddress() {
  return process.env.RESEND_FROM_EMAIL || `Vicarious Clothing <${EMAILS.notifications}>`;
}

function formatAddress(order: Order) {
  const address = order.address;
  const lines = [
    order.name,
    address.line1,
    address.line2,
    address.city,
    address.postcode,
    address.country,
  ].filter(Boolean);
  return lines.map((line) => esc(line)).join("<br>");
}

function deliveryMethod(order: Order) {
  return order.delivery === EXPRESS_DELIVERY_COST
    ? "Express — Royal Mail Tracked 24"
    : "Standard — Royal Mail Tracked 48";
}

function adminOrderUrl(order: Order) {
  return `${SITE_URL}/admin/orders/${encodeURIComponent(order.id)}`;
}

function itemsTable(order: Order) {
  const rows = order.items
    .map(
      (item) => `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #e4e2d9;">
          <strong>${esc(item.sku)}</strong> — ${esc(item.brand)} ${esc(item.name)}<br>
          <span style="color:#73737c;">${esc(item.size)} · ${esc(item.condition)}</span>
        </td>
        <td style="padding:8px 0;border-bottom:1px solid #e4e2d9;text-align:right;white-space:nowrap;">${formatPrice(item.price)}</td>
      </tr>`
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;margin:12px 0;">${rows}</table>`;
}

function orderAlertEmail(order: Order) {
  const subject = `New paid order ${order.id} — ${formatPrice(order.total)}`;
  const html = `<!doctype html>
<html>
<body style="margin:0;padding:0;background:#f7f6f2;font-family:Arial,Helvetica,sans-serif;color:#101014;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:32px 16px;">
      <table role="presentation" width="100%" style="max-width:620px;background:#ffffff;border:1px solid #e4e2d9;">
        <tr><td style="padding:32px 36px;">
          <p style="margin:0 0 16px;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#007587;">Vicarious Clothing admin alert</p>
          <h1 style="margin:0 0 10px;font-size:24px;line-height:1.15;text-transform:uppercase;">New order paid.</h1>
          <p style="margin:0 0 18px;color:#3f3f46;line-height:1.6;">Order <strong>${esc(order.id)}</strong> has been paid and is ready for Henry to pick, pack and dispatch.</p>

          <p style="margin:10px 0;color:#3f3f46;line-height:1.8;">
            <strong>Total:</strong> ${formatPrice(order.total)}<br>
            <strong>Subtotal:</strong> ${formatPrice(order.subtotal)}<br>
            <strong>Delivery:</strong> ${order.delivery === 0 ? "Free" : formatPrice(order.delivery)}<br>
            <strong>Delivery method:</strong> ${deliveryMethod(order)}<br>
            <strong>Customer:</strong> ${esc(order.name)} &lt;${esc(order.email)}&gt;<br>
            <strong>Placed:</strong> ${esc(order.createdAt)}
          </p>

          <h2 style="margin:22px 0 8px;font-size:14px;text-transform:uppercase;letter-spacing:0.12em;">Items</h2>
          ${itemsTable(order)}

          <h2 style="margin:22px 0 8px;font-size:14px;text-transform:uppercase;letter-spacing:0.12em;">Delivery address</h2>
          <p style="margin:0;color:#3f3f46;line-height:1.7;">${formatAddress(order)}</p>

          <p style="margin:24px 0 0;"><a href="${esc(adminOrderUrl(order))}" style="display:inline-block;background:#101014;color:#ffffff;text-decoration:none;padding:12px 18px;font-size:12px;font-weight:bold;letter-spacing:0.08em;text-transform:uppercase;">Open order in admin</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return { subject, html };
}

async function alreadySent(order: Order, recipient: string) {
  try {
    const recent = await listEmails(300);
    const target = recipient.toLowerCase();
    return recent.some(
      (entry) =>
        entry.template === TEMPLATE &&
        entry.to.toLowerCase() === target &&
        (entry.subject.includes(order.id) || entry.preview.includes(order.id))
    );
  } catch (error) {
    // A logging-store problem should not prevent Henry from getting a new sale alert.
    console.error("Could not check prior paid-order admin alerts:", error);
    return false;
  }
}

async function sendViaResend(to: string, subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("RESEND_API_KEY is required to send paid order admin alerts.");
    }
    return false;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: alertFromAddress(),
      to,
      reply_to: EMAILS.support,
      subject,
      html,
    }),
  });

  if (!res.ok) {
    throw new Error(`Order alert email provider error ${res.status}: ${await res.text()}`);
  }

  return true;
}

export async function sendAdminOrderAlertOnce(order: Order) {
  const recipients = notificationRecipients();
  if (!recipients.length) return { notified: false, recipients: [] };

  const { subject, html } = orderAlertEmail(order);
  const notified: string[] = [];

  for (const recipient of recipients) {
    if (await alreadySent(order, recipient)) continue;

    const sent = await sendViaResend(recipient, subject, html);
    try {
      await logEmail({
        to: recipient,
        subject,
        template: TEMPLATE,
        status: sent ? "sent" : "logged",
        provider: sent ? "resend" : "local-dev",
        sentAt: new Date().toISOString(),
        preview: `${order.id} ${formatPrice(order.total)}`,
      });
    } catch (error) {
      // The alert itself has already been sent; failing to write the email log
      // should not make checkout/reporting think Henry was not notified.
      console.error("Could not log paid-order admin alert:", error);
    }
    notified.push(recipient);
  }

  return { notified: notified.length > 0, recipients: notified };
}
