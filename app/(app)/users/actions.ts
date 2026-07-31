"use server";

import { auth } from "@/auth";
import type { Role } from "@/lib/auth/nav";
import { canViewUsers, canSetUserPassword } from "@/lib/auth/permissions";
import { canDeleteUsers, canManageRole } from "@/lib/business/roles";
import { buildUserFormSchema, type UserFormInput } from "@/lib/schemas/user";
import { STRAPI_TAGS, strapiFetch } from "@/lib/strapi";
import { revalidateStrapiTags } from "@/lib/strapi/revalidate";
import { strapiUpload } from "@/lib/strapi/upload";
import {
  buildCreateUserPayload,
  buildUpdateUserPayload,
} from "@/lib/users/create-user-payload";

export type UserImageType = "avatar" | "facePhoto";

async function assertCanView(): Promise<Role> {
  const session = await auth();
  const role = session?.user?.role as Role | undefined;
  if (!canViewUsers(role)) {
    throw new Error("forbidden");
  }
  return role!;
}

async function assertCanManageTargetRole(targetRole: Role): Promise<void> {
  const actorRole = await assertCanView();
  if (!canManageRole(actorRole, targetRole)) {
    throw new Error("forbidden");
  }
}

function invalidateUsers(): void {
  revalidateStrapiTags(STRAPI_TAGS.users);
}

function sanitizePasswordFields(
  raw: Partial<UserFormInput>,
  actorRole: Role,
): Partial<UserFormInput> {
  if (!canSetUserPassword(actorRole)) {
    const sanitized = { ...raw };
    delete sanitized.password;
    return sanitized;
  }
  if (raw.password === "") {
    const sanitized = { ...raw };
    delete sanitized.password;
    return sanitized;
  }
  return raw;
}

export async function createUser(raw: UserFormInput): Promise<void> {
  const actorRole = await assertCanView();
  const sanitized = sanitizePasswordFields(raw, actorRole);
  const data = buildUserFormSchema({
    requirePassword: canSetUserPassword(actorRole),
  }).parse(sanitized);
  await assertCanManageTargetRole(data.roleType as Role);

  await strapiFetch("/users", {
    method: "POST",
    strapiCache: { noStore: true },
    body: JSON.stringify(buildCreateUserPayload(data)),
  });
  invalidateUsers();
}

interface StrapiUserEntity {
  id: number;
  roleType?: Role;
}

async function loadUserRole(userId: number): Promise<Role> {
  const users = await strapiFetch<StrapiUserEntity[]>(
    "/users",
    { strapiCache: { noStore: true } },
    {
      filters: { id: { $eq: userId } },
      fields: ["id", "roleType"],
    },
  );
  const user = users[0];
  if (!user) {
    throw new Error("forbidden");
  }
  return (user.roleType as Role | undefined) ?? "colaborator";
}

export async function updateUser(
  userId: number,
  raw: Partial<UserFormInput>,
): Promise<void> {
  const actorRole = await assertCanView();
  const currentRole = await loadUserRole(userId);
  if (!canManageRole(actorRole, currentRole)) {
    throw new Error("forbidden");
  }

  const sanitized = sanitizePasswordFields(raw, actorRole);
  const data = buildUserFormSchema().partial().parse(sanitized);
  if (data.roleType && !canManageRole(actorRole, data.roleType as Role)) {
    throw new Error("forbidden");
  }

  await strapiFetch(`/users/${userId}`, {
    method: "PUT",
    strapiCache: { noStore: true },
    body: JSON.stringify(buildUpdateUserPayload(data)),
  });
  invalidateUsers();
}

export async function deactivateUser(userId: number): Promise<void> {
  await assertCanView();
  await strapiFetch(`/users/${userId}`, {
    method: "PUT",
    strapiCache: { noStore: true },
    body: JSON.stringify({ blocked: true }),
  });
  invalidateUsers();
}

export async function deleteUser(userId: number): Promise<void> {
  const session = await auth();
  const actorRole = session?.user?.role as Role | undefined;
  if (!actorRole || !canDeleteUsers(actorRole)) {
    throw new Error("forbidden");
  }
  await strapiFetch(`/users/${userId}`, {
    method: "DELETE",
    strapiCache: { noStore: true },
  });
  invalidateUsers();
}

export async function updateUserImage(
  userId: number,
  imageType: UserImageType,
  formData: FormData,
): Promise<void> {
  const actorRole = await assertCanView();
  if (actorRole !== "admin") {
    throw new Error("forbidden");
  }
  if (imageType !== "avatar" && imageType !== "facePhoto") {
    throw new Error("invalid");
  }

  const currentRole = await loadUserRole(userId);
  if (!canManageRole(actorRole, currentRole)) {
    throw new Error("forbidden");
  }

  const entry = formData.get("file");
  if (!(entry instanceof File) || entry.size === 0) {
    throw new Error("invalid");
  }
  if (!entry.type.startsWith("image/")) {
    throw new Error("invalid");
  }

  const mediaId = await strapiUpload(entry);
  await strapiFetch(`/users/${userId}`, {
    method: "PUT",
    strapiCache: { noStore: true },
    body: JSON.stringify({ [imageType]: mediaId }),
  });
  invalidateUsers();
}
