import { splitDateTimePtBr } from "@/lib/format/datetime";
import { cn } from "@/lib/utils";

export interface StackedDateTimeProps {
  value: string;
  className?: string;
  "aria-label"?: string;
}

/** Date on top, time below (pt-BR), no comma separator. */
export function StackedDateTime({
  value,
  className,
  "aria-label": ariaLabel,
}: StackedDateTimeProps) {
  const { date, time } = splitDateTimePtBr(value);
  return (
    <span
      className={cn("flex flex-col leading-tight tabular-nums", className)}
      aria-label={ariaLabel}
    >
      <span>{date}</span>
      {time ? <span>{time}</span> : null}
    </span>
  );
}
