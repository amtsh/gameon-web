import { createClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";
import { getSupabaseKey, getSupabaseUrl } from "@/lib/supabase/env";
import { ApiError } from "./errors";

export function getBearerToken(request: Request): string | null {
  const value = request.headers.get("authorization");
  if (!value) return null;
  const match = value.match(/^Bearer\\s+(.+)$/i);
  return match?.[1] ?? null;
}

export async function authenticateRequest(request: Request): Promise<{ user: User; token: string }> {
  const token = getBearerToken(request);
  if (!token) throw new ApiError(401, "AUTH_REQUIRED", "A bearer access token is required.");

  const supabase = createClient(getSupabaseUrl(), getSupabaseKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new ApiError(401, "INVALID_TOKEN", "The access token is invalid or expired.");
  return { user: data.user, token };
}
