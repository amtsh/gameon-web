export const openApiDocument = {
  openapi: "3.1.0",
  info: {
    title: "GameOn API",
    version: "1.0.0",
    description: "Agent-friendly REST API for discovering, creating, managing, and joining local sports games.",
  },
  servers: [{ url: "https://gameonsite.com" }],
  security: [{ bearerAuth: [] }],
  paths: {
    "/api/v1/games": {
      get: {
        operationId: "discoverGames",
        summary: "Discover public games",
        security: [{}],
        parameters: [
          { name: "sport", in: "query", schema: { $ref: "#/components/schemas/SportKind" } },
          { name: "skill", in: "query", schema: { $ref: "#/components/schemas/SkillLevel" } },
          { name: "from", in: "query", schema: { type: "string", format: "date-time" } },
          { name: "to", in: "query", schema: { type: "string", format: "date-time" } },
          { name: "lat", in: "query", schema: { type: "number", minimum: -90, maximum: 90 } },
          { name: "lng", in: "query", schema: { type: "number", minimum: -180, maximum: 180 } },
          { name: "radiusKm", in: "query", schema: { type: "number", minimum: 0, maximum: 100 } },
          { name: "cursor", in: "query", schema: { type: "string" } },
          { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 100, default: 50 } },
        ],
        responses: {
          "200": { description: "Paginated games", content: { "application/json": { schema: { $ref: "#/components/schemas/GamePage" } } } },
          "429": { $ref: "#/components/responses/RateLimited" },
        },
      },
      post: {
        operationId: "createGame",
        summary: "Create a game",
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/CreateGame" } } } },
        responses: { "201": { description: "Created game" }, "401": { $ref: "#/components/responses/Unauthorized" }, "422": { $ref: "#/components/responses/ValidationError" } },
      },
    },
    "/api/v1/me/games": {
      get: {
        operationId: "listMyGames",
        summary: "List games related to the authenticated user",
        parameters: [{ name: "status", in: "query", schema: { type: "string", enum: ["active", "archived", "all"], default: "active" } }],
        responses: { "200": { description: "User games", content: { "application/json": { schema: { $ref: "#/components/schemas/GameList" } } } } },
      },
    },
    "/api/v1/games/{id}": {
      get: {
        operationId: "getGame",
        summary: "Get a game",
        security: [{}],
        parameters: [{ $ref: "#/components/parameters/GameId" }, { $ref: "#/components/parameters/ShareToken" }],
        responses: { "200": { description: "Game", content: { "application/json": { schema: { $ref: "#/components/schemas/GameResponse" } } } }, "404": { $ref: "#/components/responses/NotFound" } },
      },
      patch: {
        operationId: "updateGame",
        summary: "Update a hosted game",
        parameters: [{ $ref: "#/components/parameters/GameId" }, { $ref: "#/components/parameters/IdempotencyKey" }],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/UpdateGame" } } } },
        responses: { "200": { description: "Updated game" } },
      },
      delete: {
        operationId: "cancelGame",
        summary: "Cancel a hosted game",
        parameters: [{ $ref: "#/components/parameters/GameId" }],
        responses: { "204": { description: "Cancelled" } },
      },
    },
    "/api/v1/games/{id}/join": {
      post: {
        operationId: "joinGame",
        summary: "Join or request to join a game",
        parameters: [{ $ref: "#/components/parameters/GameId" }, { $ref: "#/components/parameters/IdempotencyKey" }],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/JoinGame" } } } },
        responses: { "200": { description: "Joined" }, "201": { description: "Join request created" } },
      },
      delete: {
        operationId: "leaveGame",
        summary: "Leave a game",
        parameters: [{ $ref: "#/components/parameters/GameId" }],
        responses: { "204": { description: "Left" } },
      },
    },
    "/api/v1/games/{id}/participants": {
      get: {
        operationId: "listParticipants",
        summary: "List visible participants",
        security: [{}],
        parameters: [{ $ref: "#/components/parameters/GameId" }, { $ref: "#/components/parameters/ShareToken" }],
        responses: { "200": { description: "Participants" } },
      },
    },
    "/api/v1/games/{id}/join-requests": {
      get: {
        operationId: "listJoinRequests",
        summary: "List host join requests",
        parameters: [{ $ref: "#/components/parameters/GameId" }],
        responses: { "200": { description: "Join requests" } },
      },
    },
    "/api/v1/games/{id}/join-requests/{requestId}/approve": {
      post: {
        operationId: "approveJoinRequest",
        summary: "Approve a join request",
        parameters: [{ $ref: "#/components/parameters/GameId" }, { $ref: "#/components/parameters/RequestId" }, { $ref: "#/components/parameters/IdempotencyKey" }],
        responses: { "204": { description: "Approved" } },
      },
    },
    "/api/v1/games/{id}/join-requests/{requestId}/reject": {
      post: {
        operationId: "rejectJoinRequest",
        summary: "Reject a join request",
        parameters: [{ $ref: "#/components/parameters/GameId" }, { $ref: "#/components/parameters/RequestId" }, { $ref: "#/components/parameters/IdempotencyKey" }],
        responses: { "204": { description: "Rejected" } },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
    parameters: {
      GameId: { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
      RequestId: { name: "requestId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
      ShareToken: { name: "shareToken", in: "query", schema: { type: "string" } },
      IdempotencyKey: { name: "Idempotency-Key", in: "header", required: false, schema: { type: "string", minLength: 8, maxLength: 128 } },
    },
    schemas: {
      SportKind: { type: "string", enum: ["badminton","cricket","football","tennis","running","pickleball","basketball","volleyball","cycling"] },
      SkillLevel: { type: "string", enum: ["any","beginner","intermediate","advanced"] },
      Cost: {
        anyOf: [
          { type: "null" },
          { type: "object", required: ["amount","currency","mode"], properties: {
            amount: { type: "number", minimum: 0 }, currency: { type: "string", pattern: "^[A-Za-z]{3}$" },
            mode: { type: "string", enum: ["total","per_person"] },
          } },
        ],
      },
      Venue: {
        type: "object", required: ["name","latitude","longitude"],
        properties: {
          name: { type: "string", maxLength: 160 }, address: { type: ["string","null"], maxLength: 200 },
          city: { type: ["string","null"], maxLength: 80 }, country: { type: ["string","null"], maxLength: 80 },
          latitude: { type: "number", minimum: -90, maximum: 90 }, longitude: { type: "number", minimum: -180, maximum: 180 },
        },
      },
      Contact: {
        type: "object", required: ["method","value"],
        properties: { method: { type: "string", enum: ["whatsapp","telegram"] }, value: { type: "string", minLength: 1, maxLength: 120 } },
      },
      CreateGame: {
        type: "object", required: ["sport","title","capacity","startsAt","endsAt","venue"],
        properties: {
          sport: { $ref: "#/components/schemas/SportKind" }, title: { type: "string", maxLength: 120 },
          description: { type: "string", maxLength: 2000 }, skillLevel: { $ref: "#/components/schemas/SkillLevel" },
          capacity: { type: "integer", minimum: 1, maximum: 500 },
          startsAt: { type: "string", format: "date-time" }, endsAt: { type: "string", format: "date-time" },
          venue: { $ref: "#/components/schemas/Venue" }, cost: { $ref: "#/components/schemas/Cost" },
          autoApprove: { type: "boolean" }, isPrivate: { type: "boolean" }, hostContact: { anyOf: [{ $ref: "#/components/schemas/Contact" }, { type: "null" }] },
        },
      },
      UpdateGame: { allOf: [{ $ref: "#/components/schemas/CreateGame" }], description: "Partial update; at least one field is required." },
      JoinGame: {
        type: "object", required: ["skillLevel","contact"],
        properties: {
          skillLevel: { $ref: "#/components/schemas/SkillLevel" },
          contact: { $ref: "#/components/schemas/Contact" },
          shareToken: { type: "string", maxLength: 200 },
        },
      },
      Game: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" }, sport: { $ref: "#/components/schemas/SportKind" }, title: { type: "string" },
          description: { type: "string" }, skillLevel: { $ref: "#/components/schemas/SkillLevel" },
          startsAt: { type: "string", format: "date-time" }, endsAt: { type: "string", format: "date-time" },
          capacity: { type: "integer" }, joinedCount: { type: "integer" }, spotsLeft: { type: "integer" },
          venue: { $ref: "#/components/schemas/Venue" }, cost: { $ref: "#/components/schemas/Cost" },
          host: { type: "object", properties: { id: { type: "string", format: "uuid" }, name: { type: "string" } } },
          autoApprove: { type: "boolean" }, isPrivate: { type: "boolean" }, cancelledAt: { type: ["string","null"], format: "date-time" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      GameResponse: { type: "object", required: ["data"], properties: { data: { $ref: "#/components/schemas/Game" } } },
      GameList: { type: "object", required: ["data"], properties: { data: { type: "array", items: { $ref: "#/components/schemas/Game" } } } },
      GamePage: {
        type: "object", required: ["data","pagination"],
        properties: {
          data: { type: "array", items: { $ref: "#/components/schemas/Game" } },
          pagination: { type: "object", properties: { hasMore: { type: "boolean" }, nextCursor: { type: ["string","null"] } } },
        },
      },
      Error: {
        type: "object",
        properties: {
          error: { type: "object", properties: { code: { type: "string" }, message: { type: "string" }, details: { type: "object" } } },
          requestId: { type: "string" },
        },
      },
    },
    responses: {
      Unauthorized: { description: "Authentication required", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
      ValidationError: { description: "Validation failed", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
      NotFound: { description: "Not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
      RateLimited: { description: "Rate limited", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
    },
  },
} as const;
