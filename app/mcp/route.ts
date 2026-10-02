import { NextResponse } from "next/server";

const PROTOCOL_VERSION = "2026-07-28";
const LEGACY_PROTOCOL_VERSION = "2025-11-25";
const SERVER_VERSION = "1.0.0";

type JsonRpcRequest = {
  jsonrpc?: string;
  id?: string | number | null;
  method?: string;
  params?: Record<string, any>;
};

type ToolDefinition = {
  name: string;
  title: string;
  description: string;
  inputSchema: Record<string, any>;
  annotations: {
    title: string;
    readOnlyHint: boolean;
    destructiveHint: boolean;
    idempotentHint: boolean;
    openWorldHint: boolean;
  };
  requiresAuth: boolean;
};

const uuid = {
  type: "string",
  format: "uuid",
  description: "GameOn game or request UUID.",
};

const gameIdSchema = {
  type: "object",
  required: ["id"],
  properties: { id: uuid },
  additionalProperties: false,
};

const tools: ToolDefinition[] = [
  {
    name: "discover_games",
    title: "Discover games",
    description: "Find upcoming public sports games. Filter by sport, skill, time and location.",
    inputSchema: {
      type: "object",
      properties: {
        sport: { type: "string", enum: ["badminton","cricket","football","tennis","running","pickleball","basketball","volleyball","cycling"] },
        skill: { type: "string", enum: ["any","beginner","intermediate","advanced"] },
        from: { type: "string", format: "date-time" },
        to: { type: "string", format: "date-time" },
        lat: { type: "number", minimum: -90, maximum: 90 },
        lng: { type: "number", minimum: -180, maximum: 180 },
        radiusKm: { type: "number", minimum: 0, maximum: 100 },
        limit: { type: "integer", minimum: 1, maximum: 100, default: 50 },
        cursor: { type: "string" },
      },
      additionalProperties: false,
    },
    annotations: { title: "Discover games", readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    requiresAuth: false,
  },
  {
    name: "get_game",
    title: "Get game",
    description: "Get one GameOn game by ID. Use a share token for a private game when required.",
    inputSchema: {
      type: "object",
      required: ["id"],
      properties: { id: uuid, shareToken: { type: "string" } },
      additionalProperties: false,
    },
    annotations: { title: "Get game", readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    requiresAuth: false,
  },
  {
    name: "list_my_games",
    title: "List my games",
    description: "List games hosted by, joined by, or requested by the authenticated GameOn user.",
    inputSchema: {
      type: "object",
      properties: { status: { type: "string", enum: ["active","archived","all"], default: "active" } },
      additionalProperties: false,
    },
    annotations: { title: "List my games", readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorld: false },
    requiresAuth: true,
  },
  {
    name: "create_game",
    title: "Create game",
    description: "Create a future sports game. Use fillYourSpot when the host should occupy one capacity slot.",
    inputSchema: {
      type: "object",
      required: ["sport","title","capacity","startsAt","endsAt","venue"],
      properties: {
        sport: { type: "string" }, title: { type: "string" }, description: { type: "string" },
        skillLevel: { type: "string" }, capacity: { type: "integer", minimum: 1, maximum: 500 },
        startsAt: { type: "string", format: "date-time" }, endsAt: { type: "string", format: "date-time" },
        venue: { type: "object" }, cost: { type: ["object","null"] },
        autoApprove: { type: "boolean" }, isPrivate: { type: "boolean" },
        fillYourSpot: { type: "boolean" }, hostContact: { type: ["object","null"] },
      },
      additionalProperties: false,
    },
    annotations: { title: "Create game", readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    requiresAuth: true,
  },
  {
    name: "update_game",
    title: "Update game",
    description: "Update fields on a game hosted by the authenticated user.",
    inputSchema: { type: "object", required: ["id"], properties: { id: uuid, patch: { type: "object" } }, additionalProperties: false },
    annotations: { title: "Update game", readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    requiresAuth: true,
  },
  {
    name: "cancel_game",
    title: "Cancel game",
    description: "Cancel a game hosted by the authenticated user.",
    inputSchema: gameIdSchema,
    annotations: { title: "Cancel game", readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: true },
    requiresAuth: true,
  },
  {
    name: "join_game",
    title: "Join game",
    description: "Join or request to join a game using the authenticated user's contact and skill level.",
    inputSchema: {
      type: "object",
      required: ["id","skillLevel","contact"],
      properties: { id: uuid, skillLevel: { type: "string" }, contact: { type: "object" }, shareToken: { type: "string" } },
      additionalProperties: false,
    },
    annotations: { title: "Join game", readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    requiresAuth: true,
  },
  {
    name: "leave_game",
    title: "Leave game",
    description: "Leave a game or withdraw the authenticated user's join request.",
    inputSchema: gameIdSchema,
    annotations: { title: "Leave game", readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: true },
    requiresAuth: true,
  },
  {
    name: "list_participants",
    title: "List participants",
    description: "List participants visible for a game. Use a share token for a private game when required.",
    inputSchema: {
      type: "object",
      required: ["id"],
      properties: { id: uuid, shareToken: { type: "string" } },
      additionalProperties: false,
    },
    annotations: { title: "List participants", readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    requiresAuth: false,
  },
  {
    name: "list_join_requests",
    title: "List join requests",
    description: "List pending or waitlisted requests for a game hosted by the authenticated user.",
    inputSchema: gameIdSchema,
    annotations: { title: "List join requests", readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    requiresAuth: true,
  },
  {
    name: "approve_join_request",
    title: "Approve join request",
    description: "Approve a join request for a game hosted by the authenticated user.",
    inputSchema: {
      type: "object",
      required: ["id","requestId"],
      properties: { id: uuid, requestId: uuid },
      additionalProperties: false,
    },
    annotations: { title: "Approve join request", readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    requiresAuth: true,
  },
  {
    name: "reject_join_request",
    title: "Reject join request",
    description: "Reject a join request for a game hosted by the authenticated user.",
    inputSchema: {
      type: "object",
      required: ["id","requestId"],
      properties: { id: uuid, requestId: uuid },
      additionalProperties: false,
    },
    annotations: { title: "Reject join request", readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: true },
    requiresAuth: true,
  },
];

const toolByName = new Map(tools.map((tool) => [tool.name, tool]));

function rpcResult(id: JsonRpcRequest["id"], result: unknown) {
  return NextResponse.json({ jsonrpc: "2.0", id, result }, {
    headers: { "Cache-Control": "no-store" },
  });
}

function rpcError(id: JsonRpcRequest["id"], code: number, message: string, data?: unknown) {
  return NextResponse.json({ jsonrpc: "2.0", id, error: { code, message, ...(data === undefined ? {} : { data }) } }, {
    status: 200,
    headers: { "Cache-Control": "no-store" },
  });
}

function originAllowed(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  return origin === new URL(request.url).origin;
}

function modernRequest(message: JsonRpcRequest) {
  const meta = message.params?._meta;
  return meta?.["io.modelcontextprotocol/protocolVersion"] === PROTOCOL_VERSION;
}

function validateModernHeaders(request: Request, message: JsonRpcRequest) {
  const version = request.headers.get("mcp-protocol-version");
  const methodHeader = request.headers.get("mcp-method");
  const nameHeader = request.headers.get("mcp-name");

  if (version !== PROTOCOL_VERSION) return "MCP-Protocol-Version must be 2026-07-28.";
  if (methodHeader !== message.method) return "Mcp-Method does not match the JSON-RPC method.";
  if (message.method === "tools/call" && nameHeader !== message.params?.name) {
    return "Mcp-Name does not match the requested tool.";
  }
  if (!message.params?._meta?.["io.modelcontextprotocol/clientCapabilities"]) {
    return "Modern MCP requests require clientCapabilities in _meta.";
  }
  return null;
}

async function callRest(request: Request, tool: ToolDefinition, args: Record<string, any>) {
  const base = new URL(request.url);
  base.pathname = base.pathname.replace(/\/mcp\/?$/, "");

  let pathname = "";
  let method = "GET";
  let body: unknown;
  const headers = new Headers({ Accept: "application/json" });
  const auth = request.headers.get("authorization");
  if (auth) headers.set("Authorization", auth);

  switch (tool.name) {
    case "discover_games": {
      pathname = "/api/v1/games";
      const query = new URLSearchParams();
      for (const key of ["sport","skill","from","to","lat","lng","radiusKm","limit","cursor"]) {
        if (args[key] !== undefined && args[key] !== null) query.set(key, String(args[key]));
      }
      base.search = query.toString();
      break;
    }
    case "get_game":
      pathname = `/api/v1/games/${encodeURIComponent(args.id)}`;
      if (args.shareToken) base.searchParams.set("shareToken", args.shareToken);
      break;
    case "list_my_games":
      pathname = "/api/v1/me/games";
      base.searchParams.set("status", args.status ?? "active");
      break;
    case "create_game":
      pathname = "/api/v1/games"; method = "POST"; body = args;
      break;
    case "update_game":
      pathname = `/api/v1/games/${encodeURIComponent(args.id)}`; method = "PATCH"; body = args.patch ?? {};
      break;
    case "cancel_game":
      pathname = `/api/v1/games/${encodeURIComponent(args.id)}`; method = "DELETE";
      break;
    case "join_game":
      pathname = `/api/v1/games/${encodeURIComponent(args.id)}/join`; method = "POST";
      body = { skillLevel: args.skillLevel, contact: args.contact, ...(args.shareToken ? { shareToken: args.shareToken } : {}) };
      break;
    case "leave_game":
      pathname = `/api/v1/games/${encodeURIComponent(args.id)}/join`; method = "DELETE";
      break;
    case "list_participants":
      pathname = `/api/v1/games/${encodeURIComponent(args.id)}/participants`;
      if (args.shareToken) base.searchParams.set("shareToken", args.shareToken);
      break;
    case "list_join_requests":
      pathname = `/api/v1/games/${encodeURIComponent(args.id)}/join-requests`;
      break;
    case "approve_join_request":
      pathname = `/api/v1/games/${encodeURIComponent(args.id)}/join-requests/${encodeURIComponent(args.requestId)}/approve`;
      method = "POST"; body = {};
      break;
    case "reject_join_request":
      pathname = `/api/v1/games/${encodeURIComponent(args.id)}/join-requests/${encodeURIComponent(args.requestId)}/reject`;
      method = "POST"; body = {};
      break;
    default:
      throw new Error("Unknown tool");
  }

  if (["POST","PATCH"].includes(method)) {
    headers.set("Content-Type", "application/json");
    headers.set("Idempotency-Key", crypto.randomUUID());
  }

  const response = await fetch(new URL(pathname + base.search, base.origin), {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });

  const text = response.status === 204 ? "" : await response.text();
  return { response, text };
}

export async function POST(request: Request) {
  if (!originAllowed(request)) {
    return new Response("Forbidden", { status: 403 });
  }

  let message: JsonRpcRequest;
  try {
    message = await request.json();
  } catch {
    return rpcError(null, -32700, "Parse error");
  }

  if (message.jsonrpc !== "2.0" || typeof message.method !== "string") {
    return rpcError(message.id ?? null, -32600, "Invalid Request");
  }

  const modern = modernRequest(message);
  if (modern) {
    const headerError = validateModernHeaders(request, message);
    if (headerError) return rpcError(message.id ?? null, -32600, headerError);
  } else if (request.headers.get("mcp-protocol-version") === PROTOCOL_VERSION) {
    return rpcError(message.id ?? null, -32600, "Modern MCP metadata is missing or invalid.");
  }

  if (message.method === "server/discover") {
    return rpcResult(message.id ?? null, {
      resultType: "complete",
      supportedVersions: [PROTOCOL_VERSION, LEGACY_PROTOCOL_VERSION],
      capabilities: { tools: { listChanged: false } },
      _meta: { "io.modelcontextprotocol/serverInfo": { name: "gameon", version: SERVER_VERSION } },
      instructions: "Use discover_games for public games. Use list_my_games for the authenticated user's games. Confirm consequential mutations with the user when appropriate.",
      ttlMs: 3600000,
      cacheScope: "public",
    });
  }

  if (message.method === "initialize") {
    return rpcResult(message.id ?? null, {
      protocolVersion: LEGACY_PROTOCOL_VERSION,
      capabilities: { tools: { listChanged: false } },
      serverInfo: { name: "gameon", version: SERVER_VERSION },
      instructions: "GameOn exposes tools for discovering and managing local sports games.",
    });
  }

  if (message.method === "notifications/initialized" || message.method === "notifications/cancelled") {
    return new Response(null, { status: 202 });
  }

  if (message.method === "tools/list") {
    return rpcResult(message.id ?? null, {
      resultType: "complete",
      tools: tools.map(({ requiresAuth: _requiresAuth, ...tool }) => tool),
      ttlMs: 300000,
      cacheScope: "public",
    });
  }

  if (message.method !== "tools/call") {
    return rpcError(message.id ?? null, -32601, "Method not found");
  }

  const name = message.params?.name;
  const tool = toolByName.get(name);
  if (!tool) return rpcError(message.id ?? null, -32602, "Unknown tool");

  const args = message.params?.arguments;
  if (!args || typeof args !== "object" || Array.isArray(args)) {
    return rpcError(message.id ?? null, -32602, "Tool arguments must be an object");
  }

  if (tool.requiresAuth && !request.headers.get("authorization")) {
    return new Response(JSON.stringify({ error: "invalid_token", error_description: "Authorization required" }), {
      status: 401,
      headers: {
        "Content-Type": "application/json",
        "WWW-Authenticate": 'Bearer realm="gameon"',
        "Cache-Control": "no-store",
      },
    });
  }

  try {
    const { response, text } = await callRest(request, tool, args);
    if (response.status === 401) {
      return new Response(JSON.stringify({ error: "invalid_token", error_description: "The access token is invalid or expired." }), {
        status: 401,
        headers: {
          "Content-Type": "application/json",
          "WWW-Authenticate": 'Bearer realm="gameon"',
          "Cache-Control": "no-store",
        },
      });
    }

    let parsed: unknown = text;
    try { parsed = text ? JSON.parse(text) : null; } catch { /* keep text */ }

    return rpcResult(message.id ?? null, {
      resultType: "complete",
      content: [{ type: "text", text: typeof parsed === "string" ? parsed : JSON.stringify(parsed) }],
      structuredContent: typeof parsed === "object" && parsed !== null ? parsed : undefined,
      isError: !response.ok,
    });
  } catch {
    return rpcResult(message.id ?? null, {
      resultType: "complete",
      content: [{ type: "text", text: "The GameOn backend could not be reached." }],
      isError: true,
    });
  }
}

export async function GET() {
  return new Response("Method Not Allowed", { status: 405, headers: { Allow: "POST" } });
}

export async function DELETE() {
  return new Response("Method Not Allowed", { status: 405, headers: { Allow: "POST" } });
}
