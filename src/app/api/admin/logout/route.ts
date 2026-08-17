import { clearAdminCookie } from "@/lib/server/admin-auth";

export async function POST() {
  await clearAdminCookie();
  return Response.json({ ok: true });
}
