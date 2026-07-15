"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { Input } from "@/components/ui/input";
import {
  TASK_LIST_NAME_MIN_CHARS,
  TASK_LIST_SEARCH_DEBOUNCE_MS,
} from "@/lib/schemas/task-list-filters";
import {
  parseTaskListSearchParams,
  serializeTaskListSearchParams,
} from "@/lib/tasks/task-list-params";

export function TasksNameSearch() {
  const tManage = useTranslations("tasks.manage");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const filters = parseTaskListSearchParams(
    Object.fromEntries(searchParams.entries()),
  );
  const [value, setValue] = useState(filters.q ?? "");

  useEffect(() => {
    setValue(filters.q ?? "");
  }, [filters.q]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const trimmed = value.trim();
      const nextQ =
        trimmed.length >= TASK_LIST_NAME_MIN_CHARS ? trimmed : undefined;
      const current = parseTaskListSearchParams(
        Object.fromEntries(searchParams.entries()),
      );
      if ((current.q ?? undefined) === nextQ) return;

      const params = serializeTaskListSearchParams({
        ...current,
        q: nextQ,
      });
      const query = params.toString();
      startTransition(() => {
        router.replace(query ? `/tasks?${query}` : "/tasks");
      });
    }, TASK_LIST_SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(handle);
  }, [value, router, searchParams]);

  return (
    <Input
      type="search"
      value={value}
      onChange={(event) => setValue(event.target.value)}
      placeholder={tManage("searchByName")}
      aria-label={tManage("searchByName")}
      className="max-w-sm flex-1"
    />
  );
}
