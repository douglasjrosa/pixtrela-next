import { normalizeEmail } from "@/lib/mail/deliverable-email";
import { deriveUserEmail } from "@/lib/users/create-user-payload";

export interface UserEmailOwner {
  documentId: string;
  email?: string | null;
  username?: string;
}

function resolveStoredEmail(user: UserEmailOwner): string | null {
  if (user.email?.trim()) {
    return normalizeEmail(user.email);
  }
  if (user.username?.trim()) {
    return normalizeEmail(deriveUserEmail(user.username));
  }
  return null;
}

export function isUserEmailAvailable(
  email: string,
  users: UserEmailOwner[],
  excludeDocumentId?: string,
): boolean {
  const normalized = normalizeEmail(email);
  return !users.some((user) => {
    if (user.documentId === excludeDocumentId) return false;
    const existingEmail = resolveStoredEmail(user);
    if (!existingEmail) return false;
    return existingEmail === normalized;
  });
}
