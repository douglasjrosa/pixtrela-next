import {
  formatDurationMinutes,
  type DurationTranslator,
} from "@/lib/format/duration";

/**
 * Formats "spent of expected" durations for the compact task list row.
 */
export function formatSpentOfExpected(
  spentSeconds: number,
  expectedSeconds: number,
  format: DurationTranslator,
  join: (spent: string, expected: string) => string,
): string {
  return join(
    formatDurationMinutes(spentSeconds, format),
    formatDurationMinutes(expectedSeconds, format),
  );
}
