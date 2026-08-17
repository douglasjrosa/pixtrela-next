"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { Input } from "@/components/ui/input";
import {
  AWARD_LIST_SEARCH_DEBOUNCE_MS,
  AWARD_LIST_SEARCH_MIN_CHARS,
} from "@/lib/schemas/award-list-filters";
import {
  parseAwardListSearchParams,
  serializeAwardListSearchParams,
} from "@/lib/awards/award-list-params";
import { AWARDS_LIST_PATH } from "@/lib/awards/award-list-sort-url";

export function AwardsNameSearch() {
  const tAwards = useTranslations("awards");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const filters = parseAwardListSearchParams(
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
        trimmed.length >= AWARD_LIST_SEARCH_MIN_CHARS ? trimmed : undefined;
      const current = parseAwardListSearchParams(
        Object.fromEntries(searchParams.entries()),
      );
      if ((current.q ?? undefined) === nextQ) return;

      const params = serializeAwardListSearchParams({
        ...current,
        q: nextQ,
      });
      const query = params.toString();
      startTransition(() => {
        router.replace(
          query ? `${AWARDS_LIST_PATH}?${query}` : AWARDS_LIST_PATH,
        );
      });
    }, AWARD_LIST_SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(handle);
  }, [value, router, searchParams]);

  return (
    <Input
      type="search"
      value={value}
      onChange={(event) => setValue(event.target.value)}
      placeholder={tAwards("searchByName")}
      aria-label={tAwards("searchByName")}
      className="max-w-sm flex-1"
    />
  );
}
