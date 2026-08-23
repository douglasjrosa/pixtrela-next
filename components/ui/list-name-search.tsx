"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Input } from "@/components/ui/input";
import {
  LIST_SEARCH_DEBOUNCE_MS,
  listPathWithQuery,
  listSearchParamsRecord,
  type ListSearchParamsRecord,
} from "@/lib/ui/list-url";
import { cn } from "@/lib/utils";

type ListSearchFilters = {
  q?: string;
};

export type ListNameSearchUrlProps<T extends ListSearchFilters> = {
  label: string;
  pathname: string;
  parseFilters: (params: ListSearchParamsRecord) => T;
  serializeFilters: (filters: T) => URLSearchParams;
  minChars: number;
  debounceMs?: number;
  className?: string;
};

export type ListNameSearchControlledProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

export type ListNameSearchProps<T extends ListSearchFilters> =
  | ListNameSearchUrlProps<T>
  | ListNameSearchControlledProps;

function isControlled(
  props: ListNameSearchProps<ListSearchFilters>,
): props is ListNameSearchControlledProps {
  return "value" in props && "onChange" in props;
}

export function ListNameSearch<T extends ListSearchFilters>(
  props: ListNameSearchProps<T>,
) {
  if (isControlled(props)) {
    return (
      <SearchInput
        label={props.label}
        value={props.value}
        className={props.className}
        onChange={props.onChange}
      />
    );
  }
  return <UrlListNameSearch {...props} />;
}

function UrlListNameSearch<T extends ListSearchFilters>({
  label,
  pathname,
  parseFilters,
  serializeFilters,
  minChars,
  debounceMs = LIST_SEARCH_DEBOUNCE_MS,
  className,
}: ListNameSearchUrlProps<T>) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const filters = parseFilters(listSearchParamsRecord(searchParams));
  const [value, setValue] = useState(filters.q ?? "");
  const qFromUrl = filters.q ?? "";
  const [prevQFromUrl, setPrevQFromUrl] = useState(qFromUrl);
  if (qFromUrl !== prevQFromUrl) {
    setPrevQFromUrl(qFromUrl);
    setValue(qFromUrl);
  }

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const trimmed = value.trim();
      const nextQ = trimmed.length >= minChars ? trimmed : undefined;
      const current = parseFilters(listSearchParamsRecord(searchParams));
      if ((current.q ?? undefined) === nextQ) return;

      startTransition(() => {
        router.replace(
          listPathWithQuery(
            pathname,
            serializeFilters({ ...current, q: nextQ }),
          ),
        );
      });
    }, debounceMs);

    return () => window.clearTimeout(handle);
  }, [
    value,
    router,
    searchParams,
    pathname,
    parseFilters,
    serializeFilters,
    minChars,
    debounceMs,
  ]);

  return (
    <SearchInput
      label={label}
      value={value}
      className={className}
      onChange={setValue}
    />
  );
}

function SearchInput({
  label,
  value,
  onChange,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <Input
      type="search"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={label}
      aria-label={label}
      className={cn("max-w-sm flex-1", className)}
    />
  );
}
