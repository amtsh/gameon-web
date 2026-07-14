import { NextRequest, NextResponse } from "next/server";
import { readCloudflareGeo } from "@/lib/location/cf-geo";
import { assertSameOrigin } from "@/lib/api/same-origin";

export async function GET(req: NextRequest) {
  const forbidden = assertSameOrigin(req);
  if (forbidden) return forbidden;

  const { coordinates, countryCode } = await readCloudflareGeo();
  if (!coordinates) {
    return new NextResponse(null, { status: 204 });
  }
  return NextResponse.json({ ...coordinates, countryCode });
}
