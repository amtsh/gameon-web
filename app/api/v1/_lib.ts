import { createClient } from "@supabase/supabase-js";
import { getSupabaseKey, getSupabaseUrl } from "@/lib/supabase/env";
import { ApiError, apiErrorResponse } from "@/lib/api/v1/errors";
import { authenticateRequest, getBearerToken } from "@/lib/api/v1/auth";

export function requestId(request: Request) {
  return request.headers.get("x-request-id")?.slice(0, 80) || crypto.randomUUID();
}

export function json(data: unknown, status = 200, extra?: Headers) {
  const headers = new Headers({ "Content-Type": "application/json", "Cache-Control": "no-store" });
  extra?.forEach((value, key) => headers.set(key, value));
  return Response.json(data, { status, headers });
}

export function noContent(status = 204, extra?: Headers) {
  const headers = new Headers({ "Cache-Control": "no-store" });
  extra?.forEach((value, key) => headers.set(key, value));
  return new Response(null, { status, headers });
}

export async function userClient(request: Request) {
  const { user, token } = await authenticateRequest(request);
  const client = createClient(getSupabaseUrl(), getSupabaseKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  return { user, client };
}

export async function optionalClient(request: Request) {
  if (!getBearerToken(request)) {
    return { user: null, client: createClient(getSupabaseUrl(), getSupabaseKey(), { auth: { persistSession: false, autoRefreshToken: false } }) };
  }
  return userClient(request);
}

export function handleApiError(error: unknown, id: string) {
  return apiErrorResponse(error, id);
}

export function requireUuid(value: string, name: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) throw new ApiError(400, "INVALID_ID", `Invalid ${name}.`);
  return value;
}
