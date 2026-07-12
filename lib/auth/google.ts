"use client";

import { createClient } from "@/lib/supabase/client";

export async function signInWithGoogle(returnPath?: string) {
  const supabase = createClient();
  const next =
    returnPath ??
    (typeof window !== "undefined"
      ? `${window.location.pathname}${window.location.search}`
      : "/home");
  const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo },
  });

  if (error) throw error;
}

export async function signOut() {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
