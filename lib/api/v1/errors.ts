export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: Record<string, unknown>,
  ) { super(message); }
}

const ACTIONS: Record<string, string> = {
  AUTH_REQUIRED: "Sign in and send the resulting bearer access token in the Authorization header.",
  INVALID_TOKEN: "Refresh your access token and retry the request.",
  VALIDATION_ERROR: "Fix the fields listed in details.issues and send the request again.",
  INVALID_CURSOR: "Discard the cursor and retry from the first page.",
  INVALID_ID: "Check the resource ID format and retry with a valid ID.",
  INVALID_IDEMPOTENCY_KEY: "Use a unique Idempotency-Key containing 8-128 URL-safe characters.",
  IDEMPOTENCY_CONFLICT: "Reuse the key only for the original request body, or generate a new key for this request.",
  IDEMPOTENCY_IN_PROGRESS: "Wait for the original request to finish, then retry with the same Idempotency-Key.",
  RATE_LIMITED: "Wait for the Retry-After interval, then retry.",
  RATE_LIMIT_UNAVAILABLE: "Retry shortly. If this persists, contact support with the requestId.",
  IDEMPOTENCY_UNAVAILABLE: "Retry shortly. If this persists, contact support with the requestId.",
  GAME_NOT_FOUND: "Check the game ID or share token and retry.",
  JOIN_REQUEST_NOT_FOUND: "Check the join request ID and game ID, then retry.",
  PRIVATE_GAME_ACCESS_DENIED: "Use a valid share token for this private game.",
  GAME_FULL: "Choose another game or retry after a spot becomes available.",
  GAME_CANCELLED: "Choose another game; this game has been cancelled.",
  GAME_ENDED: "Choose another game; this game has already ended.",
  HOST_CANNOT_JOIN: "Use a different account or manage the game as its host.",
  FORBIDDEN: "Use an account with permission to perform this action.",
  LEAVE_FAILED: "Retry the leave request. If it still fails, contact support with the requestId.",
  APPROVAL_FAILED: "Check that the request is still pending and that the game has an available spot, then retry.",
  REJECTION_FAILED: "Check that the request still exists and retry.",
  JOIN_NOT_ALLOWED: "Check the game state and request fields, then retry.",
  INVALID_GAME: "Review the game fields and retry with values accepted by the API.",
  DATABASE_ERROR: "Retry the request. If it continues to fail, contact support with the requestId.",
};

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
        ...(error.details || ACTIONS[error.code]
          ? { details: { ...(error.details ?? {}), ...(ACTIONS[error.code] ? { action: ACTIONS[error.code] } : {}) } }
          : {}),
      },
      requestId,
    }, { status: error.status, headers });
  }

  console.error("Unhandled API error", { requestId, error });
  return Response.json({
    error: {
      code: "INTERNAL_ERROR",
      message: "The server could not complete the request.",
      details: { action: "Retry the request. If it continues to fail, contact support with the requestId." },
    },
    requestId,
  }, { status: 500, headers: { "X-Request-Id": requestId } });
}
