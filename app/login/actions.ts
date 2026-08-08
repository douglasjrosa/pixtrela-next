"use server";

import { FACE_DESCRIPTOR_LENGTH } from "@/lib/kiosk/face/face-match-constants";
import {
  loginByCodeSchema,
  loginByFaceConfirmSchema,
  loginByFaceSchema,
  loginByTagSchema,
} from "@/lib/schemas/auth-identify";
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

function resolveCandidateMedia(candidate: AuthFaceCandidate): AuthFaceCandidate {
  return {
    ...candidate,
    avatarUrl: resolveStrapiMediaUrl(candidate.avatarUrl),
    facePhotoUrl: resolveStrapiMediaUrl(candidate.facePhotoUrl),
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

export async function loginByCode(
  code: number,
  password: string,
): Promise<AuthLoginSuccess | AuthLoginFailure> {
  const parsed = loginByCodeSchema.safeParse({ code, password });
  if (!parsed.success) {
    return { ok: false, error: "invalidCredentials" };
  }

  const data = await postAuthIdentify<{
    jwt: string;
    user: AuthLoginUser;
    welcome?: AuthWelcomeProfile | null;
  }>("/auth/login-by-code", parsed.data);
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

export async function loginByTag(
  rawTag: string,
): Promise<AuthLoginSuccess | AuthLoginFailure> {
  const parsed = loginByTagSchema.safeParse({ userTag: rawTag });
  if (!parsed.success) {
    return { ok: false, error: "invalidCredentials" };
  }

  const data = await postAuthIdentify<{
    jwt: string;
    user: AuthLoginUser;
    welcome?: AuthWelcomeProfile | null;
  }>("/auth/login-by-tag", { userTag: parsed.data.userTag });
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

  const data = await postAuthIdentify<{
    status: "match" | "ambiguous" | "none";
    jwt?: string;
    user?: AuthLoginUser;
    match?: AuthFaceCandidate;
    candidates?: AuthFaceCandidate[];
  }>("/auth/login-by-face", { descriptor: parsed.data.descriptor });

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
        .map(resolveCandidateMedia),
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

  const data = await postAuthIdentify<{
    status: "match";
    jwt: string;
    user: AuthLoginUser;
    match: AuthFaceCandidate;
  }>("/auth/login-by-face-confirm", parsed.data);

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
