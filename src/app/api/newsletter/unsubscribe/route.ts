import type { NextRequest } from "next/server";
import { getSupabase } from "@/lib/server/supabase";
import { verifyNewsletterUnsubscribeToken } from "@/lib/server/newsletter-access";

function page(message: string) {
  return new Response(
    `<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Newsletter Preferences</title></head><body style="font-family:Arial,sans-serif;background:#f7f6f2;color:#101014;display:grid;min-height:100vh;place-items:center;margin:0"><main style="max-width:520px;background:#fff;border:1px solid #e4e2d9;padding:32px"><p style="font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#007587">Vicarious Clothing</p><h1 style="font-size:24px;text-transform:uppercase;margin:8px 0 12px">Newsletter preferences</h1><p style="line-height:1.6;color:#3f3f46">${message}</p><p><a href="/" style="color:#007587">Return to the store</a></p></main></body></html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email")?.trim().toLowerCase() ?? "";
  const token = request.nextUrl.searchParams.get("token") ?? "";

  if (!email || !verifyNewsletterUnsubscribeToken(email, token)) {
    return page("This unsubscribe link is invalid or has expired. Please contact support and we will remove you manually.");
  }

  const db = getSupabase();
  if (!db) {
    return page("Newsletter preferences are temporarily unavailable. Please try again later.");
  }

  const { error } = await db.from("newsletter_subscribers").delete().eq("email", email);
  if (error) {
    return page("We could not update your preference right now. Please try again later.");
  }

  return page("You have been unsubscribed from marketing emails. Order updates will still be sent if you buy from us.");
}
