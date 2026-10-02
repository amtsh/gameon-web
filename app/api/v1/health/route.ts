export const dynamic = "force-dynamic";
export function GET() {
  return Response.json({ status: "ok", service: "gameon-api", version: "1" }, { headers: { "Cache-Control": "no-store" } });
}
