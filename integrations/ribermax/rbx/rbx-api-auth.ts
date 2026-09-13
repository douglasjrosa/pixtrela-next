import { getRibermaxConnection } from "@/integrations/ribermax/settings/connection-repo";

export const RBX_API_TOKEN_HEADER = "Token";

export type RbxApiAuthResult =
  | { ok: true }
  | { ok: false; status: 401 | 500; error: "unauthorized" | "misconfigured" };

/**
 * Validates inbound RBX API calls using the shared Ribermax connection token.
 */
export async function verifyRbxApiToken(
  request: Request,
): Promise<RbxApiAuthResult> {
  const connection = await getRibermaxConnection();
  if (!connection?.token?.trim()) {
    return { ok: false, status: 500, error: "misconfigured" };
  }

  const token = request.headers.get(RBX_API_TOKEN_HEADER)?.trim() ?? "";
  if (!token || token !== connection.token) {
    return { ok: false, status: 401, error: "unauthorized" };
  }

  return { ok: true };
}
