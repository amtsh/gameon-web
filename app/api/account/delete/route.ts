import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function DELETE() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  // Delete the profile row — cascades to sport_preferences,
  // event_join_requests, event_participants, and hosted sport_events.
  const { error: profileError } = await supabase
    .from("profiles")
    .delete()
    .eq("id", user.id);

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  // Delete the auth.users row via the service-role admin client.
  const admin = createAdminClient();
  const { error: adminError } = await admin.auth.admin.deleteUser(user.id);

  if (adminError) {
    return NextResponse.json({ error: adminError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
