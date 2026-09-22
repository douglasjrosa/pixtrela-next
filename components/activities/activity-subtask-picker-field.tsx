"use client";

import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Controller, type Control } from "react-hook-form";

import { searchActivitySubtasksForPicker } from "@/app/(app)/activities/actions";
import { Button } from "@/components/ui/button";
import { FormModalShell } from "@/components/ui/form-modal-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isActivitySubtaskPickerSearchReady } from "@/lib/activities/activity-subtask-picker-search";
import { formatActivitySubtaskDisplayLabel } from "@/lib/business/activity-subtask-label";
import type { AdminActivityFormInput } from "@/lib/schemas/admin-activity";
import { LIST_SEARCH_DEBOUNCE_MS } from "@/lib/ui/list-url";
import { cn } from "@/lib/utils";

import type { ActivitySubtaskOption } from "./types";

function labelPartsFromOption(option: ActivitySubtaskOption) {
  return {
    subTaskName: option.name,
    taskQty: option.taskQty,
    taskName: option.taskName,
    taskCrmItemKey: option.taskCrmItemKey,
    taskDeliveryDate: option.taskDeliveryDate,
  };
}

export interface ActivitySubtaskPickerFieldProps {
  control: Control<AdminActivityFormInput>;
  selectedSubtask: ActivitySubtaskOption | null;
  disabled?: boolean;
  error?: boolean;
}

export function ActivitySubtaskPickerField({
  control,
  selectedSubtask,
  disabled = false,
  error = false,
}: ActivitySubtaskPickerFieldProps) {
  const t = useTranslations("activities");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ActivitySubtaskOption[]>([]);
  const [selection, setSelection] = useState<ActivitySubtaskOption | null>(
    selectedSubtask,
  );
  const [isSearching, startSearch] = useTransition();

  useEffect(() => {
    setSelection(selectedSubtask);
  }, [selectedSubtask]);

  useEffect(() => {
    if (!pickerOpen) {
      setResults([]);
      return;
    }

    const trimmed = query.trim();
    if (!isActivitySubtaskPickerSearchReady(trimmed)) {
      setResults([]);
      return;
    }

    const timer = window.setTimeout(() => {
      startSearch(async () => {
        try {
          const rows = await searchActivitySubtasksForPicker(trimmed);
          if (query.trim() !== trimmed) return;
          setResults(rows);
        } catch {
          setResults([]);
        }
      });
    }, LIST_SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [pickerOpen, query]);

  const searchReady = isActivitySubtaskPickerSearchReady(query);

  return (
    <Controller
      name="subTaskId"
      control={control}
      render={({ field }) => {
        const selectedLabel = selection
          ? formatActivitySubtaskDisplayLabel(labelPartsFromOption(selection))
          : t("subtaskPickerPlaceholder");

        function pick(item: ActivitySubtaskOption): void {
          setSelection(item);
          field.onChange(item.id);
          setPickerOpen(false);
          setQuery("");
          setResults([]);
        }

        function closePicker(): void {
          setPickerOpen(false);
          setQuery("");
          setResults([]);
        }

        return (
          <div className="space-y-2">
            <Label id="activity-subtask-label">{t("subtask")}</Label>
            <Button
              type="button"
              id="activity-subtask"
              variant="outline"
              disabled={disabled}
              className={cn(
                "h-auto min-h-9 w-full justify-start px-3 py-2 text-left",
                "font-normal whitespace-normal",
                error && "border-destructive",
              )}
              aria-labelledby="activity-subtask-label"
              onClick={() => setPickerOpen(true)}
            >
              {selectedLabel}
            </Button>

            {pickerOpen ? (
              <FormModalShell
                open
                layer="nested"
                size="lg"
                fillBody={false}
                title={t("subtaskPickerTitle")}
                onClose={closePicker}
                disabled={disabled}
              >
                <div className="space-y-3">
                  <Input
                    type="search"
                    value={query}
                    placeholder={t("subtaskPickerSearch")}
                    autoFocus
                    onChange={(event) => setQuery(event.target.value)}
                  />
                  <ul className="max-h-[min(50dvh,24rem)] space-y-1 overflow-y-auto">
                    {!searchReady ? (
                      <li className="text-muted-foreground py-4 text-center text-sm">
                        {t("subtaskPickerMinChars")}
                      </li>
                    ) : isSearching ? (
                      <li className="text-muted-foreground py-4 text-center text-sm">
                        {t("subtaskPickerSearching")}
                      </li>
                    ) : results.length === 0 ? (
                      <li className="text-muted-foreground py-4 text-center text-sm">
                        {t("subtaskPickerEmpty")}
                      </li>
                    ) : (
                      results.map((item) => (
                        <li key={item.id}>
                          <button
                            type="button"
                            className={cn(
                              "w-full rounded-md px-3 py-2 text-left text-sm",
                              "hover:bg-muted",
                              item.id === field.value && "bg-muted",
                            )}
                            onClick={() => pick(item)}
                          >
                            {formatActivitySubtaskDisplayLabel(
                              labelPartsFromOption(item),
                            )}
                          </button>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              </FormModalShell>
            ) : null}
          </div>
        );
      }}
    />
  );
}
