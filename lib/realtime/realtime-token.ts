import { createHmac } from "node:crypto";

import {
  BOARD_REALTIME_CHANNEL,
  REALTIME_TOKEN_TTL_SECONDS,
  trimEnv,
} from "@/lib/realtime/board-channel";

const JWT_HEADER = { alg: "HS256", typ: "JWT" } as const;

export type BoardRealtimeCredentials = {
  sseUrl: string;
  token: string;
};

function encodeJson(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

export function signBoardRealtimeToken(
  secret: string,
  nowSeconds: number,
): string {
  const encodedHeader = encodeJson(JWT_HEADER);
  const encodedPayload = encodeJson({
    channels: [BOARD_REALTIME_CHANNEL],
    iat: nowSeconds,
    exp: nowSeconds + REALTIME_TOKEN_TTL_SECONDS,
  });
  const unsigned = `${encodedHeader}.${encodedPayload}`;
  const signature = createHmac("sha256", secret)
    .update(unsigned)
    .digest("base64url");
  return `${unsigned}.${signature}`;
}

export function issueBoardRealtimeCredentials(
  nowSeconds = Math.floor(Date.now() / 1000),
): BoardRealtimeCredentials | null {
  const secret = trimEnv(process.env.REALTIME_JWT_SECRET);
  const sseUrl = trimEnv(process.env.NEXT_PUBLIC_REALTIME_SSE_URL).replace(
    /\/$/,
    "",
  );
  if (!secret || !sseUrl) return null;
  return {
    sseUrl,
    token: signBoardRealtimeToken(secret, nowSeconds),
  };
}
