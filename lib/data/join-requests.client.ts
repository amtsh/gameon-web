import type { SkillLevel } from "@/app/types";
import type { Profile } from "@/lib/data/profile.shared";
import { createClient } from "@/lib/supabase/client";
import { getApi, postApi, deleteApi } from "@/lib/api/v1/client";

async function fetchSportGamesPlayedCounts(
  eventId: string,
  profileIds: string[],
  shareToken?: string,
): Promise<Map<string, number>> {
  if (profileIds.length === 0) return new Map();

  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_sport_games_played_counts", {
    p_event_id: eventId,
    p_profile_ids: profileIds,
    p_share_token: shareToken ?? null,
  });

  if (error) throw error;

  return new Map(
    (data ?? []).map((row) => [row.profile_id, row.games_played]),
  );
}

export async function fetchHostSportGamesHostedCount(
  eventId: string,
  options: { shareToken?: string } = {},
): Promise<number | null> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_host_sport_games_hosted_count", {
    p_event_id: eventId,
    p_share_token: options.shareToken ?? null,
  });

  if (error) throw error;
  return data;
}

export type HostJoinRequest = {
  id: string;
  requesterId: string;
  requesterName: string;
  requesterLevel: SkillLevel;
  status: "pending" | "waitlisted";
};

type ApiJoinRequest = {
  id: string;
  requester: { id: string; name: string };
  skillLevel: SkillLevel;
  status: "pending" | "approved" | "waitlisted";
};

function isOpenHostJoinRequest(
  request: ApiJoinRequest,
): request is ApiJoinRequest & { status: HostJoinRequest["status"] } {
  return request.status === "pending" || request.status === "waitlisted";
}

export type ApprovedPlayer = {
  id: string;
  name: string;
  firstName: string;
  level: SkillLevel | null;
  isHost: boolean;
  avatarUrl: string | null;
  gamesPlayed: number;
};

export async function fetchHostJoinRequests(
  eventId: string,
): Promise<HostJoinRequest[]> {
  const response = await getApi<{ data: ApiJoinRequest[] }>(
    `/games/${eventId}/join-requests`,
  );

  return response.data
    .filter(isOpenHostJoinRequest)
    .map((request) => ({
      id: request.id,
      requesterId: request.requester.id,
      requesterName: request.requester.name,
      requesterLevel: request.skillLevel,
      status: request.status,
    }));
}

/** Fetch all approved participants for an event. */
export async function fetchApprovedPlayers(
  eventId: string,
  hostId?: string,
  options: { shareToken?: string } = {},
): Promise<ApprovedPlayer[]> {
  const query = options.shareToken
    ? `?shareToken=${encodeURIComponent(options.shareToken)}`
    : "";
  const response = await getApi<{
    data: Array<{
      profileId: string;
      name: string | null;
      skillLevel: SkillLevel;
      isHost: boolean;
    }>;
  }>(`/games/${eventId}/participants${query}`);

  const profileIds = response.data.map((row) => row.profileId);
  const gamesPlayedByProfile = await fetchSportGamesPlayedCounts(
    eventId,
    profileIds,
    options.shareToken,
  );

  return response.data.map((row) => {
    const fullName = row.name ?? "Player";
    const firstName = fullName.split(" ")[0] ?? fullName;
    return {
      id: row.profileId,
      name: fullName,
      firstName,
      level: row.isHost ? null : row.skillLevel,
      isHost: row.isHost,
      avatarUrl: null,
      gamesPlayed: gamesPlayedByProfile.get(row.profileId) ?? 0,
    };
  });
}

export async function requestToJoin(
  eventId: string,
  profile: Profile,
  sport: string,
  sportPreferences: Map<string, SkillLevel>,
  options: { isPrivate?: boolean; shareToken?: string } = {},
) {
  if (!profile.contact_method || !profile.contact_value?.trim()) {
    throw new Error("Add contact info in your profile before joining");
  }

  const requesterLevel = sportPreferences.get(sport) ?? "beginner";

  await postApi(`/games/${eventId}/join`, {
    skillLevel: requesterLevel,
    contact: {
      method: profile.contact_method,
      value: profile.contact_value.trim(),
    },
    ...(options.isPrivate && options.shareToken
      ? { shareToken: options.shareToken }
      : {}),
  });
}

/** Withdraw a pending request or leave the waitlist. */
export async function withdrawJoinRequest(eventId: string) {
  await deleteApi(`/games/${eventId}/join`);
}

export async function fetchHostContact(
  eventId: string,
): Promise<{ method: "whatsapp" | "telegram"; value: string } | null> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_host_contact", {
    target_event_id: eventId,
  });
  if (error) throw error;
  const contact = data?.[0];
  return contact ? { method: contact.method, value: contact.value } : null;
}

export async function approveJoinRequest(requestId: string, gameId?: string) {
  if (!gameId) {
    throw new Error("Game id is required to approve a request");
  }
  await postApi(`/games/${gameId}/join-requests/${requestId}/approve`, {});
}

export async function leaveEvent(eventId: string) {
  await deleteApi(`/games/${eventId}/join`);
}
