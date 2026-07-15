import { NextRequest, NextResponse } from "next/server";
import { assertSameOrigin } from "@/lib/api/same-origin";
import { createAdminClient } from "@/lib/supabase/admin";

const MONITOR_PIN = "101210";

export async function POST(req: NextRequest) {
  const forbidden = assertSameOrigin(req);
  if (forbidden) return forbidden;

  const body = await req.json().catch(() => null);
  const pin = typeof body?.pin === "string" ? body.pin : "";
  if (pin !== MONITOR_PIN) {
    return NextResponse.json({ error: "Invalid PIN" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const now = new Date().toISOString();

  const [accounts, activeGames, pastGames, linkLoads, cancelledGames] =
    await Promise.all([
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
      supabase
        .from("sport_events")
        .select("id", { count: "exact", head: true })
        .not("cancelled_at", "is", null),
    ]);

  return NextResponse.json({
    accounts: accounts.count ?? 0,
    activeGames: activeGames.count ?? 0,
    pastGames: pastGames.count ?? 0,
    linkLoads: linkLoads.count ?? 0,
    cancelledGames: cancelledGames.count ?? 0,
  });
}
