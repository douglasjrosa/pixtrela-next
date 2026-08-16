import { and, asc, count, desc, eq, ilike } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import bcrypt from "bcryptjs";

import { mediaAssets, users } from "@/drizzle/schema";
import { canEstablishAppSession } from "@/lib/domain/auth-session";
import { getDb, type Db } from "@/lib/db/client";
import type { UserFormOwner } from "@/lib/schemas/user";
import type { UserListSort } from "@/lib/schemas/user-list-sort";

const BCRYPT_ROUNDS = 10;

export type UserRole =
  | "admin"
  | "manager"
  | "leader"
  | "colaborator"
  | "kiosk";

export type GreetingGender = "masculine" | "feminine" | "neutral" | null;

type DbGreetingGender = "male" | "female" | "neutral" | null;

function toDbGreetingGender(
  value: GreetingGender | undefined,
): DbGreetingGender {
  if (value === "masculine") return "male";
  if (value === "feminine") return "female";
  if (value === "neutral") return "neutral";
  return null;
}

function fromDbGreetingGender(
  value: DbGreetingGender | undefined,
): GreetingGender {
  if (value === "male") return "masculine";
  if (value === "female") return "feminine";
  if (value === "neutral") return "neutral";
  return null;
}

function mapUserRow(row: {
  id: string;
  username: string;
  email: string | null;
  name: string;
  lastName: string | null;
  phone: string | null;
  code: number | null;
  role: UserRole;
  blocked: boolean;
  active: boolean;
  greetingGender: DbGreetingGender;
  avatarUrl?: string | null;
  facePhotoUrl?: string | null;
}): UserRecord {
  return {
    ...row,
    avatarUrl: row.avatarUrl ?? null,
    facePhotoUrl: row.facePhotoUrl ?? null,
    greetingGender: fromDbGreetingGender(row.greetingGender),
  };
}

export type UserRecord = {
  id: string;
  username: string;
  email: string | null;
  name: string;
  lastName: string | null;
  phone: string | null;
  code: number | null;
  role: UserRole;
  blocked: boolean;
  active: boolean;
  greetingGender: GreetingGender;
  avatarUrl: string | null;
  facePhotoUrl: string | null;
};

export type CreateUserInput = {
  username: string;
  password: string;
  name: string;
  role: UserRole;
  email?: string | null;
  lastName?: string | null;
  phone?: string | null;
  code?: number | null;
  greetingGender?: GreetingGender;
};

export type UpdateUserPersonalInput = {
  id: string;
  name: string;
  lastName: string | null;
  phone: string | null;
  email?: string | null;
};

export type UpdateUserAccountInput = {
  id: string;
  name?: string;
  username?: string;
  email?: string | null;
  password?: string;
  code?: number | null;
  role?: UserRole;
  greetingGender?: GreetingGender;
  blocked?: boolean;
};

const avatarMedia = alias(mediaAssets, "avatar_media");
const facePhotoMedia = alias(mediaAssets, "face_photo_media");

const USER_COLUMNS = {
  id: users.id,
  username: users.username,
  email: users.email,
  name: users.name,
  lastName: users.lastName,
  phone: users.phone,
  code: users.code,
  role: users.role,
  blocked: users.blocked,
  active: users.active,
  greetingGender: users.greetingGender,
} as const;

const USER_LIST_COLUMNS = {
  ...USER_COLUMNS,
  avatarUrl: avatarMedia.url,
  facePhotoUrl: facePhotoMedia.url,
} as const;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

export async function createUser(
  input: CreateUserInput,
  db: Db = getDb(),
): Promise<UserRecord> {
  const passwordHash = await hashPassword(input.password);
  const [row] = await db
    .insert(users)
    .values({
      username: input.username.trim(),
      passwordHash,
      name: input.name.trim(),
      role: input.role,
      email: input.email ?? null,
      lastName: input.lastName ?? null,
      phone: input.phone ?? null,
      code: input.code ?? null,
      greetingGender: toDbGreetingGender(input.greetingGender ?? "neutral"),
    })
    .returning(USER_COLUMNS);
  return mapUserRow(row);
}

export async function listUsers(db: Db = getDb()): Promise<UserRecord[]> {
  const rows = await db
    .select(USER_LIST_COLUMNS)
    .from(users)
    .leftJoin(avatarMedia, eq(users.avatarMediaId, avatarMedia.id))
    .leftJoin(facePhotoMedia, eq(users.facePhotoMediaId, facePhotoMedia.id))
    .orderBy(asc(users.name));
  return rows.map((row) =>
    mapUserRow({
      ...row,
      avatarUrl: row.avatarUrl ?? null,
      facePhotoUrl: row.facePhotoUrl ?? null,
    }),
  );
}

