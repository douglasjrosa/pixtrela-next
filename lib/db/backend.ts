/** Canonical data backend is Drizzle + Postgres. */
export type DataBackend = "drizzle";

export function getDataBackend(): DataBackend {
  return "drizzle";
}
