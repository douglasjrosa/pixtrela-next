import {
  TEMPLATE_LIST_NAME_MIN_CHARS,
  templateListFiltersSchema,
  type TemplateListFilters,
} from "@/lib/schemas/template-list-filters";

export type SearchParamsRecord = Record<
  string,
  string | string[] | undefined
>;

function firstParam(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export function defaultTemplateListFilters(): TemplateListFilters {
  return templateListFiltersSchema.parse({});
}

/**
 * Parses URL search params into template list filters.
 * Missing params use empty defaults (no q/code).
 */
export function parseTemplateListSearchParams(
  params: SearchParamsRecord,
): TemplateListFilters {
  const qRaw = firstParam(params.q)?.trim();
  const codeRaw = firstParam(params.code)?.trim();

  const result = templateListFiltersSchema.safeParse({
    q:
      qRaw && qRaw.length >= TEMPLATE_LIST_NAME_MIN_CHARS
        ? qRaw
        : undefined,
    code: codeRaw || undefined,
  });

  if (!result.success) {
    return defaultTemplateListFilters();
  }
  return result.data;
}

/**
 * Serializes filters to URLSearchParams, omitting empty values.
 */
export function serializeTemplateListSearchParams(
  filters: TemplateListFilters,
): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.q) {
    params.set("q", filters.q);
  }
  if (filters.code) {
    params.set("code", filters.code);
  }
  return params;
}

/** Stable key for Suspense remount when filters change. */
export function templateListFilterKey(filters: TemplateListFilters): string {
  return [filters.q ?? "", filters.code ?? ""].join("|");
}
