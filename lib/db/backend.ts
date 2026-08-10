/**
 * Data backend selector for the greenfield migration.
 * Default is `drizzle` (Next + Postgres). Use `strapi` only while a page
 * still depends on the legacy API during coexistence.
 */
export type DataBackend = "drizzle" | "strapi";

export function getDataBackend(): DataBackend {
  const raw = process.env.DATA_BACKEND?.trim().toLowerCase();
  if (raw === "strapi") return "strapi";
  return "drizzle";
}

export function isDrizzleBackend(): boolean {
  return getDataBackend() === "drizzle";
}

export function isStrapiBackend(): boolean {
  return getDataBackend() === "strapi";
}
