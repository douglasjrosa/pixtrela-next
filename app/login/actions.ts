"use server";

import { FACE_DESCRIPTOR_LENGTH } from "@/lib/kiosk/face/face-match-constants";
import { issueLoginTicket } from "@/lib/auth/login-ticket";
import { isDrizzleBackend } from "@/lib/db/backend";
import {
  identifyAppUsersByFace,
  verifyUserFaceMatch,
} from "@/lib/repos/kiosk";
import { findUserById } from "@/lib/repos/users";
import { toBrowserMediaUrl } from "@/lib/strapi/browser-media-url";
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
import { isAuthStrapiFallbackEnabled } from "@/lib/strapi/migration-guard";
import { strapiFetch } from "@/lib/strapi";
import { resolveStrapiMediaUrl } from "@/lib/strapi/media-url";

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
  /** Present for Drizzle identify — establish Auth.js session without Strapi JWT. */
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

function resolveCandidateMedia(
  candidate: AuthFaceCandidate,
  drizzle = false,
): AuthFaceCandidate {
  const mapUrl = drizzle ? toBrowserMediaUrl : resolveStrapiMediaUrl;
  return {
    ...candidate,
    avatarUrl: mapUrl(candidate.avatarUrl),
    facePhotoUrl: mapUrl(candidate.facePhotoUrl),
  };
}

function resolveWelcome(
  welcome: AuthWelcomeProfile | null | undefined,
  fallback?: AuthFaceCandidate | AuthLoginUser | null,
): AuthWelcomeProfile | null {
  if (welcome?.name) {
    return {
      name: welcome.name,
      greetingGender: welcome.greetingGender ?? null,
      avatarUrl: resolveStrapiMediaUrl(welcome.avatarUrl),
      facePhotoUrl: resolveStrapiMediaUrl(welcome.facePhotoUrl),
    };
  }
  if (fallback && "name" in fallback && fallback.name) {
    return {
      name: fallback.name,
      greetingGender:
        "greetingGender" in fallback ? (fallback.greetingGender ?? null) : null,
      avatarUrl:
        "avatarUrl" in fallback
          ? resolveStrapiMediaUrl(fallback.avatarUrl ?? null)
          : null,
      facePhotoUrl:
        "facePhotoUrl" in fallback
          ? resolveStrapiMediaUrl(fallback.facePhotoUrl ?? null)
          : null,
    };
  }
  return null;
}

async function postAuthIdentify<T>(
  path: string,
  body: unknown,
): Promise<T | null> {
  try {
    return await strapiFetch<T>(
      path,
      {
        method: "POST",
        requireAuth: false,
        redirectOnUnauthorized: false,
        strapiCache: { noStore: true },
        body: JSON.stringify(body),
      },
    );
  } catch {
    return null;
  }
}

async function loginByCodeStrapi(
  data: { code: number; password: string },
): Promise<AuthLoginSuccess | AuthLoginFailure> {
  const response = await postAuthIdentify<{
    jwt: string;
    user: AuthLoginUser;
    welcome?: AuthWelcomeProfile | null;
  }>("/auth/login-by-code", data);
  if (!response?.jwt || !response.user?.documentId) {
    return { ok: false, error: "invalidCredentials" };
  }
  return {
    ok: true,
    jwt: response.jwt,
    user: response.user,
    welcome: resolveWelcome(response.welcome, response.user),
  };
}

