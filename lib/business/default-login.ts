export function buildDefaultLogin(
  name: string,
  code: number | string | null | undefined,
): string {
  const namePart = name.trim().toLowerCase().replace(/\s+/g, ".");
  const codePart =
    code == null || code === "" ? "" : String(code).trim();

  if (!namePart && !codePart) {
    return "";
  }
  if (!namePart) {
    return codePart;
  }
  if (!codePart) {
    return namePart;
  }
  return `${namePart}.${codePart}`;
}
