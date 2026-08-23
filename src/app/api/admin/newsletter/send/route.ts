import type { NextRequest } from "next/server";
import { requireAdminApi } from "@/lib/server/admin-auth";
import { listSubscribers, logEmail } from "@/lib/server/store";
import { EMAILS, SITE_URL } from "@/lib/site";
import { createNewsletterUnsubscribeToken } from "@/lib/server/newsletter-access";

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;");
}

function unsubscribeUrl(email: string) {
  const url = new URL("/api/newsletter/unsubscribe", SITE_URL);
  url.searchParams.set("email", email.toLowerCase());
  url.searchParams.set("token", createNewsletterUnsubscribeToken(email));
  return url.toString();
}

function newsletterHtml(subject: string, preheader: string, body: string, recipientEmail: string) {
  const paras = body.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
  const bodyHtml = paras.map(p => {
    const safe = escapeHtml(p).replace(/\n/g, "<br>");
    const linked = safe.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" style="color:#007587; text-decoration:underline;">$1</a>');
    return `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#3f3f46;">${linked}</p>`;
  }).join("");

  const preheaderHtml = preheader ? `<span style="display:none;visibility:hidden;opacity:0;color:transparent;height:0;width:0;">${escapeHtml(preheader)}</span>` : "";
  const unsubscribe = unsubscribeUrl(recipientEmail);

  return `<!doctype html><html><body style="margin:0;padding:0;background:#f7f6f2;font-family:Arial,Helvetica,sans-serif;color:#101014;">
${preheaderHtml}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 16px;">
<table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border:1px solid #e4e2d9;">
<tr><td style="padding:36px 40px;">
<p style="margin:0 0 24px;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#007587;">VICARIOUS CLOTHING</p>
<h1 style="margin:0 0 16px;font-size:24px;letter-spacing:0.02em;text-transform:uppercase;line-height:1.15;">${escapeHtml(subject)}</h1>
${bodyHtml}
<p style="margin:24px 0 0;font-size:12px;color:#8b8b93;">You’re receiving this because you signed up at ${SITE_URL}. <a href="${unsubscribe}" style="color:#007587;">Unsubscribe</a> anytime.</p>
</td></tr>
<tr><td style="padding:24px 40px;border-top:1px solid #e4e2d9;">
<p style="margin:0;font-size:11px;color:#8b8b93;line-height:1.7;">Vicarious Clothing · ${SITE_URL}<br>Curated clothing, ready to go again.</p>
</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

export async function POST(request: NextRequest) {
  const authErr = await requireAdminApi();
  if (authErr) return authErr;

  try {
    const { subject, preheader, body, testEmail } = await request.json();
    if (!subject || !body) return Response.json({ error: "Subject and body required" }, { status: 400 });

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return Response.json({ error: "RESEND_API_KEY not configured — set it in Vercel to send" }, { status: 500 });

    const from = EMAILS.notifications;

    if (testEmail) {
      const to = String(testEmail).toLowerCase();
      const html = newsletterHtml(String(subject), String(preheader || ""), String(body), to);
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from, to, subject: String(subject), html }),
      });
      if (!res.ok) {
        const text = await res.text();
        return Response.json({ error: `Resend failed: ${res.status} ${text}` }, { status: 500 });
      }
      await logEmail({ to, subject: String(subject), template: "newsletter", status: "sent", provider: "resend", sentAt: new Date().toISOString(), preview: String(subject) });
      return Response.json({ ok: true, sent: 1 });
    }

    const subscribers = await listSubscribers();
    if (subscribers.length === 0) return Response.json({ error: "No subscribers" }, { status: 400 });

    let sent = 0;
    const errors: string[] = [];
    const queue = [...subscribers];
    const concurrency = 5;
    async function worker() {
      while (queue.length) {
        const sub = queue.shift();
        if (!sub) break;
        try {
          const html = newsletterHtml(String(subject), String(preheader || ""), String(body), sub.email);
          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({ from, to: sub.email, subject: String(subject), html }),
          });
          if (!res.ok) {
            const text = await res.text();
            errors.push(`${sub.email}: ${res.status} ${text}`);
          } else {
            sent++;
            await logEmail({ to: sub.email, subject: String(subject), template: "newsletter", status: "sent", provider: "resend", sentAt: new Date().toISOString(), preview: String(subject) });
          }
        } catch (e) {
          errors.push(`${sub.email}: ${String(e)}`);
        }
      }
    }
    await Promise.all(Array.from({ length: concurrency }, () => worker()));

    if (sent === 0 && errors.length) return Response.json({ error: errors[0] }, { status: 500 });
    return Response.json({ ok: true, sent, errors: errors.slice(0, 3) });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
