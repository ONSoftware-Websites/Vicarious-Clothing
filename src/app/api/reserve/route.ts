import type { NextRequest } from "next/server";
import { releaseProducts, reserveProducts } from "@/lib/server/store";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const skus: string[] = Array.isArray(body.skus)
      ? body.skus.map((s: unknown) => String(s))
      : [];
    if (skus.length === 0) {
      return Response.json({ error: "No items" }, { status: 400 });
    }
    const { ok, gone } = await reserveProducts(skus);
    return Response.json({ ok, gone });
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const skus: string[] = Array.isArray(body.skus)
      ? body.skus.map((s: unknown) => String(s))
      : [];
    await releaseProducts(skus);
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
}
