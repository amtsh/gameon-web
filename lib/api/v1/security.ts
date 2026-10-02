import { createAdminClient } from "@/lib/supabase/admin";
import { ApiError } from "./errors";

const LIMITS = {
  discovery: { limit: 120, windowSeconds: 60 },
  detail: { limit: 240, windowSeconds: 60 },
  create: { limit: 10, windowSeconds: 60 },
  mutation: { limit: 30, windowSeconds: 60 },
  join: { limit: 20, windowSeconds: 60 },
} as const;

export async function enforceRateLimit(request: Request, scope: keyof typeof LIMITS, subject: string): Promise<Headers> {
  const config = LIMITS[scope];
  const admin = createAdminClient() as any;
  const ip = request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const bucketKey = `v1:${scope}:${subject}:${ip}`;
  const { data, error } = await admin.rpc("consume_api_rate_limit", {
    p_bucket_key: bucketKey, p_limit: config.limit, p_window_seconds: config.windowSeconds,
  });
  if (error || !data?.[0]) throw new ApiError(503, "RATE_LIMIT_UNAVAILABLE", "Rate limiting is temporarily unavailable.");

  const result = data[0];
  const reset = Math.floor(new Date(result.reset_at).getTime() / 1000);
  const headers = new Headers({
    "X-RateLimit-Limit": String(config.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(reset),
  });
  if (!result.allowed) throw new ApiError(429, "RATE_LIMITED", "Too many requests.", {
    retryAfterSeconds: Math.max(1, Math.ceil((new Date(result.reset_at).getTime() - Date.now()) / 1000)),
  });
  return headers;
}

export function mergeHeaders(...sets: Headers[]): Headers {
  const result = new Headers();
  sets.forEach(set => set.forEach((value, key) => result.set(key, value)));
  return result;
}

export async function withIdempotency<T>(request: Request, userId: string, execute: () => Promise<{ status: number; body: T }>) {
  const key = request.headers.get("idempotency-key");
  if (!key) return { ...(await execute()), replayed: false };

  if (!/^[A-Za-z0-9._~-]{8,128}$/.test(key)) {
    throw new ApiError(400, "INVALID_IDEMPOTENCY_KEY", "Idempotency-Key must be 8-128 URL-safe characters.");
  }

  const rawBody = await request.clone().text();
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(rawBody));
  const requestHash = [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, "0")).join("");
  const admin = createAdminClient() as any;

  const existing = await admin.from("api_idempotency_keys").select("request_hash,status_code,response_body")
    .eq("user_id", userId).eq("idempotency_key", key).maybeSingle();
  if (existing.error) throw new ApiError(503, "IDEMPOTENCY_UNAVAILABLE", "Idempotency storage is unavailable.");

  if (existing.data) {
    if (existing.data.request_hash !== requestHash) {
      throw new ApiError(409, "IDEMPOTENCY_CONFLICT", "The idempotency key was already used with a different request body.");
    }
    if (existing.data.status_code === null || existing.data.response_body === null) {
      throw new ApiError(409, "IDEMPOTENCY_IN_PROGRESS", "An earlier request with this idempotency key is still processing.");
    }
    return { status: existing.data.status_code, body: existing.data.response_body as T, replayed: true };
  }

  const inserted = await admin.from("api_idempotency_keys").insert({
    user_id: userId, idempotency_key: key, request_hash: requestHash,
  });
  if (inserted.error) {
    throw new ApiError(409, "IDEMPOTENCY_IN_PROGRESS", "An earlier request with this idempotency key is still processing.");
  }

  try {
    const result = await execute();
    const stored = await admin.from("api_idempotency_keys")
      .update({ status_code: result.status, response_body: result.body })
      .eq("user_id", userId).eq("idempotency_key", key);
    if (stored.error) console.error("Failed to persist idempotency response", stored.error);
    return { ...result, replayed: false };
  } catch (error) {
    await admin.from("api_idempotency_keys").delete()
      .eq("user_id", userId).eq("idempotency_key", key);
    throw error;
  }
}
