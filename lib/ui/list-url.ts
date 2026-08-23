export type ListSearchParamsRecord = Record<
  string,
  string | string[] | undefined
>;

export function listPathWithQuery(
  pathname: string,
  params: URLSearchParams,
): string {
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function listSearchParamsRecord(
  searchParams: URLSearchParams,
): ListSearchParamsRecord {
  return Object.fromEntries(searchParams.entries());
}

export const LIST_SEARCH_DEBOUNCE_MS = 300;
