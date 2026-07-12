/**
 * Backfill share_token for sport_events rows created before the migration.
 *
 * Usage:
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/backfill-share-tokens.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { hri } from "human-readable-ids";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error(
    "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running.",
  );
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey);

async function main() {
  const { data: rows, error } = await supabase
    .from("sport_events")
    .select("id")
    .is("share_token", null);

  if (error) throw error;
  if (!rows?.length) {
    console.log("No events need backfill.");
    return;
  }

  let updated = 0;
  for (const row of rows) {
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const share_token = hri.random();
      const { error: updateError } = await supabase
        .from("sport_events")
        .update({ share_token })
        .eq("id", row.id)
        .is("share_token", null);

      if (!updateError) {
        updated += 1;
        break;
      }

      if (updateError.code !== "23505") {
        throw updateError;
      }
    }
  }

  console.log(`Backfilled ${updated} event(s).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
