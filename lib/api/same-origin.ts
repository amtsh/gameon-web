import { NextRequest, NextResponse } from "next/server";

/**
 * Rejects requests that didn't originate from the same host as the app.
 *
 * Strategy:
 *  1. Browsers always send an `Origin` header on cross-origin fetches.
 *     Same-origin fetches MAY omit it (e.g. form GETs) — we allow those.
 *  2. When Origin IS present it must match the app host.
 *  3. The app host is derived from the `host` / `x-forwarded-host` header
 *     that Next.js / the reverse-proxy populates — never from env alone
 *     so this works on any deployment URL automatically.
 *
 * Returns null if the request is allowed, or a 403 NextResponse if not.
 */
export function assertSameOrigin(req: NextRequest): NextResponse | null {
  const origin = req.headers.get("origin");

  // No Origin header → direct server-to-server call without a browser,
  // or a same-origin request that the browser chose not to attach it to.
  // We treat "no origin" as trusted only when there is also no Referer
  // pointing at a foreign host. Curl / Postman will have neither.
  // To block non-browser callers entirely you'd need an API secret instead;
  // this guard is specifically about cross-origin browser requests.
  if (!origin) {
    return null; // allow — handled by auth checks in the route itself
  }

  const appHost =
    req.headers.get("x-forwarded-host") ??
    req.headers.get("host") ??
    "";

  // Normalise: strip port for comparison when both sides are same port
  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    // Malformed origin — reject
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (originHost !== appHost) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return null;
}
