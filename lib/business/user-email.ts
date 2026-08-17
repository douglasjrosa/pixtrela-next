import { isDeliverableEmail, normalizeEmail } from "@/lib/mail/deliverable-email";

export interface UserEmailOwner {
  documentId: string;
  email?: string | null;
}

export function isUserEmailAvailable(
  email: string,
  users: UserEmailOwner[],
  excludeDocumentId?: string,
): boolean {
  if (!isDeliverableEmail(email)) return false;
  const normalized = normalizeEmail(email);
  return !users.some((user) => {
    if (user.documentId === excludeDocumentId) return false;
    if (!user.email) return false;
    return normalizeEmail(user.email) === normalized;
  });
}
