import { NextResponse } from "next/server";

import { closeOpenCartsForCycle } from "@/lib/repos/exchange-close";
import { ensureBatchesReady } from "@/lib/repos/exchange-batches";

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

export async function GET(request: Request): Promise<NextResponse> {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const closeResult = await closeOpenCartsForCycle(now);
  await ensureBatchesReady(now);

  return NextResponse.json({
    ok: true,
    ...closeResult,
    at: now.toISOString(),
  });
}
