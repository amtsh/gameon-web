import { enforceRateLimit } from "@/lib/api/v1/security";
import { getParticipants } from "@/lib/api/v1/games";
import { handleApiError, json, requestId, optionalClient } from "@/app/api/v1/_lib";

type Context = { params: Promise<{ id: string }> };
export async function GET(request: Request, context: Context) {
  const id = requestId(request);
  try {
    const { id: gameId } = await context.params;
    const shareToken = new URL(request.url).searchParams.get("shareToken") ?? undefined;
    const rate = await enforceRateLimit(request, "detail", "public");
    const { client } = await optionalClient(request);
    return json({ data: await getParticipants(client, gameId, shareToken) }, 200, rate);
  } catch (error) { return handleApiError(error, id); }
}
