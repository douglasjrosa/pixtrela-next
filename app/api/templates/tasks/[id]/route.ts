import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";

import { verifyCrmApiToken } from "@/lib/api/crm-api-auth";
import { apiTemplateTaskPatchSchema } from "@/lib/schemas/api-template-task";
import {
  deleteTemplateTask,
  findTemplateById,
  listTemplateSubTasks,
  updateTemplateTask,
} from "@/lib/repos/templates";
import { toTemplateRepoSubTasks } from "@/lib/templates/to-template-repo-subtasks";

export const runtime = "nodejs";

const API_ARCHIVE_REASON = "Deleted via CRM templates API";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(
  request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const auth = await verifyCrmApiToken(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;
  const template = await findTemplateById(id);
  if (!template) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const subTasks = await listTemplateSubTasks(template.id);
  return NextResponse.json({ template, subTasks });
}

export async function PATCH(
  request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const auth = await verifyCrmApiToken(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;
  const existing = await findTemplateById(id);
  if (!existing) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = apiTemplateTaskPatchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const updated = await updateTemplateTask({
    id,
    name: parsed.data.name ?? existing.name,
    code: parsed.data.code ?? existing.code,
    subTasks: toTemplateRepoSubTasks(parsed.data.subTask),
  });

  revalidateTag("drizzle:templates", "default");
  revalidatePath("/templates");

  return NextResponse.json(updated);
}

export async function DELETE(
  request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const auth = await verifyCrmApiToken(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;
  const existing = await findTemplateById(id);
  if (!existing) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  await deleteTemplateTask(id, API_ARCHIVE_REASON);

  revalidateTag("drizzle:templates", "default");
  revalidatePath("/templates");

  return NextResponse.json({ ok: true });
}
