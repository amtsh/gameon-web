import { createAdminClient } from "@/lib/supabase/admin";

/** Fire-and-forget: records a /g/[token] page load for the /monitor panel. */
export function logSharedLinkLoad(shareToken: string) {
  createAdminClient()
    .from("shared_link_loads")
    .insert({ share_token: shareToken })
    .then(({ error }) => {
      if (error) console.error("logSharedLinkLoad failed", error);
    });
}
