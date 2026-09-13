import { NextResponse } from "next/server";

import { processSubTaskPresetsRequest } from "@/integrations/ribermax/rbx/handle-sub-task-presets-request";

export const runtime = "nodejs";

export async function GET(request: Request): Promise<NextResponse> {
  const result = await processSubTaskPresetsRequest(request);
  return NextResponse.json(result.body, { status: result.status });
}
