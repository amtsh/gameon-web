import { createClient } from "@supabase/supabase-js";
import { getSupabaseKey, getSupabaseUrl } from "@/lib/supabase/env";
import type { Database } from "@/lib/supabase/database.types";

export function publicClient() {
  return createClient<Database>(getSupabaseUrl(), getSupabaseKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
