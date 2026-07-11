import { fetchSportEvent } from "@/lib/data/events";
import { buildSportEventIcs, sportEventIcsFilename } from "@/lib/calendar/ics";
import { getSiteUrl } from "@/lib/seo/site";
import { hasSupabaseEnv } from "@/lib/supabase/env";

type Params = { params: Promise<{ id: string }> };

/** Serve a downloadable .ics calendar file for a game (mobile-friendly fallback). */
export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;

  if (!hasSupabaseEnv()) {
    return new Response("Not found", { status: 404 });
  }

  const event = await fetchSportEvent(id);
  if (!event) {
    return new Response("Not found", { status: 404 });
  }

  const eventUrl = `${getSiteUrl()}/game/${id}`;
  const body = buildSportEventIcs(event, eventUrl);

  return new Response(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${sportEventIcsFilename(event)}"`,
      "Cache-Control": "private, max-age=300",
    },
  });
}
