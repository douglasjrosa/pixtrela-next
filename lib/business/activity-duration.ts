const MS_PER_SECOND = 1000;

export function calculateActivityDurationSeconds(
  startedAt: Date,
  endedAt: Date,
): number {
  const deltaMs = endedAt.getTime() - startedAt.getTime();
  if (!Number.isFinite(deltaMs) || deltaMs <= 0) return 0;
  return Math.floor(deltaMs / MS_PER_SECOND);
}
