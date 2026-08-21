import { recordVisit } from "@/lib/server/store";

export async function POST() {
  await recordVisit();
  return Response.json({ ok: true });
}
