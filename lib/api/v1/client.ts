import { createClient } from "@/lib/supabase/client";

export type ApiErrorBody = {
  error?: { code?: string; message?: string; details?: unknown };
  requestId?: string;
};

export class ApiClientError extends Error {
  readonly status: number;
  readonly code: string;
  readonly requestId?: string;
  readonly details?: unknown;

  constructor(status: number, body: ApiErrorBody) {
    super(body.error?.message ?? `Request failed with status ${status}`);
    this.name = "ApiClientError";
    this.status = status;
    this.code = body.error?.code ?? "API_ERROR";
    this.requestId = body.requestId;
    this.details = body.error?.details;
  }
}

function makeIdempotencyKey() {
  return crypto.randomUUID();
}

async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  options: { idempotency?: boolean } = {},
): Promise<T> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();

  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (session?.access_token) {
    headers.set("Authorization", `Bearer ${session.access_token}`);
  }
  if (options.idempotency && !headers.has("Idempotency-Key")) {
    headers.set("Idempotency-Key", makeIdempotencyKey());
  }

  const response = await fetch(`/api/v1${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  if (response.status === 204) return undefined as T;

  const body = (await response.json().catch(() => ({}))) as T & ApiErrorBody;
  if (!response.ok) {
    throw new ApiClientError(response.status, body);
  }
  return body as T;
}

export function getApi<T>(path: string) {
  return apiFetch<T>(path);
}

export function postApi<T>(path: string, body: unknown) {
  return apiFetch<T>(path, {
    method: "POST",
    body: JSON.stringify(body),
  }, { idempotency: true });
}

export function patchApi<T>(path: string, body: unknown) {
  return apiFetch<T>(path, {
    method: "PATCH",
    body: JSON.stringify(body),
  }, { idempotency: true });
}

export function deleteApi<T = void>(path: string) {
  return apiFetch<T>(path, { method: "DELETE" });
}
