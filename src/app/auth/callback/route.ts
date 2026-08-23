import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { sendEmail } from "@/lib/server/mailer";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/account";
  const shouldWelcome = searchParams.get("welcome") === "1";

  if (code) {
    const cookieStore = await cookies();
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (url && anon) {
      const supabase = createServerClient(url, anon, {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Cookies may be immutable in some rendering contexts.
            }
          },
        },
      });

      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error && shouldWelcome) {
        const { data } = await supabase.auth.getUser();
        const user = data.user;
        if (user?.email) {
          try {
            await sendEmail({
              to: user.email,
              template: "welcome",
              data: {
                name: String(user.user_metadata?.name ?? user.email.split("@")[0]),
              },
            });
          } catch (emailError) {
            // Account verification must still complete if the mail provider has a
            // transient problem. The failure is visible in server logs.
            console.error("Welcome email failed:", emailError);
          }
        }
      }
    }
  }

  // Only allow an internal path to avoid an open redirect through ?next=.
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/account";
  return NextResponse.redirect(`${origin}${safeNext}`);
}
