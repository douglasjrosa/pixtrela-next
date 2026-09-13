import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";

import { verifyCrmApiToken } from "@/lib/api/crm-api-auth";
import { apiTemplateTaskCreateSchema } from "@/lib/schemas/api-template-task";
import {
  createTemplateTask,
  listTemplateTasks,
} from "@/lib/repos/templates";
import { toTemplateRepoSubTasks } from "@/lib/templates/to-template-repo-subtasks";

export const runtime = "nodejs";

export async function GET(request: Request): Promise<NextResponse> {
  const auth = await verifyCrmApiToken(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const url = new URL(request.url);
  const q = url.searchParams.get("q") ?? undefined;
  const page = Number(url.searchParams.get("page") ?? "1");
  const pageSize = Number(url.searchParams.get("pageSize") ?? "50");

  const result = await listTemplateTasks({
    q,
    page: Number.isFinite(page) ? page : 1,
    pageSize: Number.isFinite(pageSize) ? pageSize : 50,
  });

  return NextResponse.json(result);
}

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

  const parsed = apiTemplateTaskCreateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const created = await createTemplateTask({
    code: parsed.data.code,
    name: parsed.data.name,
    subTasks: toTemplateRepoSubTasks(parsed.data.subTask),
  });

  revalidateTag("drizzle:templates", "default");
  revalidatePath("/templates");

  return NextResponse.json(created, { status: 201 });
}
