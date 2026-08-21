import type { NextRequest } from "next/server";
import { evaluateDiscount } from "@/lib/server/store";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const code = String(body.code ?? "");
    const subtotal = Number(body.subtotal ?? 0);
    const email = String(body.email ?? "");
    const skus: string[] = Array.isArray(body.skus)
      ? body.skus.map((s: unknown) => String(s))
      : [];

    if (!code) {
      return Response.json({ ok: false, error: "Enter a code." }, { status: 400 });
    }

    const result = await evaluateDiscount(code, { subtotal, email, itemSkus: skus });
    if (!result.ok) {
      return Response.json({ ok: false, error: result.error }, { status: 400 });
    }
    return Response.json({ ok: true, discount: result.discount });
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
}
