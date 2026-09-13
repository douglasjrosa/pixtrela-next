import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";

import { verifyCrmApiToken } from "@/lib/api/crm-api-auth";
import { applyAutoStepTaskOrderingAfterTaskChange } from "@/lib/business/apply-step-task-order";
import { apiTaskPatchSchema } from "@/lib/schemas/api-task";
import { getTaskById, updateCrmPedidoTaskFields } from "@/lib/repos/tasks";

export const runtime = "nodejs";

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
  const task = await getTaskById(id);
  if (!task) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({
    id: task.id,
    name: task.name,
    qty: task.qty,
    deliveryDate: task.deliveryDate,
    status: task.status,
    templateTaskCode: task.templateTaskCode,
    crmItemKey: task.crmItemKey,
    crmPedidoId: task.crmPedidoId,
  });
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
  const existing = await getTaskById(id);
  if (!existing) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = apiTaskPatchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const nextName = parsed.data.name ?? existing.name;
  const nextQty = parsed.data.qty ?? existing.qty;
  const nextDelivery =
    parsed.data.deliveryDate !== undefined
      ? parsed.data.deliveryDate
      : existing.deliveryDate;

  await updateCrmPedidoTaskFields(id, {
    name: nextName,
    qty: nextQty,
    deliveryDate: nextDelivery,
  });
  const after = await getTaskById(id);
  if (after) {
    await applyAutoStepTaskOrderingAfterTaskChange({
      before: {
        stepId: existing.stepId,
        deliveryDate: existing.deliveryDate,
      },
      after: {
        stepId: after.stepId,
        deliveryDate: after.deliveryDate,
      },
    });
  }

  revalidateTag("drizzle:tasks", "default");
  revalidatePath("/board");
  revalidatePath("/tasks");

  return NextResponse.json({
    id,
    name: nextName,
    qty: nextQty,
    deliveryDate: nextDelivery,
  });
}
