import type { NextRequest } from "next/server";
import { requireAdminApi } from "@/lib/server/admin-auth";
import { deleteSubscriber } from "@/lib/server/store";

export async function DELETE(request: NextRequest) {
  const authErr = await requireAdminApi();
  if (authErr) return authErr;
  const email = request.nextUrl.searchParams.get("email") ?? "";
  if (!email) return Response.json({ error: "Missing email" }, { status: 400 });
  await deleteSubscriber(email, "Henry");
  return Response.json({ ok: true });
}
