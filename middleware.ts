import { type NextRequest, NextResponse } from "next/server";
import { isProbePath } from "@/lib/security/probe-paths";
import { updateSession } from "@/lib/supabase/middleware";

// Cloudflare (@opennextjs/cloudflare) supports Edge middleware only, not
// Next.js 16's Node.js proxy.ts. Keep middleware.ts until proxy lands there.
export async function middleware(request: NextRequest) {
  if (isProbePath(request.nextUrl.pathname)) {
    return new NextResponse(null, { status: 404 });
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static assets, metadata routes, and OG
     * images — those do not need Supabase session refresh.
     */
    "/((?!_next/static|_next/image|favicon.ico|apple-icon|manifest\\.webmanifest|robots\\.txt|sitemap\\.xml|icon|.*opengraph-image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|webmanifest|txt|woff2?)$).*)",
  ],
};