export async function listUserUniquenessOwners(
  db: Db = getDb(),
): Promise<UserFormOwner[]> {
  const rows = await db
    .select({
      id: users.id,
      username: users.username,
      email: users.email,
      code: users.code,
    })
    .from(users);
  return rows.map((row) => ({
    documentId: row.id,
    username: row.username,
    email: row.email,
    code: row.code,
  }));
}

function userListOrderBy(sort: UserListSort) {
  const dir = sort.direction === "desc" ? desc : asc;
  if (sort.column === "code") {
    return [dir(users.code), asc(users.name), asc(users.id)];
  }
  if (sort.column === "role") {
    return [dir(users.role), asc(users.name), asc(users.id)];
  }
  return [dir(users.name), asc(users.id)];
}

export async function listUsersPage(
  options: {
    q?: string;
    page?: number;
    pageSize?: number;
    sort?: UserListSort;
  } = {},
  db: Db = getDb(),
): Promise<{ items: UserRecord[]; total: number }> {
  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.max(1, options.pageSize ?? 10);
  const offset = (page - 1) * pageSize;
  const q = options.q?.trim();
  const sort = options.sort ?? { column: "name", direction: "asc" };
  const where = q ? ilike(users.name, `%${q}%`) : undefined;

  const [totalRow] = await db
    .select({ total: count() })
    .from(users)
    .where(where);

  const rows = await db
    .select(USER_LIST_COLUMNS)
    .from(users)
    .leftJoin(avatarMedia, eq(users.avatarMediaId, avatarMedia.id))
    .leftJoin(facePhotoMedia, eq(users.facePhotoMediaId, facePhotoMedia.id))
    .where(where)
    .orderBy(...userListOrderBy(sort))
    .limit(pageSize)
    .offset(offset);

  return {
    items: rows.map((row) =>
      mapUserRow({
        ...row,
        avatarUrl: row.avatarUrl ?? null,
        facePhotoUrl: row.facePhotoUrl ?? null,
      }),
    ),
    total: totalRow?.total ?? 0,
  };
}

export async function listUsersByRole(
  role: UserRole,
  db: Db = getDb(),
): Promise<UserRecord[]> {
  const rows = await db
    .select(USER_COLUMNS)
    .from(users)
    .where(eq(users.role, role))
    .orderBy(asc(users.name));
  return rows.map(mapUserRow);
}

export async function updateUserPersonal(
  input: UpdateUserPersonalInput,
  db: Db = getDb(),
): Promise<UserRecord> {
  const patch: Partial<typeof users.$inferInsert> & { updatedAt: Date } = {
    name: input.name.trim(),
    lastName: input.lastName?.trim() || null,
    phone: input.phone?.trim() || null,
    updatedAt: new Date(),
  };
  if (input.email !== undefined) {
    patch.email = input.email?.trim().toLowerCase() || null;
  }

  const [row] = await db
    .update(users)
    .set(patch)
    .where(eq(users.id, input.id))
    .returning(USER_COLUMNS);
  if (!row) throw new Error("userNotFound");
  return mapUserRow(row);
}

export async function setUserAvatarMedia(
  userId: string,
  mediaId: string,
  db: Db = getDb(),
): Promise<void> {
  await db
    .update(users)
    .set({ avatarMediaId: mediaId, updatedAt: new Date() })
    .where(eq(users.id, userId));
}

export async function setUserFacePhotoMedia(
  userId: string,
  mediaId: string,
  faceVector: number[] | null,
  db: Db = getDb(),
): Promise<void> {
  await db
    .update(users)
    .set({
      facePhotoMediaId: mediaId,
      faceVector,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));
}

export async function findUserAvatarUrl(
  userId: string,
  db: Db = getDb(),
): Promise<string | null> {
  const [row] = await db
    .select({ url: mediaAssets.url })
    .from(users)
    .leftJoin(mediaAssets, eq(users.avatarMediaId, mediaAssets.id))
    .where(eq(users.id, userId))
    .limit(1);
  return row?.url ?? null;
}

export async function findUserFacePhotoUrl(
  userId: string,
  db: Db = getDb(),
): Promise<string | null> {
  const [row] = await db
    .select({ url: mediaAssets.url })
    .from(users)
    .leftJoin(mediaAssets, eq(users.facePhotoMediaId, mediaAssets.id))
    .where(eq(users.id, userId))
    .limit(1);
  return row?.url ?? null;
}

export async function setColaboratorPasswordByStaff(
  colaboratorId: string,
  password: string,
  db: Db = getDb(),
): Promise<void> {
  await updateUserAccount({ id: colaboratorId, password }, db);
}

