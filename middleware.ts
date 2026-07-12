import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Cloudflare (@opennextjs/cloudflare) supports Edge middleware only, not
// Next.js 16's Node.js proxy.ts. Keep middleware.ts until proxy lands there.
export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static assets and images.
     * Adjust when adding public routes that must work without auth.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
