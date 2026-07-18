/** Props passed from RSC pages to client components must be JSON-serializable
 *  (except Server Actions, which Next.js handles specially). */

export function isJsonSerializable(value: unknown): boolean {
  try {
    JSON.stringify(value);
    return true;
  } catch {
    return false;
  }
}

export function hasNoFunctionValues(value: Record<string, unknown>): boolean {
  return Object.values(value).every((entry) => typeof entry !== "function");
}
