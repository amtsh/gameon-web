import { enforceRateLimit } from "@/lib/api/v1/security";
import { toApiGame, getHostName, getRelationship } from "@/lib/api/v1/games";
import { handleApiError, json, requestId, userClient } from "@/app/api/v1/_lib";

export async function GET(request: Request) {
  const id = requestId(request);
  try {
    const { user, client } = await userClient(request);
    const rate = await enforceRateLimit(request, "detail", user.id);
    const status = new URL(request.url).searchParams.get("status") ?? "active";

    const [hosted, participating, requested] = await Promise.all([
      client.from("sport_events").select("*").eq("host_id", user.id),
      client.from("event_participants").select("event_id").eq("profile_id", user.id),
      client.from("event_join_requests").select("event_id,status").eq("requester_id", user.id),
    ]);

    if (hosted.error || participating.error || requested.error) {
      throw new Error("Failed to load user games.");
    }

    const ids = [...new Set([
      ...(hosted.data ?? []).map(row => row.id),
      ...(participating.data ?? []).map(row => row.event_id),
      ...(requested.data ?? []).map(row => row.event_id),
    ])];

    if (!ids.length) return json({ data: [] }, 200, rate);

    const { data: games, error } = await client.from("sport_events").select("*").in("id", ids);
    if (error) throw new Error("Failed to load user games.");

    const participantIds = new Set((participating.data ?? []).map(row => row.event_id));
    const requestRows = new Map((requested.data ?? []).map(row => [row.event_id, row.status]));

    const now = new Date().toISOString();
    const visible = (games ?? []).filter(game => {
      if (status === "all") return true;
      if (status === "archived") return game.ends_at <= now || Boolean(game.cancelled_at);
      return game.ends_at > now && !game.cancelled_at;
    });

    const names = await Promise.all(visible.map(game => getHostName(client, game.host_id)));
    return json({
      data: visible
        .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
        .map((game, index) => toApiGame(
          game,
          names[index],
          undefined,
          getRelationship(game, user.id, participantIds, requestRows),
          game.host_id === user.id && game.is_private,
        )),
    }, 200, rate);
  } catch (error) {
    return handleApiError(error, id);
  }
}
