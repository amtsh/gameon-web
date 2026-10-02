import type { SportEvent } from "@/app/types";
import type { DiscoveryFilter } from "@/lib/location/discovery";
import { getApi } from "@/lib/api/v1/client";
import type { CostCurrency } from "@/lib/create-event/cost";
import { createClient } from "@/lib/supabase/client";
import type { ApiGame, ApiGameRelationship } from "@/lib/api/v1/types";

type ApiGameResponse = {
  data: ApiGame[];
  pagination?: { hasMore: boolean; nextCursor: string | null };
};

type PersonalGame = ApiGame & { relationship?: ApiGameRelationship; shareToken?: string };

function toSportEvent(game: PersonalGame): SportEvent {
  const relationship: Partial<ApiGameRelationship> = game.relationship ?? {};
  return {
    id: game.id,
    title: game.title,
    sport: game.sport,
    skillLevel: game.skillLevel,
    startsAt: game.startsAt,
    endsAt: game.endsAt,
    venue: {
      name: game.venue.name,
      address: game.venue.address ?? undefined,
      city: game.venue.city ?? undefined,
      latitude: game.venue.latitude,
      longitude: game.venue.longitude,
    },
    capacity: game.capacity,
    joinedCount: game.joinedCount,
    cost: game.cost
      ? {
          amount: game.cost.amount,
          currency: game.cost.currency as CostCurrency,
          mode: game.cost.mode,
        }
      : undefined,
    description: game.description || undefined,
    hostId: game.host.id,
    hostName: game.host.name,
    isCreatedByCurrentUser: relationship.isHost,
    isJoined: relationship.isJoined,
    hasPendingRequest: relationship.hasPendingRequest,
    isOnWaitlist: relationship.isOnWaitlist,
    autoApprove: game.autoApprove,
    isPrivate: game.isPrivate,
    isCancelled: game.cancelledAt != null,
    shareToken: game.shareToken ?? game.id,
    distanceKm:
      game.venue.distanceMeters === undefined
        ? undefined
        : game.venue.distanceMeters / 1000,
  };
}

function discoveryQuery(discovery: DiscoveryFilter) {
  const params = new URLSearchParams();
  if (discovery.sport) params.set("sport", discovery.sport);
  if (discovery.skill && discovery.skill !== "any") params.set("skill", discovery.skill);
  params.set("from", new Date().toISOString());
  params.set("lat", String(discovery.center.latitude));
  params.set("lng", String(discovery.center.longitude));
  params.set("radiusKm", String(discovery.radiusKm));
  params.set("limit", "100");
  return params.toString();
}

async function fetchPersonalGames(status: "active" | "archived") {
  const response = await getApi<{ data: PersonalGame[] }>(
    `/me/games?status=${status}`,
  );
  return response.data;
}

export async function fetchSportEventsClient(discovery: DiscoveryFilter) {
  const [discovered, personal] = await Promise.all([
    getApi<ApiGameResponse>(`/games?${discoveryQuery(discovery)}`),
    fetchPersonalGames("active"),
  ]);

  const personalById = new Map(personal.map((game) => [game.id, game]));
  const merged = new Map<string, PersonalGame>();

  for (const game of discovered.data) {
    merged.set(game.id, {
      ...game,
      relationship: personalById.get(game.id)?.relationship,
      shareToken: personalById.get(game.id)?.shareToken,
    });
  }

  // Preserve private/related games which are intentionally excluded from
  // public discovery, matching the existing app behaviour.
  for (const game of personal) {
    if (!merged.has(game.id)) merged.set(game.id, game);
  }

  return [...merged.values()]
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
    .map(toSportEvent);
}

export async function fetchPastSportEventsClient() {
  const games = await fetchPersonalGames("archived");
  return games.map(toSportEvent);
}
