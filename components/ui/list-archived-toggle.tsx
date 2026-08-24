"use client";

import { useRouter, useSearchParams } from "next/navigation";

import {
  listPathWithQuery,
  listSearchParamsRecord,
  type ListSearchParamsRecord,
} from "@/lib/ui/list-url";

type ListArchivedFilters = {
  showArchived: boolean;
};

export type ListArchivedToggleUrlProps<T extends ListArchivedFilters> = {
  label: string;
  pathname: string;
  parseFilters: (params: ListSearchParamsRecord) => T;
  serializeFilters: (filters: T) => URLSearchParams;
};

export type ListArchivedToggleControlledProps = {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

export type ListArchivedToggleProps<T extends ListArchivedFilters> =
  | ListArchivedToggleUrlProps<T>
  | ListArchivedToggleControlledProps;

function isControlled<T extends ListArchivedFilters>(
  props: ListArchivedToggleProps<T>,
): props is ListArchivedToggleControlledProps {
  return "checked" in props && "onChange" in props;
}

const CHECKBOX_CLASS = "size-4 rounded border border-input accent-primary";

export function ListArchivedToggle<T extends ListArchivedFilters>(
  props: ListArchivedToggleProps<T>,
) {
  if (isControlled(props)) {
    return (
      <ArchivedToggleLabel
        label={props.label}
        checked={props.checked}
        onChange={props.onChange}
      />
    );
  }
  return <UrlListArchivedToggle {...props} />;
}

function UrlListArchivedToggle<T extends ListArchivedFilters>({
  label,
  pathname,
  parseFilters,
  serializeFilters,
}: ListArchivedToggleUrlProps<T>) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filters = parseFilters(listSearchParamsRecord(searchParams));

  function handleChange(checked: boolean): void {
    router.replace(
      listPathWithQuery(
        pathname,
        serializeFilters({ ...filters, showArchived: checked }),
      ),
    );
  }

  return (
    <ArchivedToggleLabel
      label={label}
      checked={filters.showArchived}
      onChange={handleChange}
    />
  );
}

function ArchivedToggleLabel({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        className={CHECKBOX_CLASS}
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      {label}
    </label>
  );
}
