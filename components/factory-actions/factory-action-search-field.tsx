"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
  type KeyboardEvent,
} from "react";
import { useTranslations } from "next-intl";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  shouldSearchFactoryActions,
  type FactoryAction,
} from "@/lib/business/factory-action";
import { cn } from "@/lib/utils";

async function searchActions(query: string): Promise<FactoryAction[]> {
  const { searchFactoryActions } = await import(
    "@/app/(app)/factory-actions/actions"
  );
  return searchFactoryActions(query);
}

const ACTION_SEARCH_DEBOUNCE_MS = 300;

export interface FactoryActionSearchFieldProps {
  id: string;
  value: string;
  selectedName: string;
  disabled?: boolean;
  errorMessage?: string | null;
  onChange: (actionId: string, action: FactoryAction | null) => void;
}

export function FactoryActionSearchField({
  id,
  value,
  selectedName,
  disabled = false,
  errorMessage,
  onChange,
}: FactoryActionSearchFieldProps) {
  const tActions = useTranslations("factoryActions");
  const tSubtasks = useTranslations("subtasks");
  const listId = useId();
  const [query, setQuery] = useState(selectedName);
  const [actions, setActions] = useState<FactoryAction[]>([]);
  const [highlight, setHighlight] = useState(0);
  const [isSearching, startSearch] = useTransition();
  const listRef = useRef<HTMLDivElement>(null);

  const canSearch = !disabled && shouldSearchFactoryActions(query);
  const visibleActions = canSearch ? actions : [];
  const showSuggestions = canSearch;

  useEffect(() => {
    if (!canSearch) return;

    const handle = window.setTimeout(() => {
      startSearch(async () => {
        try {
          const results = await searchActions(query);
          setActions(results);
          setHighlight(0);
        } catch {
          setActions([]);
        }
      });
    }, ACTION_SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(handle);
  }, [query, canSearch]);

  function selectAction(action: FactoryAction): void {
    onChange(action.documentId, action);
    setQuery(action.name);
    setActions([]);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    if (!showSuggestions || visibleActions.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlight((current) => (current + 1) % visibleActions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlight((current) =>
        current === 0 ? visibleActions.length - 1 : current - 1,
      );
    } else if (event.key === "Enter") {
      const selected = visibleActions[highlight];
      if (selected) {
        event.preventDefault();
        selectAction(selected);
      }
    } else if (event.key === "Escape") {
      setActions([]);
    }
  }

  return (
    <div className="relative space-y-2">
      <Label htmlFor={id}>{tSubtasks("action")}</Label>
      <Input
        id={id}
        value={query}
        disabled={disabled}
        autoComplete="off"
        role="combobox"
        aria-expanded={showSuggestions}
        aria-controls={listId}
        aria-activedescendant={
          showSuggestions && visibleActions[highlight]
            ? `${listId}-${visibleActions[highlight].documentId}`
            : undefined
        }
        onChange={(event) => {
          const next = event.target.value;
          setQuery(next);
          if (value) onChange("", null);
        }}
        onKeyDown={handleKeyDown}
      />
      {errorMessage ? (
        <p className="text-sm text-destructive">{errorMessage}</p>
      ) : null}

      {showSuggestions ? (
        <div
          id={listId}
          ref={listRef}
          role="listbox"
          aria-label={tActions("suggestions")}
          className={cn(
            "absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-md border",
            "bg-background shadow-md",
          )}
        >
          {isSearching && visibleActions.length === 0 ? (
            <p className="px-3 py-2 text-sm text-muted-foreground" role="status">
              {tActions("loading")}
            </p>
          ) : null}
          {!isSearching && visibleActions.length === 0 ? (
            <p className="px-3 py-2 text-sm text-muted-foreground" role="status">
              {tActions("searchEmpty")}
            </p>
          ) : null}
          {visibleActions.map((action, index) => (
            <button
              key={action.documentId}
              id={`${listId}-${action.documentId}`}
              type="button"
              role="option"
              aria-selected={index === highlight}
              className={cn(
                "flex w-full px-3 py-2 text-left text-sm",
                "hover:bg-muted focus-visible:bg-muted focus-visible:outline-none",
                index === highlight ? "bg-muted" : null,
              )}
              onMouseEnter={() => setHighlight(index)}
              onClick={() => selectAction(action)}
            >
              {action.name}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
