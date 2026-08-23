import type { NextRequest } from "next/server";
import { SITE_URL } from "@/lib/site";
import { getSupabase } from "@/lib/server/supabase";
import { sendEmail } from "@/lib/server/mailer";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    if (!email || !email.includes("@")) {
      return Response.json({ error: "Enter a valid email address" }, { status: 400 });
    }

    const supabase = getSupabase();
    if (!supabase) {
      return Response.json({ error: "Account service is not configured" }, { status: 503 });
    }
    if (process.env.NODE_ENV === "production" && !process.env.RESEND_API_KEY) {
      return Response.json({ error: "Email service is temporarily unavailable" }, { status: 503 });
    }

    const redirectTo = `${SITE_URL}/auth/callback?next=/auth/verify`;
    const { data, error } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo },
    });

    // Do not reveal whether an account exists for the supplied address.
    if (error || !data?.properties?.action_link) {
      if (error) console.warn("Password reset link not generated:", error.message);
      return Response.json({ ok: true });
    }

    const name = String(
      data.user?.user_metadata?.name ?? data.user?.email?.split("@")[0] ?? "there"
    );
    await sendEmail({
      to: email,
      template: "password-reset",
      data: {
        name,
        link: data.properties.action_link,
        expiryTime: process.env.PASSWORD_RESET_EXPIRY_LABEL ?? "1 hour",
      },
    });

    return Response.json({ ok: true });
  } catch (error) {
    console.error("Password reset request failed:", error);
    // Preserve account-enumeration resistance while returning a generic failure
    // only for infrastructure problems we can actually detect.
    return Response.json({ error: "Could not send the reset email" }, { status: 500 });
  }
}
