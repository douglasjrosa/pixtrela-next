import type { ColaboratorOption } from "./types";

export function resolveDefaultColaboratorDocumentId(input: {
  role: string | undefined;
  sessionUserId: string | undefined;
  searchParam: string | undefined;
  options: ColaboratorOption[];
}): string | null {
  const { role, sessionUserId, searchParam, options } = input;

  if (role === "colaborator") {
    return sessionUserId ?? null;
  }

  if (searchParam && options.some((option) => option.documentId === searchParam)) {
    return searchParam;
  }

  return options[0]?.documentId ?? null;
}
