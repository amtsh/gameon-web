import { NextRequest, NextResponse } from "next/server";

/**
 * Rejects requests that didn't originate from the same host as the app.
 *
 * Host resolution order (spoof-safe on Cloudflare):
 *  - `host` is always set by the runtime itself (CF Workers / Pages / Node)
 *    and cannot be injected by an upstream caller once inside the runtime.
 *  - `x-forwarded-host` is a client-controlled header and is intentionally
 *    NOT used — a bad actor hitting the origin directly could set it to
 *    anything. Cloudflare already rewrites `host` to the canonical domain.
 *
 * Flow:
 *  1. No Origin header  → allow (same-origin browser requests may omit it;
 *     unauthenticated server callers are caught by route-level auth).
 *  2. Origin present    → parse its host and compare against `host` header.
 *     Mismatch → 403.
 */
export function assertSameOrigin(req: NextRequest): NextResponse | null {
  const origin = req.headers.get("origin");

  if (!origin) {
    return null;
  }

  // Use `host` only — never `x-forwarded-host` (spoofable by bypassing CF).
  const appHost = req.headers.get("host") ?? "";

  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (originHost !== appHost) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return null;
}
