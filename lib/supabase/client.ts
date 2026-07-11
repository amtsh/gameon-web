import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";
import { getSupabaseKey, getSupabaseUrl } from "./env";

export function createClient() {
  return createBrowserClient<Database>(getSupabaseUrl(), getSupabaseKey());
}
