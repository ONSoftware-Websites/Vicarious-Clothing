import { recordVisit } from "@/lib/server/store";

export async function POST() {
  recordVisit();
  return Response.json({ ok: true });
}
