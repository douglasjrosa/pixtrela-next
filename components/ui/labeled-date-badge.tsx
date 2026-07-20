import { CardBadge } from "@/components/ui/card";
import { StackedDateTime } from "@/components/ui/stacked-date-time";
import { formatDatePtBr } from "@/lib/format/datetime";
import {
  labeledDateBadgeToneClassName,
  type LabeledDateBadgeTone,
} from "@/lib/ui/labeled-date-badge-tone";
import { cn } from "@/lib/utils";

export type { LabeledDateBadgeTone };
export { labeledDateBadgeToneClassName };

export interface LabeledDateBadgeProps {
  label: string;
  value: string | null | undefined;
  tone?: LabeledDateBadgeTone;
  /** When true, show date stacked above time for datetime values. */
  showTime?: boolean;
  className?: string;
}

/** Label above a date (optional time), with swappable tone classes. */
export function LabeledDateBadge({
  label,
  value,
  tone = "secondary",
  showTime = false,
  className,
}: LabeledDateBadgeProps) {
  if (!value?.trim()) return null;

  return (
    <CardBadge
      className={cn(
        "flex-col items-start gap-0 py-1",
        labeledDateBadgeToneClassName(tone),
        className,
      )}
    >
      <span className="text-[0.65rem] font-medium leading-tight">{label}</span>
      {showTime ? (
        <StackedDateTime value={value} className="leading-tight" />
      ) : (
        <span className="leading-tight">{formatDatePtBr(value)}</span>
      )}
    </CardBadge>
  );
}
