import type { NextRequest } from "next/server";
import { sendEmail } from "@/lib/server/mailer";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = String(body.name ?? "");
    const email = String(body.email ?? "");
    if (!name || !email) {
      return Response.json({ error: "Missing fields" }, { status: 400 });
    }
    await sendEmail({ to: email, template: "welcome", data: { name } });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
}
