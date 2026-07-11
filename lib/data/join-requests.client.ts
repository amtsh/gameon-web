import type { SkillLevel } from "@/app/types";
import type { Profile } from "@/lib/data/profile.shared";
import { createClient } from "@/lib/supabase/client";

export type HostJoinRequest = {
  id: string;
  requesterId: string;
  requesterName: string;
  requesterLevel: SkillLevel;
  status: "pending" | "waitlisted";
};

export type ApprovedPlayer = {
  id: string;
  name: string;
  firstName: string;
  level: SkillLevel;
  avatarUrl: string | null;
};

export async function fetchHostJoinRequests(
  eventId: string,
): Promise<HostJoinRequest[]> {
  const supabase = createClient();
  const { data: requests, error } = await supabase
    .from("event_join_requests")
    .select("id, requester_id, requester_level, status")
    .eq("event_id", eventId)
    .in("status", ["pending", "waitlisted"])
    .order("created_at", { ascending: true });

  if (error) throw error;
  if (!requests?.length) return [];

  const requesterIds = [...new Set(requests.map((row) => row.requester_id))];
  const { data: profiles, error: profileError } = await supabase
    .from("public_profiles")
    .select("id, name")
    .in("id", requesterIds);

  if (profileError) throw profileError;

  const names = new Map((profiles ?? []).map((row) => [row.id, row.name]));

  return requests.map((row) => ({
    id: row.id,
    requesterId: row.requester_id,
    requesterName: names.get(row.requester_id) ?? "Player",
    requesterLevel: row.requester_level,
    status: row.status as "pending" | "waitlisted",
  }));
}

/** Fetch all approved participants for an event. Visible to everyone. */
export async function fetchApprovedPlayers(
  eventId: string,
): Promise<ApprovedPlayer[]> {
  const supabase = createClient();

  // event_participants holds the approved/joined rows.
  const { data: participants, error } = await supabase
    .from("event_participants")
    .select("profile_id")
    .eq("event_id", eventId)
    .order("joined_at", { ascending: true });

  if (error) throw error;
  if (!participants?.length) return [];

  const profileIds = participants.map((p) => p.profile_id);

  const [
    { data: profiles, error: profileError },
    { data: requests, error: requestError },
  ] = await Promise.all([
    supabase
      .from("public_profiles")
      .select("id, name")
      .in("id", profileIds),
    supabase
      .from("event_join_requests")
      .select("requester_id, requester_level")
      .eq("event_id", eventId)
      .eq("status", "approved")
      .in("requester_id", profileIds),
  ]);

  if (profileError) throw profileError;
  if (requestError) throw requestError;

  const levelByProfile = new Map(
    (requests ?? []).map((row) => [row.requester_id, row.requester_level]),
  );

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  return participants.map((row) => {
    const profile = profileMap.get(row.profile_id);
    const fullName = profile?.name ?? "Player";
    const firstName = fullName.split(" ")[0] ?? fullName;
    return {
      id: row.profile_id,
      name: fullName,
      firstName,
      level: (levelByProfile.get(row.profile_id) ?? "beginner") as SkillLevel,
      avatarUrl: null,
    };
  });
}

export async function requestToJoin(
  eventId: string,
  profile: Profile,
  sport: string,
  sportPreferences: Map<string, SkillLevel>,
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Sign in to join");
  if (!profile.contact_method || !profile.contact_value?.trim()) {
    throw new Error("Add contact info in your profile before joining");
  }

  const requesterLevel = sportPreferences.get(sport) ?? "beginner";

  const { error } = await supabase.from("event_join_requests").upsert(
    {
      event_id: eventId,
      requester_id: user.id,
      requester_level: requesterLevel,
      contact_method: profile.contact_method,
      contact_value: profile.contact_value.trim(),
      status: "pending",
    },
    { onConflict: "event_id,requester_id" },
  );

  if (error) throw error;
}

/** Withdraw a pending request or leave the waitlist — same row either way. */
export async function withdrawJoinRequest(eventId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sign in required");

  const { error } = await supabase
    .from("event_join_requests")
    .delete()
    .eq("event_id", eventId)
    .eq("requester_id", user.id)
    .in("status", ["pending", "waitlisted"]);

  if (error) throw error;
}

/** Host contact for an event, released by the DB only to the host,
    approved participants, or approved requesters. */
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

export async function approveJoinRequest(requestId: string) {
  const supabase = createClient();
  const { error } = await supabase.rpc("approve_join_request", {
    request_id: requestId,
  });
  if (error) throw error;
}

export async function leaveEvent(eventId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sign in required");

  const { error } = await supabase
    .from("event_participants")
    .delete()
    .eq("event_id", eventId)
    .eq("profile_id", user.id);

  if (error) throw error;
}
