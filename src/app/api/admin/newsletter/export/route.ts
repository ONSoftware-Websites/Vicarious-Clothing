import { requireAdminApi } from "@/lib/server/admin-auth";
import { listSubscribers } from "@/lib/server/store";

export async function GET() {
  const authError = await requireAdminApi();
  if (authError) return authError;

  const subscribers = listSubscribers();
  const rows = [
    ["email", "source", "consented_at"],
    ...subscribers.map((s) => [s.email, s.source, s.consentedAt]),
  ];
  const csv = rows
    .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
    .join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="vicarious-subscribers-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
