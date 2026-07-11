import type { Coordinates } from "./geo";
import { parseIpCoordinates } from "./ip-geo";

/** Session-only IP fix via our edge route (Vercel geo headers). */
export async function fetchIpCoordinates(): Promise<Coordinates | null> {
  const response = await fetch("/api/geo");
  if (response.status === 204 || !response.ok) return null;
  const data: unknown = await response.json();
  if (
    typeof data === "object" &&
    data !== null &&
    "latitude" in data &&
    "longitude" in data
  ) {
    return parseIpCoordinates(
      String((data as Coordinates).latitude),
      String((data as Coordinates).longitude),
    );
  }
  return null;
}
