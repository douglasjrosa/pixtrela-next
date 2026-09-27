import { NextResponse } from "next/server";

import { getAppSession } from "@/lib/auth/app-session";
import { isAuthenticatedSession } from "@/lib/auth/session";
import { issueBoardRealtimeCredentials } from "@/lib/realtime/realtime-token";

export async function GET(): Promise<NextResponse> {
  const session = await getAppSession();
  if (!isAuthenticatedSession(session)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const credentials = issueBoardRealtimeCredentials();
  if (!credentials) {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }

  return NextResponse.json({
    sseUrl: credentials.sseUrl,
    token: credentials.token,
  });
}
