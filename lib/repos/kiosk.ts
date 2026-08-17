import { and, eq, inArray } from "drizzle-orm";

import { mediaAssets, teamMembers, teams, users } from "@/drizzle/schema";
import type { KioskIdentifiedRole } from "@/lib/business/kiosk-identify-route";
import { canStaffSetColaboratorPassword } from "@/lib/business/kiosk-staff-colaborators";
import { canEstablishAppSession } from "@/lib/domain/auth-session";
import { getDb, type Db } from "@/lib/db/client";
import {
  normalizeFaceVector,
  rankFaceMatches,
  type FaceGalleryEntry,
} from "@/lib/kiosk/face/face-1n-rank";
import {
  faceDescriptorDistance,
  isFaceMatch,
} from "@/lib/kiosk/face/face-descriptor-distance";
import {
  findUserAvatarUrl,
  findUserById,
  findUserFacePhotoUrl,
  verifyPassword,
  type GreetingGender,
  type UserRole,
} from "@/lib/repos/users";

export type KioskIdentifyResult = {
  id: string;
  name: string;
  code: number | null;
  role: string;
};

export type KioskWelcomeProfile = {
  name: string;
  greetingGender: "masculine" | "feminine" | null;
  avatarUrl: string | null;
  facePhotoUrl: string | null;
};

export type KioskFaceCandidate = {
  documentId: string;
  name: string;
  greetingGender: "masculine" | "feminine" | null;
  avatarUrl: string | null;
  facePhotoUrl: string | null;
  faceVector?: number[];
};

export type KioskFaceIdentifyOutcome =
  | { status: "match"; match: KioskFaceCandidate }
  | { status: "ambiguous"; candidates: KioskFaceCandidate[] }
  | { status: "none" };

const KIOSK_IDENTIFIABLE_ROLES = new Set<UserRole>([
  "colaborator",
  "admin",
  "manager",
  "leader",
]);

function toWelcomeGender(
  gender: string | GreetingGender | "male" | "female" | "neutral" | null,
): "masculine" | "feminine" | null {
  if (gender === "masculine" || gender === "male") return "masculine";
  if (gender === "feminine" || gender === "female") return "feminine";
  return null;
}

function isKioskIdentifiableRole(role: string): role is KioskIdentifiedRole {
  return KIOSK_IDENTIFIABLE_ROLES.has(role as UserRole);
}

/**
 * Identifies a colaborator on a kiosk device by numeric code + password.
 * Does not create a colaborator session — returns identity only.
 */
export async function identifyColaboratorByCode(
  input: { code: number; password: string },
  db: Db = getDb(),
): Promise<KioskIdentifyResult | null> {
  const identified = await identifyUserAtKioskByCode(input, db);
  if (!identified || identified.role !== "colaborator") return null;
  return identified;
}

export async function identifyUserAtKioskByCode(
  input: { code: number; password: string },
  db: Db = getDb(),
): Promise<KioskIdentifyResult | null> {
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      code: users.code,
      role: users.role,
      passwordHash: users.passwordHash,
      active: users.active,
      blocked: users.blocked,
    })
    .from(users)
    .where(
      and(
        eq(users.code, input.code),
        eq(users.active, true),
        eq(users.blocked, false),
      ),
    );

  for (const user of rows) {
    if (!isKioskIdentifiableRole(user.role)) continue;
    const ok = await verifyPassword(input.password, user.passwordHash);
    if (!ok) continue;
    return {
      id: user.id,
      name: user.name,
      code: user.code ?? input.code,
      role: user.role,
    };
  }
  return null;
}

export async function identifyColaboratorByTag(
  userTag: string,
  db: Db = getDb(),
): Promise<KioskIdentifyResult | null> {
  const identified = await identifyUserAtKioskByTag(userTag, db);
  if (!identified || identified.role !== "colaborator") return null;
  return identified;
}

export async function identifyUserAtKioskByTag(
  userTag: string,
  db: Db = getDb(),
): Promise<KioskIdentifyResult | null> {
  const tag = userTag.trim();
  if (!tag) return null;
  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      code: users.code,
      role: users.role,
      active: users.active,
      blocked: users.blocked,
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
  if (!user || !isKioskIdentifiableRole(user.role)) return null;
  return {
    id: user.id,
    name: user.name,
    code: user.code,
    role: user.role,
  };
}

/** Cosine similarity for face vectors (pure helper used by identify). */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i]! * b[i]!;
    normA += a[i]! * a[i]!;
    normB += b[i]! * b[i]!;
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function identifyColaboratorByFace(
  probe: number[],
  db: Db = getDb(),
): Promise<KioskIdentifyResult | null> {
  const outcome = await identifyColaboratorsByFace(probe, db);
  if (outcome.status !== "match") return null;
  return {
    id: outcome.match.documentId,
    name: outcome.match.name,
    code: null,
    role: "colaborator",
  };
}

export async function loadKioskWelcomeProfile(
  userId: string,
  db: Db = getDb(),
): Promise<KioskWelcomeProfile | null> {
  const user = await findUserById(userId, db);
  if (!user?.name) return null;
  const avatarUrl = await findUserAvatarUrl(userId, db);
  const facePhotoUrl = await findUserFacePhotoUrl(userId, db);
  return {
    name: user.name,
    greetingGender: toWelcomeGender(user.greetingGender),
    avatarUrl,
    facePhotoUrl,
  };
}

async function loadFaceCandidateRows(
  roleFilter: "colaborator" | "app",
  db: Db,
): Promise<
  Array<{
    id: string;
    name: string;
    greetingGender: string | null;
    faceVector: unknown;
    avatarMediaId: string | null;
    facePhotoMediaId: string | null;
  }>
