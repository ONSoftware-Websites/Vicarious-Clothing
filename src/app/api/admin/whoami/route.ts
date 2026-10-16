import { getAdminRole } from "@/lib/server/admin-auth";
export const dynamic = "force-dynamic";
export async function GET() {
  const role = await getAdminRole();
  if (role === "CUSTOMER") return Response.json({error:"Unauthorized"}, {status:403});
  return Response.json({role}, {headers:{"Cache-Control":"no-store"}});
}
