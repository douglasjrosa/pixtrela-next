import { buildTemplateFromBox } from "@/lib/business/template-from-box";
import { fetchBoxTemplateData } from "@/lib/legacy/rbx-client";
import { strapiServiceFetch } from "@/lib/strapi/service-fetch";
import type { TemplateTaskFormInput } from "@/lib/schemas/template-task";

interface StrapiList<T> {
  data: T[];
}

interface TemplateEntity {
  documentId: string;
}

function toStrapiTemplatePayload(input: TemplateTaskFormInput) {
  return {
    name: input.name,
    code: input.code,
    subTask: (input.subTask ?? []).map((row, index) => ({
      name: row.name,
      qty: row.qty,
      sharingType: row.sharingType,
      maxSameTimeWorkers: row.maxSameTimeWorkers,
      index,
      expectedTime: row.expectedTime,
      dependencies: row.dependencies ?? null,
    })),
  };
}

async function findTemplateByCode(code: string): Promise<TemplateEntity | null> {
  const res = await strapiServiceFetch<StrapiList<TemplateEntity>>("/template-tasks", {
    query: {
      fields: ["documentId"],
      filters: { code: { $eq: code } },
      pagination: { pageSize: 1 },
    },
  });
  return res.data[0] ?? null;
}

/**
 * Ensures a template-task exists for the given legacy prodId and has subtasks.
 */
export async function ensureTemplateTaskForProdId(
  prodId: number,
  fallbackName: string,
): Promise<string> {
  const code = String(prodId);
  const existing = await findTemplateByCode(code);
  if (existing) return existing.documentId;

  const created = await strapiServiceFetch<{ data: { documentId: string } }>(
    "/template-tasks",
    {
      method: "POST",
      body: JSON.stringify({
        data: { name: fallbackName, code, subTask: [] },
      }),
    },
  );

  const data = await fetchBoxTemplateData(prodId);
  const draft = buildTemplateFromBox(data);

  await strapiServiceFetch(`/template-tasks/${created.data.documentId}`, {
    method: "PUT",
    body: JSON.stringify({ data: toStrapiTemplatePayload(draft) }),
  });

  return created.data.documentId;
}