export async function changeUserPassword(
  input: { id: string; currentPassword: string; newPassword: string },
  db: Db = getDb(),
): Promise<"ok" | "invalidCurrent" | "notFound"> {
  const [user] = await db
    .select({
      id: users.id,
      passwordHash: users.passwordHash,
    })
    .from(users)
    .where(eq(users.id, input.id))
    .limit(1);
  if (!user) return "notFound";
  const ok = await verifyPassword(input.currentPassword, user.passwordHash);
  if (!ok) return "invalidCurrent";
  await updateUserAccount(
    { id: input.id, password: input.newPassword },
    db,
  );
  return "ok";
}

export async function updateUserAccount(
  input: UpdateUserAccountInput,
  db: Db = getDb(),
): Promise<UserRecord> {
  const patch: Partial<typeof users.$inferInsert> & { updatedAt: Date } = {
    updatedAt: new Date(),
  };
  if (input.name !== undefined) patch.name = input.name.trim();
  if (input.username !== undefined) patch.username = input.username.trim();
  if (input.email !== undefined) patch.email = input.email;
  if (input.code !== undefined) patch.code = input.code;
  if (input.role !== undefined) patch.role = input.role;
  if (input.greetingGender !== undefined) {
    patch.greetingGender = toDbGreetingGender(input.greetingGender ?? "neutral");
  }
  if (input.blocked !== undefined) patch.blocked = input.blocked;
  if (input.password) {
    patch.passwordHash = await hashPassword(input.password);
  }

  const [row] = await db
    .update(users)
    .set(patch)
    .where(eq(users.id, input.id))
    .returning(USER_COLUMNS);
  if (!row) throw new Error("userNotFound");
  return mapUserRow(row);
}

export async function findUserByUsername(
  username: string,
  db: Db = getDb(),
): Promise<(UserRecord & { passwordHash: string }) | null> {
  const [row] = await db
    .select({
      ...USER_COLUMNS,
      passwordHash: users.passwordHash,
    })
    .from(users)
    .where(eq(users.username, username.trim()))
    .limit(1);
  if (!row) return null;
  const { passwordHash, ...rest } = row;
  return { ...mapUserRow(rest), passwordHash };
}

export async function findUserById(
  id: string,
  db: Db = getDb(),
): Promise<UserRecord | null> {
  const [row] = await db
    .select(USER_COLUMNS)
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  return row ? mapUserRow(row) : null;
}

export async function authenticateUser(
  username: string,
  password: string,
  db: Db = getDb(),
): Promise<UserRecord | null> {
  const user = await findUserByUsername(username, db);
  if (!user || user.blocked || !user.active) return null;
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return null;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- omit hash from auth result
  const { passwordHash, ...safe } = user;
  return safe;
}

/**
 * App login by numeric code + password (admin/manager/leader/colaborator).
 * Unlike kiosk identify, this is not limited to colaborator.
 */
export async function authenticateUserByCode(
  code: number,
  password: string,
  db: Db = getDb(),
): Promise<UserRecord | null> {
  const rows = await db
    .select({
      ...USER_COLUMNS,
      passwordHash: users.passwordHash,
    })
    .from(users)
    .where(
      and(eq(users.code, code), eq(users.active, true), eq(users.blocked, false)),
    );

  for (const row of rows) {
    const mapped = mapUserRow(row);
    if (!canEstablishAppSession(mapped.role, mapped.blocked)) continue;
    const ok = await verifyPassword(password, row.passwordHash);
    if (!ok) continue;
    return mapped;
  }
  return null;
}

export async function authenticateUserByTag(
  userTag: string,
  db: Db = getDb(),
): Promise<UserRecord | null> {
  const tag = userTag.trim();
  if (!tag) return null;
  const [row] = await db
    .select({
      ...USER_COLUMNS,
      passwordHash: users.passwordHash,
    })
    .from(users)
    .where(
      and(
        eq(users.userTag, tag),
        eq(users.active, true),
        eq(users.blocked, false),
      ),
    )
    .limit(1);
  if (!row) return null;
  const mapped = mapUserRow(row);
  if (!canEstablishAppSession(mapped.role, mapped.blocked)) return null;
  return mapped;
}

export async function deactivateUser(
  id: string,
  reasonForDeactivation: string,
  db: Db = getDb(),
): Promise<void> {
  await db
    .update(users)
    .set({
      active: false,
      blocked: true,
      reasonForDeactivation,
      updatedAt: new Date(),
    })
    .where(and(eq(users.id, id), eq(users.active, true)));
}

export async function setUserTag(
  id: string,
  userTag: string,
  db: Db = getDb(),
): Promise<void> {
  await db
    .update(users)
    .set({ userTag, updatedAt: new Date() })
    .where(eq(users.id, id));
}

export async function findUserIdByTag(
  userTag: string,
  db: Db = getDb(),
): Promise<string | null> {
  const [row] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.userTag, userTag))
    .limit(1);
  return row?.id ?? null;
}
