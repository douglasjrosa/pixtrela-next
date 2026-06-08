import qs from "qs";

export type StrapiQueryParams = {
  fields?: string[];
  populate?: string | Record<string, unknown>;
  filters?: Record<string, unknown>;
  sort?: string | string[];
  pagination?: { page?: number; pageSize?: number };
};

/**
 * Serializes Strapi REST query params using qs (nested filters/populate).
 */
export function buildStrapiQuery(params: StrapiQueryParams): string {
  const query = qs.stringify(params, { encodeValuesOnly: true });
  return query ? `?${query}` : "";
}
