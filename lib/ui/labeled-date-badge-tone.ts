export type LabeledDateBadgeTone = "danger" | "secondary";

const TONE_CLASS_NAME: Record<LabeledDateBadgeTone, string> = {
  danger: "border-destructive/40 bg-destructive/10 text-destructive",
  secondary: "border-border bg-secondary text-secondary-foreground",
};

export function labeledDateBadgeToneClassName(
  tone: LabeledDateBadgeTone,
): string {
  return TONE_CLASS_NAME[tone];
}
