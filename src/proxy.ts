import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const exemptMaintenance = (path:string) =>
  path === "/maintenance" || path.startsWith("/maintenance/") ||
  path === "/admin" || path.startsWith("/admin/") ||
  path.startsWith("/api/admin/") || path.startsWith("/api/webhooks/") ||
  path.startsWith("/api/integrations/") || path.startsWith("/api/cron/") ||
  path === "/api/health" || path.startsWith("/_next/") ||
  path.startsWith("/optimized-images/") || path.startsWith("/images/") ||
  path === "/favicon.ico" || path.startsWith("/favicon-") ||
  path.startsWith("/android-chrome-") || path === "/apple-touch-icon.png" ||
  path === "/site.webmanifest";

async function maintenanceEnabled():Promise<boolean>{
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!key)return process.env.NODE_ENV==="production";
  try{
    const response=await fetch(`${url}/rest/v1/storefront_controls?id=eq.1&select=maintenance_enabled`,{
      headers:{apikey:key,Authorization:`Bearer ${key}`},
      cache:"no-store",signal:AbortSignal.timeout(4000)
    });
    if(!response.ok)return true;
    const data=await response.json() as {maintenance_enabled:boolean}[];
    return data.length!==1 || data[0].maintenance_enabled!==false;
  }catch{return true;}
}

function isMutation(request: NextRequest) {
  return (
    request.nextUrl.pathname.startsWith("/api/") &&
    request.method !== "GET" &&
    request.method !== "HEAD"
  );
}

async function productionStoreReady() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRole) return false;

  try {
    const response = await fetch(`${url}/rest/v1/products?select=sku&limit=1`, {
      method: "GET",
      headers: {
        apikey: serviceRole,
        Authorization: `Bearer ${serviceRole}`,
      },
      cache: "no-store",
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const pathname=request.nextUrl.pathname;
  if(!exemptMaintenance(pathname)&&await maintenanceEnabled()){
    if(pathname.startsWith("/api/"))return NextResponse.json({error:"The shop is temporarily closed for maintenance."},{status:503,headers:{"Cache-Control":"no-store","Retry-After":"300"}});
    if(request.method!=="GET"&&request.method!=="HEAD")return new NextResponse("Maintenance",{status:503,headers:{"Cache-Control":"no-store"}});
    return NextResponse.redirect(new URL("/maintenance",request.url),{status:307,headers:{"Cache-Control":"no-store","X-Robots-Tag":"noindex, nofollow"}});
  }
  // The store layer has a local development fallback. Never allow a production
  // mutation to reach that fallback when Supabase itself is unavailable, because
  // serverless memory is non-durable and would make successful-looking writes vanish.
  if (process.env.NODE_ENV === "production" && isMutation(request)) {
    if (!(await productionStoreReady())) {
      return NextResponse.json(
        { error: "The data service is temporarily unavailable. Nothing was changed." },
        { status: 503 }
      );
    }
  }

  let response = NextResponse.next({ request: { headers: request.headers } });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return response;

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
