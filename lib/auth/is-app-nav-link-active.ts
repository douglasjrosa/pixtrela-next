export type AppNavLinkActiveOptions = {
  /** Hrefs that match only on an exact pathname (e.g. colaborator dashboard). */
  exactMatchHrefs?: readonly string[];
};

/** Whether a top nav link should appear selected for the current pathname. */
export function isAppNavLinkActive(
  pathname: string | null,
  href: string,
  options: AppNavLinkActiveOptions = {},
): boolean {
  if (!pathname) return false;
  const path = pathname.split("?")[0] ?? pathname;

  if (options.exactMatchHrefs?.includes(href)) {
    return path === href;
  }

  if (href === "/") {
    return path === "/";
  }

  if (href.startsWith("/settings")) {
    return path.startsWith("/settings");
  }

  return path === href || path.startsWith(`${href}/`);
}