async function loginByCodeDrizzle(
  data: { code: number; password: string },
): Promise<AuthLoginSuccess | AuthLoginFailure> {
  const user = await authenticateUserByCode(data.code, data.password);
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

export async function loginByCode(
  code: number,
  password: string,
): Promise<AuthLoginSuccess | AuthLoginFailure> {
  const parsed = loginByCodeSchema.safeParse({ code, password });
  if (!parsed.success) {
    return { ok: false, error: "invalidCredentials" };
  }

  if (!isDrizzleBackend()) {
    return loginByCodeStrapi(parsed.data);
  }

  if (isAuthStrapiFallbackEnabled()) {
    const strapiResult = await loginByCodeStrapi(parsed.data);
    if (strapiResult.ok) return strapiResult;
  }

  return loginByCodeDrizzle(parsed.data);
}

async function loginByTagStrapi(
  userTag: string,
): Promise<AuthLoginSuccess | AuthLoginFailure> {
  const data = await postAuthIdentify<{
    jwt: string;
    user: AuthLoginUser;
    welcome?: AuthWelcomeProfile | null;
  }>("/auth/login-by-tag", { userTag });
  if (!data?.jwt || !data.user?.documentId) {
    return { ok: false, error: "invalidCredentials" };
  }
  return {
    ok: true,
    jwt: data.jwt,
    user: data.user,
    welcome: resolveWelcome(data.welcome, data.user),
  };
}

async function loginByTagDrizzle(
  userTag: string,
): Promise<AuthLoginSuccess | AuthLoginFailure> {
  const user = await authenticateUserByTag(userTag);
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

  if (!isDrizzleBackend()) {
    return loginByTagStrapi(parsed.data.userTag);
  }

  if (isAuthStrapiFallbackEnabled()) {
    const strapiResult = await loginByTagStrapi(parsed.data.userTag);
    if (strapiResult.ok) return strapiResult;
  }

  return loginByTagDrizzle(parsed.data.userTag);
}

async function loginByFaceStrapi(
  descriptor: number[],
): Promise<AuthFaceLoginResult> {
  const data = await postAuthIdentify<{
    status: "match" | "ambiguous" | "none";
    jwt?: string;
    user?: AuthLoginUser;
    match?: AuthFaceCandidate;
    candidates?: AuthFaceCandidate[];
  }>("/auth/login-by-face", { descriptor });

  if (!data) {
    return { ok: false, error: "invalidCredentials" };
  }

  if (data.status === "match" && data.jwt && data.user && data.match) {
    const match = resolveCandidateMedia(data.match);
    return {
      ok: true,
      status: "match",
      jwt: data.jwt,
      user: data.user,
      match,
      welcome: resolveWelcome(null, match),
    };
  }

  if (data.status === "ambiguous" && Array.isArray(data.candidates)) {
    return {
      ok: true,
      status: "ambiguous",
      candidates: data.candidates
        .filter((row) => row.documentId && row.faceVector)
        .map((row) => resolveCandidateMedia(row)),
    };
  }

  return { ok: true, status: "none" };
}

async function loginByFaceDrizzle(
  descriptor: number[],
): Promise<AuthFaceLoginResult> {
  const outcome = await identifyAppUsersByFace(descriptor);
  if (outcome.status === "match") {
    const user = await findUserById(outcome.match.documentId);
    if (!user) {
      return { ok: false, error: "invalidCredentials" };
    }
    const match = resolveCandidateMedia(outcome.match, true);
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
      candidates: outcome.candidates.map((row) =>
        resolveCandidateMedia(row, true),
      ),
    };
  }

  return { ok: true, status: "none" };
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

  if (!isDrizzleBackend()) {
    return loginByFaceStrapi(parsed.data.descriptor);
  }

  if (isAuthStrapiFallbackEnabled()) {
    const strapiResult = await loginByFaceStrapi(parsed.data.descriptor);
    if (strapiResult.ok && strapiResult.status === "match") {
      return strapiResult;
    }
    if (
      strapiResult.ok &&
      (strapiResult.status === "ambiguous" || strapiResult.status === "none")
    ) {
      return strapiResult;
    }
  }

  return loginByFaceDrizzle(parsed.data.descriptor);
}

async function loginByFaceConfirmStrapi(
  documentId: string,
  descriptor: number[],
): Promise<AuthFaceLoginResult> {
  const data = await postAuthIdentify<{
    status: "match";
    jwt: string;
    user: AuthLoginUser;
    match: AuthFaceCandidate;
  }>("/auth/login-by-face-confirm", { documentId, descriptor });

  if (!data?.jwt || !data.user || !data.match) {
    return { ok: false, error: "invalidCredentials" };
  }

  const match = resolveCandidateMedia(data.match);
  return {
    ok: true,
    status: "match",
    jwt: data.jwt,
    user: data.user,
    match,
    welcome: resolveWelcome(null, match),
  };
}

async function loginByFaceConfirmDrizzle(
  documentId: string,
  descriptor: number[],
): Promise<AuthFaceLoginResult> {
  const ok = await verifyUserFaceMatch(documentId, descriptor);
  if (!ok) {
    return { ok: false, error: "invalidCredentials" };
  }
  const user = await findUserById(documentId);
  if (!user) {
    return { ok: false, error: "invalidCredentials" };
  }
  const match = resolveCandidateMedia(
    {
      documentId: user.id,
      name: user.name,
      greetingGender: toWelcomeGender(user.greetingGender),
      avatarUrl: null,
      facePhotoUrl: null,
    },
    true,
  );
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

export async function loginByFaceConfirm(
  documentId: string,
  descriptor: number[],
): Promise<AuthFaceLoginResult> {
  const parsed = loginByFaceConfirmSchema.safeParse({ documentId, descriptor });
  if (!parsed.success) {
    return { ok: false, error: "invalidCredentials" };
  }

  if (!isDrizzleBackend()) {
    return loginByFaceConfirmStrapi(
      parsed.data.documentId,
      parsed.data.descriptor,
    );
  }

  if (isAuthStrapiFallbackEnabled()) {
    const strapiResult = await loginByFaceConfirmStrapi(
      parsed.data.documentId,
      parsed.data.descriptor,
    );
    if (strapiResult.ok) return strapiResult;
  }

  return loginByFaceConfirmDrizzle(
    parsed.data.documentId,
    parsed.data.descriptor,
  );
}
