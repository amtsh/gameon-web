import type { ContactMethod, CostMode, SkillLevel, SportKind } from "@/lib/supabase/database.types";
export type { ContactMethod, CostMode, SkillLevel, SportKind };

export type ApiGame = {
  id: string; sport: SportKind; title: string; description: string;
  skillLevel: SkillLevel; startsAt: string; endsAt: string;
  capacity: number; joinedCount: number; spotsLeft: number;
  venue: { name: string; address: string | null; city: string | null; country: string | null; latitude: number; longitude: number; distanceMeters?: number };
  cost: { amount: number; currency: string; mode: CostMode } | null;
  host: { id: string; name: string };
  autoApprove: boolean; isPrivate: boolean; cancelledAt: string | null; createdAt: string;
};

export type ApiParticipant = { profileId: string; name: string; skillLevel: SkillLevel; isHost: boolean };
export type ApiJoinRequest = {
  id: string; gameId: string; requester: { id: string; name: string };
  skillLevel: SkillLevel; status: "pending" | "approved" | "waitlisted";
  createdAt: string; approvedAt: string | null;
};

export type CreateGameInput = {
  sport: SportKind; title: string; description?: string; skillLevel?: SkillLevel;
  capacity: number; startsAt: string; endsAt: string;
  venue: { name: string; address?: string | null; city?: string | null; country?: string | null; latitude: number; longitude: number };
  cost?: { amount: number; currency: string; mode: CostMode } | null;
  autoApprove?: boolean; isPrivate?: boolean;
  hostContact?: { method: ContactMethod; value: string } | null;
};
