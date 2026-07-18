import { deriveUserEmail } from "@/lib/users/create-user-payload";

export interface UserLoginOwner {
  documentId: string;
  username: string;
  /** Stored Strapi email when available (may lag behind username). */
  email?: string | null;
}

/**
 * True when username (and its derived synthetic email) are free.
 * Catches orphan emails left after username renames without email sync.
 */
export function isUserLoginAvailable(
  username: string,
  users: UserLoginOwner[],
  excludeDocumentId?: string,
): boolean {
  const normalizedUsername = username.trim().toLowerCase();
  const derivedEmail = deriveUserEmail(username);

  return !users.some((user) => {
    if (user.documentId === excludeDocumentId) return false;
    if (user.username.trim().toLowerCase() === normalizedUsername) return true;
    const existingEmail = (user.email ?? deriveUserEmail(user.username))
      .trim()
      .toLowerCase();
    return existingEmail === derivedEmail;
  });
}
