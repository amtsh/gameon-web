import { isAfter, isValid, parse } from "date-fns";
import type { SkillLevel, SportKind, Venue } from "@/app/types";
import type { EventCost } from "@/lib/create-event/cost";
import { eventCostToRow } from "@/lib/create-event/cost";
import type { Profile } from "@/lib/data/profile.shared";
import { postApi, patchApi, deleteApi } from "@/lib/api/v1/client";

export type CreateSportEventInput = {
  sport: SportKind;
  skillLevel: SkillLevel;
  title: string;
  startsAt: string;
  endsAt: string;
  capacity: number;
  cost?: EventCost;
  description?: string;
  venue: Venue;
  fillYourSpot: boolean;
  autoApprove: boolean;
  isPrivate: boolean;
  profile: Profile;
};

const DATETIME_LOCAL_FMT = "yyyy-MM-dd'T'HH:mm";

function toIsoFromLocalDateTime(value: string) {
  const date = parse(value, DATETIME_LOCAL_FMT, new Date());
  if (!isValid(date)) throw new Error("Invalid date");
  return date.toISOString();
}

type ApiGameResult = { data: { id: string; shareToken?: string } };

function toApiInput(input: CreateSportEventInput) {
  const startsAt = toIsoFromLocalDateTime(input.startsAt);
  const endsAt = toIsoFromLocalDateTime(input.endsAt);

  if (!isAfter(new Date(endsAt), new Date(startsAt))) {
    throw new Error("End time must be after start time");
  }

  const costRow = eventCostToRow(input.cost);
  return {
    sport: input.sport,
    skillLevel: input.skillLevel,
    title: input.title.trim(),
    description: input.description?.trim() ?? "",
    capacity: input.capacity,
    startsAt,
    endsAt,
    venue: input.venue,
    cost: costRow.cost_amount == null
      ? null
      : {
          amount: Number(costRow.cost_amount),
          currency: String(costRow.cost_currency ?? "SEK"),
          mode: costRow.cost_mode ?? "total",
        },
    autoApprove: input.autoApprove,
    isPrivate: input.isPrivate,
    hostContact: input.profile.contact_method && input.profile.contact_value
      ? { method: input.profile.contact_method, value: input.profile.contact_value.trim() }
      : null,
  };
}

export async function createSportEvent(input: CreateSportEventInput) {
  const result = await postApi<ApiGameResult>("/games", toApiInput(input));

  // The existing UI immediately refreshes through the API after save. Returning
  // the id keeps the component contract unchanged.
  return result.data.id;
}

export type UpdateSportEventInput = Omit<CreateSportEventInput, "fillYourSpot" | "profile"> & {
  eventId: string;
  profile: Profile;
};

export async function updateSportEvent(input: UpdateSportEventInput) {
  const payload = toApiInput({ ...input, fillYourSpot: false });
  await patchApi(`/games/${input.eventId}`, payload);
}

export async function cancelSportEvent(eventId: string) {
  await deleteApi(`/games/${eventId}`);
}
