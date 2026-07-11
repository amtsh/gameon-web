import {
  buildSportEventIcs,
  sportEventIcsFilename,
} from "@/lib/calendar/ics";
import type { SportEvent } from "@/app/types";

/** Open/download an .ics file — works on iOS Safari and Android Chrome. */
export function downloadSportEventIcs(event: SportEvent, eventUrl?: string) {
  const content = buildSportEventIcs(event, eventUrl);
  const filename = sportEventIcsFilename(event);
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  window.setTimeout(() => URL.revokeObjectURL(url), 2_000);
}
