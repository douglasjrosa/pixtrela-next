"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { CardBadge } from "@/components/ui/card";
import { DatePtBrInput } from "@/components/ui/date-ptbr-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  parseTimeToMinutes,
  type WorkdaySlotInput,
} from "@/lib/schemas/workday";
import { cn } from "@/lib/utils";
import {
  formatWorkdaySlotTime,
  groupWorkdaySlotsByWeekday,
} from "@/lib/workdays/group-workday-slots";
import {
  civilDayMinutes,
  expandDateRangeSlots,
  expandRecurrentSlots,
  mergeAndSortWorkdaySlots,
  weekdayOfSlot,
  WEEKDAY_MONDAY_TO_FRIDAY,
} from "@/lib/workdays/workday-slot-helpers";

import { WorkdaySlotBadgeGroups } from "./workday-slot-badge-groups";

const ALL_WEEKDAYS = [0, 1, 2, 3, 4, 5, 6] as const;
const DEFAULT_START_TIME = "08:00";
const DEFAULT_END_TIME = "12:00";

export interface WorkdaySlotsEditorProps {
  value: WorkdaySlotInput[];
  onChange: (next: WorkdaySlotInput[]) => void;
  disabled?: boolean;
  error?: string;
  recurrent?: boolean;
  civilDay?: boolean;
  singleDatedSlot?: boolean;
}

function toggleWeekday(selected: number[], day: number): number[] {
  if (selected.includes(day)) {
    return selected.filter((item) => item !== day);
  }
  return [...selected, day].sort((a, b) => a - b);
}

export function WorkdaySlotsEditor({
  value,
  onChange,
  disabled = false,
  error,
  recurrent = false,
  civilDay = false,
  singleDatedSlot = true,
}: WorkdaySlotsEditorProps) {
  const t = useTranslations("workdays");
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([
    ...WEEKDAY_MONDAY_TO_FRIDAY,
  ]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startTime, setStartTime] = useState(DEFAULT_START_TIME);
  const [endTime, setEndTime] = useState(DEFAULT_END_TIME);
  const [draftError, setDraftError] = useState<string | null>(null);

  function resolveMinutes(): {
    startMinute: number;
    endMinute: number;
  } | null {
    if (civilDay) return civilDayMinutes();
    const startMinute = parseTimeToMinutes(startTime);
    const endMinute = parseTimeToMinutes(endTime);
    if (startMinute === null || endMinute === null || endMinute <= startMinute) {
      setDraftError(t("slotValidationTimeOrder"));
      return null;
    }
    return { startMinute, endMinute };
  }

  function handleAddSlots(): void {
    setDraftError(null);
    const minutes = resolveMinutes();
    if (!minutes) return;

    if (recurrent) {
      if (daysOfWeek.length === 0) {
        setDraftError(t("slotValidationPickDay"));
        return;
      }
      const added = expandRecurrentSlots({
        daysOfWeek,
        ...minutes,
      });
      onChange(mergeAndSortWorkdaySlots(value, added));
      return;
    }

    if (!startDate.trim()) {
      setDraftError(t("slotValidationPickDate"));
      return;
    }
    if (
      !singleDatedSlot &&
      endDate.trim() &&
      endDate.trim() < startDate.trim()
    ) {
      setDraftError(t("slotValidationDateOrder"));
      return;
    }
    const added = expandDateRangeSlots({
      startDate: startDate.trim(),
      endDate: singleDatedSlot ? startDate.trim() : endDate.trim(),
      ...minutes,
    });
    if (added.length === 0) {
      setDraftError(t("slotValidationRangeLimit"));
      return;
    }
    onChange(
      singleDatedSlot
        ? added.slice(0, 1)
        : mergeAndSortWorkdaySlots(value, added),
    );
  }

  function handleRemoveGroup(weekday: number, time: string): void {
    onChange(
      value.filter((slot) => {
        const matchesWeekday = weekdayOfSlot(slot) === weekday;
        return !(matchesWeekday && formatWorkdaySlotTime(slot) === time);
      }),
    );
  }

  const groups = groupWorkdaySlotsByWeekday(value).map((group) => ({
    weekday: group.weekday,
    weekdayLabel: t(`weekdayShort${group.weekday}`),
    times: group.times,
  }));

  return (
    <div className="space-y-3 rounded-md border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label>{t("slots")}</Label>
      </div>

      {recurrent ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label className="text-xs text-muted-foreground">
              {t("daysOfWeek")}
            </Label>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={disabled}
              onClick={() => setDaysOfWeek([...WEEKDAY_MONDAY_TO_FRIDAY])}
            >
              {t("weekdaysPreset")}
            </Button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {ALL_WEEKDAYS.map((day) => {
              const selected = daysOfWeek.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  disabled={disabled}
                  aria-pressed={selected}
                  onClick={() => setDaysOfWeek((curr) => toggleWeekday(curr, day))}
                >
                  <CardBadge
                    className={cn(
                      "cursor-pointer px-2.5 py-1 transition-colors",
                      selected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80",
                    )}
                  >
                    {t(`weekdayShort${day}`)}
                  </CardBadge>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className={cn("grid gap-3", !singleDatedSlot && "sm:grid-cols-2")}>
          <div className="space-y-1.5">
            <Label htmlFor="slot-date-start">{t("dateStart")}</Label>
            <DatePtBrInput
              id="slot-date-start"
              value={startDate}
              disabled={disabled}
              allowEmpty
              onChange={setStartDate}
            />
          </div>
          {!singleDatedSlot ? (
            <div className="space-y-1.5">
              <Label htmlFor="slot-date-end">{t("dateEnd")}</Label>
              <DatePtBrInput
                id="slot-date-end"
                value={endDate}
                disabled={disabled}
                allowEmpty
                onChange={setEndDate}
              />
            </div>
          ) : null}
        </div>
      )}

      {!civilDay ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="slot-start-time">{t("startTime")}</Label>
            <Input
              id="slot-start-time"
              type="time"
              value={startTime}
              disabled={disabled}
              onChange={(event) => setStartTime(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="slot-end-time">{t("endTime")}</Label>
            <Input
              id="slot-end-time"
              type="time"
              value={endTime}
              disabled={disabled}
              onChange={(event) => setEndTime(event.target.value)}
            />
          </div>
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-2">
        {draftError ? (
          <p className="text-sm text-destructive">{draftError}</p>
        ) : (
          <span />
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={handleAddSlots}
        >
          <Plus className="mr-1 size-4" aria-hidden />
          {t("addSlots")}
        </Button>
      </div>

      <div className="border-t pt-3">
        {value.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noSlotsYet")}</p>
        ) : (
          <WorkdaySlotBadgeGroups
            groups={groups}
            align="start"
            disabled={disabled}
            onRemove={handleRemoveGroup}
            removeLabel={(weekdayLabel, time) =>
              `${t("removeSlot")} ${weekdayLabel} ${time}`
            }
          />
        )}
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
