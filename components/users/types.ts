import type { UserFormInput } from "@/lib/schemas/user";

export interface UserRow {
  /** Strapi users-permissions numeric id (required for mutations). */
  id: number;
  documentId: string;
  name: string;
  username: string;
  email?: string | null;
  code: number;
  roleType: UserFormInput["roleType"];
}
