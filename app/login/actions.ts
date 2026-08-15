"use server";

import { FACE_DESCRIPTOR_LENGTH } from "@/lib/kiosk/face/face-match-constants";
import { issueLoginTicket } from "@/lib/auth/login-ticket";
import {
  identifyAppUsersByFace,
  verifyUserFaceMatch,
} from "@/lib/repos/kiosk";
import { findUserById } from "@/lib/repos/users";
import { toBrowserMediaUrl } from "@/lib/media/browser-media-url";
import {
  authenticateUserByCode,
  authenticateUserByTag,
  findUserAvatarUrl,
  type GreetingGender,
  type UserRecord,
} from "@/lib/repos/users";
import {
  loginByCodeSchema,
  loginByFaceConfirmSchema,
  loginByFaceSchema,
  loginByTagSchema,
} from "@/lib/schemas/auth-identify";

export type AuthLoginUser = {
  id: number;
  documentId: string;
  username: string;
  email: string | null;
  name: string;
  roleType: string;
};

export type AuthWelcomeProfile = {
  name: string;
  greetingGender: "masculine" | "feminine" | null;
  avatarUrl: string | null;
  facePhotoUrl: string | null;
};

export type AuthLoginSuccess = {
  ok: true;
  jwt: string;
  loginTicket?: string;
  user: AuthLoginUser;
  welcome: AuthWelcomeProfile | null;
};

export type AuthLoginFailure = {
  ok: false;
  error: "invalidCredentials";
};

export type AuthFaceCandidate = {
  documentId: string;
  name: string;
  greetingGender: "masculine" | "feminine" | null;
  avatarUrl: string | null;
  facePhotoUrl: string | null;
  faceVector?: number[];
};

export type AuthFaceLoginResult =
  | (AuthLoginSuccess & {
      status: "match";
      match: AuthFaceCandidate;
    })
  | {
      ok: true;
      status: "ambiguous";
      candidates: AuthFaceCandidate[];
    }
  | { ok: true; status: "none" }
  | AuthLoginFailure;

function toWelcomeGender(
  gender: GreetingGender,
): "masculine" | "feminine" | null {
  if (gender === "masculine" || gender === "feminine") return gender;
  return null;
}

function mapDrizzleUser(user: UserRecord): AuthLoginUser {
  return {
    id: 0,
    documentId: user.id,
    username: user.username,
    email: user.email,
    name: user.name,
    roleType: user.role,
  };
}

async function welcomeFromDrizzle(
  user: UserRecord,
): Promise<AuthWelcomeProfile> {
  const avatarUrl = await findUserAvatarUrl(user.id);
  return {
    name: user.name,
    greetingGender: toWelcomeGender(user.greetingGender),
    avatarUrl: avatarUrl ? toBrowserMediaUrl(avatarUrl) : null,
    facePhotoUrl: null,
  };
}

function resolveCandidateMedia(candidate: AuthFaceCandidate): AuthFaceCandidate {
  return {
    ...candidate,
    avatarUrl: toBrowserMediaUrl(candidate.avatarUrl),
    facePhotoUrl: toBrowserMediaUrl(candidate.facePhotoUrl),
  };
}

export async function loginByCode(
  code: number,
  password: string,
): Promise<AuthLoginSuccess | AuthLoginFailure> {
  const parsed = loginByCodeSchema.safeParse({ code, password });
  if (!parsed.success) {
    return { ok: false, error: "invalidCredentials" };
  }

  const user = await authenticateUserByCode(parsed.data.code, parsed.data.password);
  if (!user) {
    return { ok: false, error: "invalidCredentials" };
  }
  return {
    ok: true,
    jwt: "",
    loginTicket: issueLoginTicket(user.id),
    user: mapDrizzleUser(user),
    welcome: await welcomeFromDrizzle(user),
  };
}

export async function loginByTag(
  rawTag: string,
): Promise<AuthLoginSuccess | AuthLoginFailure> {
  const parsed = loginByTagSchema.safeParse({ userTag: rawTag });
  if (!parsed.success) {
    return { ok: false, error: "invalidCredentials" };
  }

  const user = await authenticateUserByTag(parsed.data.userTag);
  if (!user) {
    return { ok: false, error: "invalidCredentials" };
  }
  return {
    ok: true,
    jwt: "",
    loginTicket: issueLoginTicket(user.id),
    user: mapDrizzleUser(user),
    welcome: await welcomeFromDrizzle(user),
  };
}

export async function loginByFace(
  descriptor: number[],
): Promise<AuthFaceLoginResult> {
  const parsed = loginByFaceSchema.safeParse({ descriptor });
  if (!parsed.success) {
    return { ok: false, error: "invalidCredentials" };
  }

  if (
    parsed.data.descriptor.length !== FACE_DESCRIPTOR_LENGTH ||
    parsed.data.descriptor.some(
      (value) => typeof value !== "number" || !Number.isFinite(value),
    )
  ) {
    return { ok: false, error: "invalidCredentials" };
  }

  const outcome = await identifyAppUsersByFace(parsed.data.descriptor);
  if (outcome.status === "match") {
    const user = await findUserById(outcome.match.documentId);
    if (!user) {
      return { ok: false, error: "invalidCredentials" };
    }
    const match = resolveCandidateMedia(outcome.match);
    return {
      ok: true,
      status: "match",
      jwt: "",
      loginTicket: issueLoginTicket(user.id),
      user: mapDrizzleUser(user),
      match,
      welcome: await welcomeFromDrizzle(user),
    };
  }

  if (outcome.status === "ambiguous") {
    return {
      ok: true,
      status: "ambiguous",
      candidates: outcome.candidates.map((row) => resolveCandidateMedia(row)),
    };
  }

  return { ok: true, status: "none" };
}

export async function loginByFaceConfirm(
  documentId: string,
  descriptor: number[],
): Promise<AuthFaceLoginResult> {
  const parsed = loginByFaceConfirmSchema.safeParse({ documentId, descriptor });
  if (!parsed.success) {
    return { ok: false, error: "invalidCredentials" };
  }

  const ok = await verifyUserFaceMatch(documentId, descriptor);
  if (!ok) {
    return { ok: false, error: "invalidCredentials" };
  }
  const user = await findUserById(documentId);
  if (!user) {
    return { ok: false, error: "invalidCredentials" };
  }
  const match = resolveCandidateMedia({
    documentId: user.id,
    name: user.name,
    greetingGender: toWelcomeGender(user.greetingGender),
    avatarUrl: null,
    facePhotoUrl: null,
  });
  return {
    ok: true,
    status: "match",
    jwt: "",
    loginTicket: issueLoginTicket(user.id),
    user: mapDrizzleUser(user),
    match,
    welcome: await welcomeFromDrizzle(user),
  };
}
