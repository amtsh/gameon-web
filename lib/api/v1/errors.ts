export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: Record<string, unknown>,
  ) { super(message); }
}

export function apiErrorResponse(error: unknown, requestId: string): Response {
  if (error instanceof ApiError) {
    const headers = new Headers({ "X-Request-Id": requestId });
    if (error.status === 401) headers.set("WWW-Authenticate", 'Bearer realm="gameon"');
    if (error.status === 429 && error.details?.retryAfterSeconds) {
      headers.set("Retry-After", String(error.details.retryAfterSeconds));
    }
    return Response.json({
      error: {
        code: error.code,
        message: error.message,
        ...(error.details ? { details: error.details } : {}),
      },
      requestId,
    }, { status: error.status, headers });
  }

  console.error("Unhandled API error", { requestId, error });
  return Response.json({
    error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred." },
    requestId,
  }, { status: 500, headers: { "X-Request-Id": requestId } });
}
