export function assertFinishFlagsAllowed(input: {
  willFinish: boolean;
  hasDependents: boolean;
  categoryId: string | null | undefined;
  totalFlagCount: number;
}): void {
  if (!input.willFinish || !input.hasDependents) return;
  if (!input.categoryId) throw new Error("subTaskHasNoCategory");
  if (input.totalFlagCount < 1) throw new Error("flagsRequired");
}

export function mergeFlagIds(
  existing: readonly string[],
  next: readonly string[],
): string[] {
  return [...new Set([...existing, ...next].filter((id) => id.length > 0))];
}
