import { redirect } from "next/navigation";
import { fetchSportEvent } from "@/lib/data/events";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { sportEventSharePath } from "@/lib/share-token";

type Params = { params: Promise<{ id: string }> };

/** Legacy /game/{slug}/calendar redirects to canonical /g/{token}/calendar. */
export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;

  if (!hasSupabaseEnv()) {
    return new Response("Not found", { status: 404 });
  }

  const event = await fetchSportEvent(id);
  if (!event) {
    return new Response("Not found", { status: 404 });
  }

  redirect(`${sportEventSharePath(event.shareToken)}/calendar`);
}
