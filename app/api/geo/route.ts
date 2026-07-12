import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { readIpCoordinatesFromHeaderMap } from "@/lib/location/ip-geo";
import { assertSameOrigin } from "@/lib/api/same-origin";

export async function GET(req: NextRequest) {
  const forbidden = assertSameOrigin(req);
  if (forbidden) return forbidden;

  const coords = readIpCoordinatesFromHeaderMap(await headers());
  if (!coords) {
    return new NextResponse(null, { status: 204 });
  }
  return NextResponse.json(coords);
}
