import type { Order } from "@/lib/types";
import { EMAILS, EXPRESS_DELIVERY_COST, SITE_URL } from "@/lib/site";
import { formatPrice } from "@/lib/utils";
import { logEmail } from "@/lib/server/store";

const TEMPLATE = "admin-order-alert";

function esc(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function notificationRecipients() {
  const configured = [
    process.env.ORDER_ALERT_EMAIL,
    process.env.HENRY_ORDER_NOTIFY_EMAIL,
    EMAILS.owner,
  ];

  const recipients = configured
    .flatMap((value) => String(value ?? "").split(","))
    .map((email) => email.trim())
    .filter(Boolean);

  return [...new Set(recipients.map((email) => email.toLowerCase()))];
}

function alertFromAddress() {
  // Match the known-working transactional customer email sender.
  return EMAILS.notifications;
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

async function sendViaResend(to: string, subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("RESEND_API_KEY is required to send paid order admin alerts.");
    }
    return { sent: false, provider: "local-dev", id: null };
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
      subject,
      html,
    }),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(
      `Order alert email provider error ${res.status}: ${JSON.stringify(data)}`
    );
  }

  return {
    sent: true,
    provider: "resend",
    id: typeof data?.id === "string" ? data.id : null,
  };
}

export async function sendAdminOrderAlertOnce(order: Order) {
  const recipients = notificationRecipients();
  if (!recipients.length) return { notified: false, recipients: [], results: [] };

  const { subject, html } = orderAlertEmail(order);
  const results: Array<{
    recipient: string;
    sent: boolean;
    provider: string;
    id: string | null;
  }> = [];

  for (const recipient of recipients) {
    // Do not silently suppress alerts based on the email log. Missing Henry's
    // alert is worse than receiving a duplicate internal notification.
    const result = await sendViaResend(recipient, subject, html);
    try {
      await logEmail({
        to: recipient,
        subject,
        template: TEMPLATE,
        status: result.sent ? "sent" : "logged",
        provider: result.provider,
        sentAt: new Date().toISOString(),
        preview: `${order.id} ${formatPrice(order.total)} ${result.id ?? ""}`,
      });
    } catch (error) {
      console.error("Could not log paid-order admin alert:", error);
    }
    results.push({ recipient, ...result });
  }

  return {
    notified: results.some((result) => result.sent),
    recipients,
    results,
  };
}