> {
  const roleClause =
    roleFilter === "colaborator"
      ? eq(users.role, "colaborator")
      : inArray(users.role, ["colaborator", "admin", "manager", "leader"]);

  return db
    .select({
      id: users.id,
      name: users.name,
      greetingGender: users.greetingGender,
      faceVector: users.faceVector,
      avatarMediaId: users.avatarMediaId,
      facePhotoMediaId: users.facePhotoMediaId,
    })
    .from(users)
    .where(and(roleClause, eq(users.active, true), eq(users.blocked, false)));
}

async function mapFaceCandidates(
  rows: Awaited<ReturnType<typeof loadFaceCandidateRows>>,
  includeFaceVector: boolean,
  db: Db,
): Promise<Map<string, KioskFaceCandidate>> {
  const mediaIds = [
    ...rows.map((row) => row.avatarMediaId),
    ...rows.map((row) => row.facePhotoMediaId),
  ].filter((id): id is string => Boolean(id));

  const mediaRows =
    mediaIds.length === 0
      ? []
      : await db
          .select({ id: mediaAssets.id, url: mediaAssets.url })
          .from(mediaAssets)
          .where(inArray(mediaAssets.id, mediaIds));
  const urlById = new Map(mediaRows.map((row) => [row.id, row.url]));

  const byId = new Map<string, KioskFaceCandidate>();
  for (const row of rows) {
    const vector = normalizeFaceVector(row.faceVector);
    byId.set(row.id, {
      documentId: row.id,
      name: row.name,
      greetingGender: toWelcomeGender(row.greetingGender),
      avatarUrl: row.avatarMediaId
        ? (urlById.get(row.avatarMediaId) ?? null)
        : null,
      facePhotoUrl: row.facePhotoMediaId
        ? (urlById.get(row.facePhotoMediaId) ?? null)
        : null,
      faceVector: includeFaceVector && vector ? vector : undefined,
    });
  }
  return byId;
}

export async function identifyColaboratorsByFace(
  probe: number[],
  db: Db = getDb(),
): Promise<KioskFaceIdentifyOutcome> {
  return runFaceIdentify1n(probe, "colaborator", db);
}

export async function identifyAppUsersByFace(
  probe: number[],
  db: Db = getDb(),
): Promise<KioskFaceIdentifyOutcome> {
  return runFaceIdentify1n(probe, "app", db);
}

async function runFaceIdentify1n(
  probe: number[],
  roleFilter: "colaborator" | "app",
  db: Db,
): Promise<KioskFaceIdentifyOutcome> {
  const rows = await loadFaceCandidateRows(roleFilter, db);
  const gallery: FaceGalleryEntry[] = [];
  for (const row of rows) {
    const vector = normalizeFaceVector(row.faceVector);
    if (!vector) continue;
    gallery.push({ documentId: row.id, faceVector: vector });
  }

  const ranked = rankFaceMatches(probe, gallery);
  const byId = await mapFaceCandidates(rows, true, db);

  if (ranked.status === "match") {
    const topId = ranked.ranked[0]?.documentId;
    const match = topId ? byId.get(topId) : undefined;
    if (!match) return { status: "none" };
    const { faceVector: _omit, ...safeMatch } = match;
    void _omit;
    return { status: "match", match: safeMatch };
  }

  if (ranked.status === "ambiguous") {
    const candidates = ranked.ranked
      .map((row) => byId.get(row.documentId))
      .filter((row): row is KioskFaceCandidate => Boolean(row?.faceVector));
    return { status: "ambiguous", candidates };
  }

  return { status: "none" };
}

export async function verifyUserFaceMatch(
  userId: string,
  probe: number[],
  db: Db = getDb(),
): Promise<boolean> {
  const [row] = await db
    .select({
      faceVector: users.faceVector,
      blocked: users.blocked,
      role: users.role,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!row || row.blocked || !canEstablishAppSession(row.role, row.blocked)) {
    return false;
  }
  const stored = normalizeFaceVector(row.faceVector);
  if (!stored) return false;
  return isFaceMatch(faceDescriptorDistance(probe, stored));
}

async function fetchLeaderTeamColaboratorIds(
  leaderUserId: string,
  db: Db,
): Promise<Set<string>> {
  const leaderTeams = await db
    .select({ id: teams.id })
    .from(teams)
    .where(and(eq(teams.leaderId, leaderUserId), eq(teams.active, true)));
  if (leaderTeams.length === 0) return new Set();

  const teamIds = leaderTeams.map((team) => team.id);
  const members = await db
    .select({ userId: teamMembers.userId })
    .from(teamMembers)
    .where(inArray(teamMembers.teamId, teamIds));

  return new Set(members.map((member) => member.userId));
}

export async function assertStaffCanManageColaborator(
  staffUserId: string,
  colaboratorId: string,
  db: Db = getDb(),
): Promise<void> {
  const staff = await findUserById(staffUserId, db);
  if (
    !staff ||
    staff.role === "colaborator" ||
    staff.role === "kiosk" ||
    staff.blocked ||
    !staff.active
  ) {
    throw new Error("forbidden");
  }

  const target = await findUserById(colaboratorId, db);
  if (
    !target ||
    target.role !== "colaborator" ||
    target.blocked ||
    !target.active
  ) {
    throw new Error("forbidden");
  }

  const leaderIds =
    staff.role === "leader"
      ? await fetchLeaderTeamColaboratorIds(staffUserId, db)
      : new Set<string>();

  const allowed = canStaffSetColaboratorPassword(
    staff.role as "admin" | "manager" | "leader",
    true,
    leaderIds,
    colaboratorId,
  );
  if (!allowed) throw new Error("forbidden");
}
