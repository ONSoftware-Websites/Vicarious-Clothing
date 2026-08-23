import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function isMutation(request: NextRequest) {
  return request.nextUrl.pathname.startsWith("/api/") && request.method !== "GET" && request.method !== "HEAD";
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

export async function middleware(request: NextRequest) {
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

  // Browser/customer sessions must use the anonymous public key. The service-role
  // credential is intentionally never substituted into an auth session client.
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
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
