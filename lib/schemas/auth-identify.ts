import { z } from "zod";

import { FACE_DESCRIPTOR_LENGTH } from "@/lib/kiosk/face/face-match-constants";
import { MIN_USER_TAG_LENGTH } from "@/lib/kiosk/user-tag";

export const loginByCodeSchema = z.object({
  code: z.coerce.number().int().nonnegative(),
  password: z.string().min(6),
});

export const loginByTagSchema = z.object({
  userTag: z
    .string()
    .trim()
    .min(MIN_USER_TAG_LENGTH)
    .transform((value) => value.toUpperCase().replace(/[:\-\s]/g, ""))
    .refine((value) => value.length >= MIN_USER_TAG_LENGTH),
});

export const loginByFaceSchema = z.object({
  descriptor: z
    .array(z.number().finite())
    .length(FACE_DESCRIPTOR_LENGTH),
});

export const loginByFaceConfirmSchema = z.object({
  documentId: z.string().min(1),
  descriptor: z
    .array(z.number().finite())
    .length(FACE_DESCRIPTOR_LENGTH),
});

/** Credentials path that establishes a session from a Strapi JWT. */
export const jwtCredentialSchema = z.object({
  jwt: z.string().min(1),
});

/** Credentials path for Drizzle identify (code/tag/face) without Strapi JWT. */
export const loginTicketCredentialSchema = z.object({
  loginTicket: z.string().min(1),
});