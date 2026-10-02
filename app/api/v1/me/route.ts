import { enforceRateLimit } from "@/lib/api/v1/security";
import { handleApiError, json, requestId, userClient } from "@/app/api/v1/_lib";

export async function GET(request: Request) {
  const id = requestId(request);
  try {
    const { user, client } = await userClient(request);
    const rate = await enforceRateLimit(request, "detail", user.id);
    const { data: profile } = await client
      .from("profiles")
      .select("id,name,contact_method,is_onboarding_complete")
      .eq("id", user.id)
      .maybeSingle();

    return json({
      data: {
        id: user.id,
        email: user.email ?? null,
        name: profile?.name ?? null,
        contactMethod: profile?.contact_method ?? null,
        onboardingComplete: profile?.is_onboarding_complete ?? false,
      },
    }, 200, rate);
  } catch (error) {
    return handleApiError(error, id);
  }
}
