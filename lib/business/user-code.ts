export interface UserCodeOwner {
  documentId: string;
  code: number;
}

export function isUserCodeAvailable(
  code: number,
  users: UserCodeOwner[],
  excludeDocumentId?: string,
): boolean {
  return !users.some(
    (user) => user.code === code && user.documentId !== excludeDocumentId,
  );
}
