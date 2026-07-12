export type SportKind =
  | "badminton"
  | "football"
  | "cricket"
  | "tennis"
  | "running"
  | "pickleball"
  | "basketball"
  | "volleyball"
  | "cycling";

export type SkillLevel = "any" | "beginner" | "intermediate" | "advanced";

export type ContactInfo = {
  method: "whatsapp" | "telegram";
  value: string;
};

export type Venue = {
  name: string;
  address?: string;
  city?: string;
  latitude: number;
  longitude: number;
};

export type SportEvent = {
  id: string;
  title: string;
  sport: SportKind;
  skillLevel: SkillLevel;
  startsAt: string;
  endsAt: string;
  venue: Venue;
  capacity: number;
  joinedCount: number;
  cost?: string;
  description?: string;
  isCreatedByCurrentUser?: boolean;
  isJoined?: boolean;
  hasPendingRequest?: boolean;
  isOnWaitlist?: boolean;
  pendingRequestCount?: number;
  hostId?: string;
  hostName?: string;
  hostContact?: ContactInfo;
  autoApprove?: boolean;
  isPrivate?: boolean;
  /** Human-readable share slug, e.g. brave-ladybug-90. */
  shareToken: string;
  /** Set when the host cancels the game before it ends. */
  isCancelled?: boolean;
  /** Distance from the viewer's discovery center, in km. */
  distanceKm?: number;
};

export type SheetName = "create" | "profile" | "contact" | "detail" | null;
