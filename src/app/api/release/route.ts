import type { NextRequest } from "next/server";
import { releaseProducts } from "@/lib/server/store";

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
