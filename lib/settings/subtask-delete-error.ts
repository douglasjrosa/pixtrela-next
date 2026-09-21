export function settingsSubtaskDeleteErrorKey(
  error: unknown,
): "categoryHasFlags" | "categoryInUse" | "flagOccupiedError" | "error" {
  const code = error instanceof Error ? error.message : "";
  if (code === "categoryHasFlags") return "categoryHasFlags";
  if (code === "categoryInUse") return "categoryInUse";
  if (code === "flagOccupied") return "flagOccupiedError";
  return "error";
}
