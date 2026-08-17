export interface UserCodeOwner {
  documentId: string;
  code: number | null;
}

export function isUserCodeAvailable(
  code: number | null | undefined,
  users: UserCodeOwner[],
  excludeDocumentId?: string,
): boolean {
  if (code == null) {
    return true;
  }

  return !users.some(
    (user) =>
      user.code != null &&
      user.code === code &&
      user.documentId !== excludeDocumentId,
  );
}
