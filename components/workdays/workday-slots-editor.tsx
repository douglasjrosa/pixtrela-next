"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { CardBadge } from "@/components/ui/card";
import { DatePtBrInput } from "@/components/ui/date-ptbr-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SwitchField } from "@/components/ui/switch-field";
import {
  parseTimeToMinutes,
  type WorkdaySlotInput,
} from "@/lib/schemas/workday";
import { cn } from "@/lib/utils";
import { formatWorkdaySlotLabel } from "@/lib/workdays/format-workday-row-labels";
import {
  expandDateRangeSlots,
  expandRecurrentSlots,
  mergeAndSortWorkdaySlots,
  slotIdentityKey,
  WEEKDAY_MONDAY_TO_FRIDAY,
} from "@/lib/workdays/workday-slot-helpers";

const ALL_WEEKDAYS = [0, 1, 2, 3, 4, 5, 6] as const;
const DEFAULT_START_TIME = "08:00";
const DEFAULT_END_TIME = "12:00";

export interface WorkdaySlotsEditorProps {
  value: WorkdaySlotInput[];
  onChange: (next: WorkdaySlotInput[]) => void;
  disabled?: boolean;
  error?: string;
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
}: WorkdaySlotsEditorProps) {
  const t = useTranslations("workdays");
  const [isRecurrent, setIsRecurrent] = useState(true);
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([
    ...WEEKDAY_MONDAY_TO_FRIDAY,
  ]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [allDay, setAllDay] = useState(false);
  const [startTime, setStartTime] = useState(DEFAULT_START_TIME);
  const [endTime, setEndTime] = useState(DEFAULT_END_TIME);
  const [draftError, setDraftError] = useState<string | null>(null);

  function resolveMinutes(): {
    startMinute: number | null;
    endMinute: number | null;
  } | null {
    if (allDay) return { startMinute: null, endMinute: null };
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

    if (isRecurrent) {
      if (daysOfWeek.length === 0) {
        setDraftError(t("slotValidationPickDay"));
        return;
      }
      const added = expandRecurrentSlots({
        daysOfWeek,
        allDay,
        ...minutes,
      });
      onChange(mergeAndSortWorkdaySlots(value, added));
      return;
    }

    if (!startDate.trim()) {
      setDraftError(t("slotValidationPickDate"));
      return;
    }
    if (endDate.trim() && endDate.trim() < startDate.trim()) {
      setDraftError(t("slotValidationDateOrder"));
      return;
    }
    const added = expandDateRangeSlots({
      startDate: startDate.trim(),
      endDate: endDate.trim(),
      allDay,
      ...minutes,
    });
    if (added.length === 0) {
      setDraftError(t("slotValidationRangeLimit"));
      return;
    }
    onChange(mergeAndSortWorkdaySlots(value, added));
  }

  function handleRemoveSlot(slotKey: string): void {
    onChange(value.filter((slot) => slotIdentityKey(slot) !== slotKey));
  }

  return (
    <div className="space-y-3 rounded-md border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label>{t("slots")}</Label>
        <div className="flex gap-1.5">
          <Button
            type="button"
            size="sm"
            variant={isRecurrent ? "default" : "outline"}
            disabled={disabled}
            onClick={() => {
              setIsRecurrent(true);
              setDraftError(null);
            }}
          >
            {t("slotModeRecurrent")}
          </Button>
          <Button
            type="button"
            size="sm"
            variant={!isRecurrent ? "default" : "outline"}
            disabled={disabled}
            onClick={() => {
              setIsRecurrent(false);
              setDraftError(null);
            }}
          >
            {t("slotModeDate")}
          </Button>
        </div>
      </div>

      {isRecurrent ? (
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
        <div className="grid gap-3 sm:grid-cols-2">
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
        </div>
      )}

      <SwitchField
        id="slot-all-day"
        label={t("allDay")}
        checked={allDay}
        disabled={disabled}
        onCheckedChange={setAllDay}
      />

      {!allDay ? (
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
          <div className="flex flex-wrap gap-1.5">
            {value.map((slot) => {
              const key = slotIdentityKey(slot);
              const label = formatWorkdaySlotLabel(
                { ...slot, id: key },
                (msgKey, values) => t(msgKey, values),
              );
              return (
                <CardBadge
                  key={key}
                  className="inline-flex items-center gap-1 pr-1"
                >
                  <span>{label}</span>
                  <button
                    type="button"
                    disabled={disabled}
                    aria-label={`${t("removeSlot")} ${label}`}
                    className="rounded p-0.5 hover:bg-muted"
                    onClick={() => handleRemoveSlot(key)}
                  >
                    <X className="size-3" aria-hidden />
                  </button>
                </CardBadge>
              );
            })}
          </div>
        )}
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
