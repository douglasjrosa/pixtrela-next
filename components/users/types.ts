import type { UserFormInput } from "@/lib/schemas/user";

export interface UserRow {
  /** Strapi numeric id, or Drizzle UUID string when DATA_BACKEND=drizzle. */
  id: number | string;
  documentId: string;
  name: string;
  username: string;
  email?: string | null;
  code: number;
  roleType: UserFormInput["roleType"];
  greetingGender?: "masculine" | "feminine" | null;
  /** Soft-deactivated via users-permissions `blocked`. */
  blocked?: boolean;
  avatarUrl?: string | null;
  facePhotoUrl?: string | null;
}
