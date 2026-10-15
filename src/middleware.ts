import { NextResponse, type NextRequest } from "next/server";

// Scheduled maintenance: enabled until MAINTENANCE_MODE=false is deployed.
const maintenanceOn = () => process.env.MAINTENANCE_MODE !== "false";
const maintenanceExempt = (p: string) =>
  p === "/maintenance" || p.startsWith("/maintenance/") ||
  p === "/admin" || p.startsWith("/admin/") ||
  p.startsWith("/api/admin/") || p.startsWith("/api/webhooks/") ||
  p.startsWith("/api/integrations/") || p === "/api/cron/sellerhq" || p === "/api/health" ||
  p.startsWith("/_next/") || p.startsWith("/images/") ||
  p === "/robots.txt" || p === "/site.webmanifest" ||
  p === "/favicon.ico" || p.startsWith("/favicon-") ||
  p.startsWith("/android-chrome-") || p === "/apple-touch-icon.png";

const DEFAULT_LAUNCH_AT = "2026-09-02T11:00:00.000Z"; // 12:00 Europe/London, Wednesday 2 September 2026.

const allowedPrefixes = [
  "/admin",
  "/api",
  "/auth",
  "/_next",
  "/images",
];

const allowedExactPaths = new Set([
  "/launch",
  "/favicon.ico",
  "/favicon-16x16.png",
  "/favicon-32x32.png",
  "/apple-touch-icon.png",
  "/android-chrome-192x192.png",
  "/android-chrome-512x512.png",
  "/site.webmanifest",
  "/robots.txt",
  "/sitemap.xml",
]);

function launchTime() {
  const configured = process.env.NEXT_PUBLIC_LAUNCH_AT ?? DEFAULT_LAUNCH_AT;
  const parsed = Date.parse(configured);
  return Number.isFinite(parsed) ? parsed : Date.parse(DEFAULT_LAUNCH_AT);
}

function launchGateEnabled() {
  return process.env.NEXT_PUBLIC_LAUNCH_GATE_ENABLED !== "false";
}

function isAllowedPath(pathname: string) {
  if (allowedExactPaths.has(pathname)) return true;
  return allowedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (maintenanceOn() && !maintenanceExempt(pathname)) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "The shop is temporarily unavailable for scheduled maintenance." },
        { status: 503, headers: { "Retry-After": "3600", "Cache-Control": "no-store" } }
      );
    }
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new NextResponse("Scheduled maintenance", {
        status: 503, headers: { "Retry-After": "3600", "Cache-Control": "no-store" }
      });
    }
    return NextResponse.redirect(new URL("/maintenance", request.url), {
      status: 307,
      headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" }
    });
  }


  if (!launchGateEnabled()) return NextResponse.next();

  const launched = Date.now() >= launchTime();

  if (launched) {
    if (pathname === "/launch") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  if (isAllowedPath(pathname)) return NextResponse.next();

  const launchUrl = request.nextUrl.clone();
  launchUrl.pathname = "/launch";
  launchUrl.search = "";

  return NextResponse.rewrite(launchUrl, {
    headers: {
      "x-robots-tag": "noindex, nofollow",
    },
  });
}

export const config = {
  matcher: ["/((?!.*\\..*).*)", "/favicon.ico", "/site.webmanifest", "/robots.txt", "/sitemap.xml"],
};
