import type { NextRequest } from "next/server";
import { requireAdminApi } from "@/lib/server/admin-auth";
import { adminDeleteSubscriber } from "@/lib/server/admin-delete";

const ACTOR = "Admin";

export async function DELETE(request: NextRequest) {
  const authErr = await requireAdminApi();
  if (authErr) return authErr;
  const email = request.nextUrl.searchParams.get("email") ?? "";
  if (!email) return Response.json({ error: "Missing email" }, { status: 400 });
  try {
    await adminDeleteSubscriber(email, ACTOR);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Subscriber delete failed:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Subscriber delete failed" },
      { status: 500 }
    );
  }
}
