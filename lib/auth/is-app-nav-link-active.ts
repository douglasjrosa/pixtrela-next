/** Whether a top nav link should appear selected for the current pathname. */
export function isAppNavLinkActive(
  pathname: string | null,
  href: string,
): boolean {
  if (!pathname) return false;
  const path = pathname.split("?")[0] ?? pathname;

  if (href === "/") {
    return path === "/";
  }

  if (href.startsWith("/settings")) {
    return path.startsWith("/settings");
  }

  return path === href || path.startsWith(`${href}/`);
}
