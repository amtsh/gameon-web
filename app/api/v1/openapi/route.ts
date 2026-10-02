import { openApiDocument } from "@/lib/api/v1/openapi";
export const dynamic = "force-static";
export function GET() {
  return Response.json(openApiDocument, { headers: { "Cache-Control": "public, max-age=3600, s-maxage=3600", "Access-Control-Allow-Origin": "*" } });
}
