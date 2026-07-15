import { NextRequest, NextResponse } from "next/server";
import { assertSameOrigin } from "@/lib/api/same-origin";
import { createAdminClient } from "@/lib/supabase/admin";

const MONITOR_PIN = process.env.MONITOR_PIN ?? "101210";

function normalizePin(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") {
    return String(value).trim();
  }
  return "";
}

export async function POST(req: NextRequest) {
  const forbidden = assertSameOrigin(req);
  if (forbidden) return forbidden;

  const body = await req.json().catch(() => null);
  const pin = normalizePin(body?.pin);
  if (pin !== MONITOR_PIN) {
    return NextResponse.json({ error: "Invalid PIN" }, { status: 401 });
  }

  let supabase;
  try {
    supabase = createAdminClient();
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Missing SUPABASE_SERVICE_ROLE_KEY"
    ) {
      return NextResponse.json(
        { error: "Monitor stats unavailable (missing server config)" },
        { status: 503 },
      );
    }
    throw error;
  }
  const now = new Date().toISOString();

  const [accounts, activeGames, pastGames, linkLoads] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase
      .from("sport_events")
      .select("id", { count: "exact", head: true })
      .gt("ends_at", now),
    supabase
      .from("sport_events")
      .select("id", { count: "exact", head: true })
      .lte("ends_at", now),
    supabase
      .from("shared_link_loads")
      .select("id", { count: "exact", head: true }),
  ]);

  return NextResponse.json({
    accounts: accounts.count ?? 0,
    activeGames: activeGames.count ?? 0,
    pastGames: pastGames.count ?? 0,
    linkLoads: linkLoads.count ?? 0,
  });
}
