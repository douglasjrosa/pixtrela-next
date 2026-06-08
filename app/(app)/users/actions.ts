"use server";

import { auth } from "@/auth";
import type { Role } from "@/lib/auth/nav";
import { canViewUsers } from "@/lib/auth/permissions";
import { canDeleteUsers, canManageRole } from "@/lib/business/roles";
import { userFormSchema, type UserFormInput } from "@/lib/schemas/user";
import { STRAPI_TAGS, strapiFetch } from "@/lib/strapi";
import { revalidateStrapiTags } from "@/lib/strapi/revalidate";
import {
  buildCreateUserPayload,
  buildUpdateUserPayload,
} from "@/lib/users/create-user-payload";

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

export async function createUser(raw: UserFormInput): Promise<void> {
  const data = userFormSchema.parse(raw);
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

function stripEmptyPassword(
  raw: Partial<UserFormInput>,
): Partial<UserFormInput> {
  if (raw.password === "") {
    const { password: _password, ...rest } = raw;
    return rest;
  }
  return raw;
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

  const data = userFormSchema.partial().parse(stripEmptyPassword(raw));
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
