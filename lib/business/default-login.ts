export function buildDefaultLogin(name: string, code: number | string): string {
  const namePart = name.trim().toLowerCase().replace(/\s+/g, ".");
  const codePart = String(code).trim();

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
