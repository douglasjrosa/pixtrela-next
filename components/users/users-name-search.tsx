"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { Input } from "@/components/ui/input";
import {
  USER_LIST_SEARCH_DEBOUNCE_MS,
  USER_LIST_SEARCH_MIN_CHARS,
} from "@/lib/schemas/user-list-filters";
import {
  parseUserListSearchParams,
  serializeUserListSearchParams,
} from "@/lib/users/user-list-params";
import { USERS_LIST_PATH } from "@/lib/users/user-list-sort-url";

export function UsersNameSearch() {
  const tUsers = useTranslations("users");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const filters = parseUserListSearchParams(
    Object.fromEntries(searchParams.entries()),
  );
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
      const nextQ =
        trimmed.length >= USER_LIST_SEARCH_MIN_CHARS ? trimmed : undefined;
      const current = parseUserListSearchParams(
        Object.fromEntries(searchParams.entries()),
      );
      if ((current.q ?? undefined) === nextQ) return;

      const params = serializeUserListSearchParams({
        ...current,
        q: nextQ,
      });
      const query = params.toString();
      startTransition(() => {
        router.replace(
          query ? `${USERS_LIST_PATH}?${query}` : USERS_LIST_PATH,
        );
      });
    }, USER_LIST_SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(handle);
  }, [value, router, searchParams]);

  return (
    <Input
      type="search"
      value={value}
      onChange={(event) => setValue(event.target.value)}
      placeholder={tUsers("searchByName")}
      aria-label={tUsers("searchByName")}
      className="max-w-sm flex-1"
    />
  );
}
