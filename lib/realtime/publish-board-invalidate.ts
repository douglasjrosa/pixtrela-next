import { after } from "next/server";

import {
  BOARD_REALTIME_CHANNEL,
  REALTIME_PUBLISH_TIMEOUT_MS,
  trimEnv,
} from "@/lib/realtime/board-channel";

export async function publishBoardInvalidate(
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  const url = trimEnv(process.env.REALTIME_PUBLISH_URL);
  if (!url) return;

  const secret = trimEnv(process.env.REALTIME_PUBLISH_SECRET);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REALTIME_PUBLISH_TIMEOUT_MS);
  try {
    await fetchImpl(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ channel: BOARD_REALTIME_CHANNEL }),
      signal: controller.signal,
    });
  } catch {
    return;
  } finally {
    clearTimeout(timer);
  }
}

/** Publish after the response so a hub failure cannot fail the user action. */
export function scheduleBoardInvalidate(): void {
  try {
    after(() => {
      void publishBoardInvalidate();
    });
  } catch {
    void publishBoardInvalidate();
  }
}
