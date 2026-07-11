import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { readIpCoordinatesFromHeaderMap } from "@/lib/location/ip-geo";

export async function GET() {
  const coords = readIpCoordinatesFromHeaderMap(await headers());
  if (!coords) {
    return new NextResponse(null, { status: 204 });
  }
  return NextResponse.json(coords);
}
