import { redirect } from "next/navigation";
import { fetchSportEvent } from "@/lib/data/events";
import { buildRedirectPath } from "@/lib/shared-game/build-redirect-path";
import { findMockEvent } from "@/lib/shared-game/shared-game-page";
import { sportEventSharePath } from "@/lib/share-token";
import { hasSupabaseEnv } from "@/lib/supabase/env";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** Legacy /game/{slug} URLs redirect to canonical /g/{token}. */
export default async function LegacySharedGamePage({
  params,
  searchParams,
}: Props) {
  const { id } = await params;
  const query = await searchParams;
  const event = hasSupabaseEnv() ? await fetchSportEvent(id) : findMockEvent(id);
  const token = event?.shareToken ?? id;
  redirect(buildRedirectPath(sportEventSharePath(token), query));
}
