"use server";

import { revalidateTag } from "next/cache";

import { auth } from "@/auth";
import { mediaAssets } from "@/drizzle/schema";
import type { Role } from "@/lib/auth/nav";
import {
  canViewUsers,
  canSetUserPassword,
  canPairUserTag,
} from "@/lib/auth/permissions";
import { canDeleteUsers, canManageRole } from "@/lib/business/roles";
import { getDb } from "@/lib/db/client";
import { normalizeUserTag } from "@/lib/kiosk/user-tag";
import { storeMedia } from "@/lib/media/store-media";
import {
  createUser as createUserRepo,
  deactivateUser as deactivateUserRepo,
  findUserById,
  findUserIdByTag,
  setUserAvatarMedia,
  setUserFacePhotoMedia,
  setUserTag,
  updateUserAccount,
  type UserRole,
} from "@/lib/repos/users";
import { buildUserFormSchema, type UserFormInput } from "@/lib/schemas/user";
import { userListFiltersSchema } from "@/lib/schemas/user-list-filters";
import { deriveUserEmail } from "@/lib/users/create-user-payload";
import {
  loadUserListPage,
  type UserListPageResult,
} from "@/lib/users/load-user-list-page";

export type UserImageType = "avatar" | "facePhoto";
export type UserId = number | string;

const FACE_DESCRIPTOR_LENGTH = 128;
const USER_DEACTIVATION_REASON = "deactivated_by_manager";

function parseFaceVectorFromFormData(formData: FormData): number[] | null {
  const raw = formData.get("faceVector");
  if (typeof raw !== "string" || raw.length === 0) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length !== FACE_DESCRIPTOR_LENGTH) {
      return null;
    }
    const vector: number[] = [];
    for (const value of parsed) {
      if (typeof value !== "number" || !Number.isFinite(value)) return null;
      vector.push(value);
    }
    return vector;
  } catch {
    return null;
  }
}

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
  revalidateTag("drizzle:users", "default");
}

export async function loadMoreUsers(
  rawFilters: unknown,
  page: number,
): Promise<UserListPageResult> {
  await assertCanView();
  const filters = userListFiltersSchema.parse(rawFilters);
  return loadUserListPage(filters, page);
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

function toUserIdString(userId: UserId): string {
  return String(userId);
}

export async function createUser(raw: UserFormInput): Promise<void> {
  const actorRole = await assertCanView();
  const sanitized = sanitizePasswordFields(raw, actorRole);
  const data = buildUserFormSchema({
    requirePassword: canSetUserPassword(actorRole),
  }).parse(sanitized);
  await assertCanManageTargetRole(data.roleType as Role);

  await createUserRepo({
    username: data.username,
    password: data.password!,
    name: data.name,
    role: data.roleType as UserRole,
    email: deriveUserEmail(data.username),
    code: data.code,
    greetingGender: data.greetingGender ?? "neutral",
  });
  invalidateUsers();
}

async function loadUserRole(userId: UserId): Promise<Role> {
  const user = await findUserById(toUserIdString(userId));
  if (!user) throw new Error("forbidden");
  return user.role as Role;
}

export async function updateUser(
  userId: UserId,
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

  await updateUserAccount({
    id: toUserIdString(userId),
    name: data.name,
    username: data.username,
    email: data.username ? deriveUserEmail(data.username) : undefined,
    password: data.password,
    code: data.code,
    role: data.roleType as UserRole | undefined,
    greetingGender: data.greetingGender,
  });
  invalidateUsers();
}

export type PairUserTagResult =
  | { ok: true; userTag: string }
  | { ok: false; error: "forbidden" | "invalid" | "conflict" };

export async function pairUserTag(
  userId: UserId,
  rawTag: string,
): Promise<PairUserTagResult> {
  const session = await auth();
  const actorRole = session?.user?.role as Role | undefined;
  if (!canPairUserTag(actorRole)) {
    return { ok: false, error: "forbidden" };
  }

  const userTag = normalizeUserTag(rawTag);
  if (!userTag) {
    return { ok: false, error: "invalid" };
  }

  const currentRole = await loadUserRole(userId);
  if (!canManageRole(actorRole!, currentRole)) {
    return { ok: false, error: "forbidden" };
  }

  const ownerId = await findUserIdByTag(userTag);
  if (ownerId && ownerId !== toUserIdString(userId)) {
    return { ok: false, error: "conflict" };
  }
  try {
    await setUserTag(toUserIdString(userId), userTag);
  } catch {
    return { ok: false, error: "conflict" };
  }
  invalidateUsers();
  return { ok: true, userTag };
}

export async function deactivateUser(userId: UserId): Promise<void> {
  const actorRole = await assertCanView();
  const currentRole = await loadUserRole(userId);
  if (!canManageRole(actorRole, currentRole)) {
    throw new Error("forbidden");
  }

  await deactivateUserRepo(toUserIdString(userId), USER_DEACTIVATION_REASON);
  invalidateUsers();
}

export async function deleteUser(userId: UserId): Promise<void> {
  const session = await auth();
  const actorRole = session?.user?.role as Role | undefined;
  if (!actorRole || !canDeleteUsers(actorRole)) {
    throw new Error("forbidden");
  }

  await deactivateUserRepo(toUserIdString(userId), USER_DEACTIVATION_REASON);
  invalidateUsers();
}

export async function updateUserImage(
  userId: UserId,
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
  if (!(entry instanceof Blob) || entry.size === 0) {
    throw new Error("invalid");
  }
  if (!entry.type.startsWith("image/")) {
    throw new Error("invalid");
  }
  const mimeType = entry.type || "image/jpeg";
  const buffer = Buffer.from(await entry.arrayBuffer());
  const extension = mimeType.includes("png") ? "png" : "jpg";
  const stored = await storeMedia({ bytes: buffer, mimeType, extension });
  const db = getDb();
  const [media] = await db
    .insert(mediaAssets)
    .values({
      storageKey: stored.storageKey,
      url: stored.url,
      mimeType: stored.mimeType,
      byteSize: stored.byteSize,
    })
    .returning({ id: mediaAssets.id });
  const userIdStr = toUserIdString(userId);
  if (imageType === "avatar") {
    await setUserAvatarMedia(userIdStr, media.id, db);
  } else {
    const faceVector = parseFaceVectorFromFormData(formData);
    if (formData.has("faceVector") && !faceVector) {
      throw new Error("invalid");
    }
    await setUserFacePhotoMedia(userIdStr, media.id, faceVector, db);
  }
  invalidateUsers();
}
