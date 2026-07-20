import { NextResponse } from "next/server";

import { isAllowedStrapiMediaUrl } from "@/lib/kiosk/face/is-allowed-strapi-media-url";

const STRAPI_URL = (process.env.STRAPI_URL ?? "http://127.0.0.1:1337").replace(
  /\/$/,
  "",
);

/**
 * Same-origin proxy for Strapi uploads so face-api can read pixels without CORS.
 */
export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const target = searchParams.get("url");
  if (!target || !isAllowedStrapiMediaUrl(target, STRAPI_URL)) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const upstream = await fetch(target, { cache: "no-store" });
  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: "upstream" }, { status: 502 });
  }

  const contentType = upstream.headers.get("content-type") ?? "image/jpeg";
  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "private, max-age=300",
    },
  });
}
