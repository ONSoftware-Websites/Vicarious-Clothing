import { NextResponse, type NextRequest } from "next/server";

// Legacy middleware compatibility only. Runtime maintenance enforcement now
// lives in the Next.js 16 root proxy.ts and reads storefront_controls.
// Do not add a second environment-variable maintenance gate here.
export function middleware(_request:NextRequest){
  return NextResponse.next();
}
export const config={
 matcher:["/((?!.*\\..*).*)"],
};
