import { after } from "next/server";
import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";

import { verifyCrmApiToken } from "@/lib/api/crm-api-auth";
import { upsertTaskFromApi } from "@/lib/business/upsert-task-from-api";
import { apiTaskUpsertSchema } from "@/lib/schemas/api-task";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request): Promise<NextResponse> {
  const auth = await verifyCrmApiToken(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = apiTaskUpsertSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const result = await upsertTaskFromApi(parsed.data);
    after(() => {
      revalidateTag("drizzle:tasks", "default");
      revalidateTag("drizzle:steps", "default");
      revalidatePath("/board");
      revalidatePath("/tasks");
    });
    return NextResponse.json(result, {
      status: result.action === "created" ? 201 : 200,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown_error";
    if (
      message === "no_default_step" ||
      message === "template_payload_required" ||
      message === "template_code_required"
    ) {
      return NextResponse.json({ error: message }, { status: 422 });
    }
    if (message.startsWith("presetNotFound:")) {
      return NextResponse.json({ error: message }, { status: 422 });
    }
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
