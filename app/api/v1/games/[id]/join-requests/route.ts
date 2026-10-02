import { enforceRateLimit } from "@/lib/api/v1/security";
import { getJoinRequests, getGame } from "@/lib/api/v1/games";
import { handleApiError, json, requestId, userClient } from "@/app/api/v1/_lib";

type Context = { params: Promise<{ id: string }> };
export async function GET(request: Request, context: Context) {
  const id = requestId(request);
  try {
    const { id: gameId } = await context.params;
    const { user, client } = await userClient(request);
    const rate = await enforceRateLimit(request, "detail", user.id);
    const game = await getGame(client, gameId);
    if (game.host_id !== user.id) return Response.json({ error: { code: "FORBIDDEN", message: "Only the host can view join requests." }, requestId: id }, { status: 403, headers: rate });
    return json({ data: await getJoinRequests(client, gameId) }, 200, rate);
  } catch (error) { return handleApiError(error, id); }
}
