import { enforceRateLimit, mergeHeaders, withIdempotency } from "@/lib/api/v1/security";
import { updateGameSchema, parseJson } from "@/lib/api/v1/validation";
import { updateGame, cancelGame, getGame, getHostName, toApiGame } from "@/lib/api/v1/games";
import { handleApiError, json, noContent, requestId, userClient, optionalClient } from "@/app/api/v1/_lib";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: Context) {
  const id = requestId(request);
  try {
    const { id: gameId } = await context.params;
    const shareToken = new URL(request.url).searchParams.get("shareToken") ?? undefined;
    const rate = await enforceRateLimit(request, "detail", "public");
    const { client } = await optionalClient(request);
    const row = await getGame(client, gameId, shareToken);
    return json({ data: toApiGame(row, await getHostName(client, row.host_id)) }, 200, rate);
  } catch (error) {
    return handleApiError(error, id);
  }
}

export async function PATCH(request: Request, context: Context) {
  const id = requestId(request);
  try {
    const { id: gameId } = await context.params;
    const { user, client } = await userClient(request);
    const rate = await enforceRateLimit(request, "mutation", user.id);
    const result = await withIdempotency(request, user.id, async () => {
      const patch = parseJson(updateGameSchema, await request.clone().json());
      const result = await updateGame(client, user.id, gameId, patch);
      return {
        status: 200,
        body: { data: toApiGame(result, await getHostName(client, user.id)) },
      };
    });
    return json(result.body, result.status, mergeHeaders(
      rate,
      new Headers({ "X-Idempotent-Replay": String(result.replayed) }),
    ));
  } catch (error) {
    return handleApiError(error, id);
  }
}

export async function DELETE(request: Request, context: Context) {
  const id = requestId(request);
  try {
    const { id: gameId } = await context.params;
    const { user, client } = await userClient(request);
    const rate = await enforceRateLimit(request, "mutation", user.id);
    await cancelGame(client, user.id, gameId);
    return noContent(204, rate);
  } catch (error) {
    return handleApiError(error, id);
  }
}
