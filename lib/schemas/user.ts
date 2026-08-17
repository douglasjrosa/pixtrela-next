import { z } from "zod";

import {
  isUserCodeAvailable,
  type UserCodeOwner,
} from "@/lib/business/user-code";
import {
  isUserEmailAvailable,
  type UserEmailOwner,
} from "@/lib/business/user-email";
import {
  isUserLoginAvailable,
  type UserLoginOwner,
} from "@/lib/business/user-login";
import { userEmailFieldSchema } from "@/lib/schemas/email";

export const USER_ROLES = [
  "admin",
  "manager",
  "leader",
  "colaborator",
  "kiosk",
] as const;

export const GREETING_GENDERS = ["masculine", "feminine"] as const;

export const USER_CODE_NOT_UNIQUE_KEY = "codeNotUnique";
export const USER_LOGIN_NOT_UNIQUE_KEY = "loginNotUnique";
export const USER_EMAIL_NOT_UNIQUE_KEY = "emailNotUnique";

const optionalPasswordSchema = z
  .string()
  .optional()
  .refine((value) => !value || value.length >= 6);

const optionalUserCodeSchema = z.number().int().min(0).nullable();

export function buildUserFormSchema(options?: { requirePassword?: boolean }) {
  return z.object({
    name: z.string().min(1),
    username: z.string().min(3),
    email: userEmailFieldSchema,
    password: options?.requirePassword
      ? z.string().min(6)
      : optionalPasswordSchema,
    code: optionalUserCodeSchema,
    roleType: z.enum(USER_ROLES),
    greetingGender: z.enum(GREETING_GENDERS).optional().nullable(),
  });
}

export const userFormSchema = buildUserFormSchema();

export type UserFormOwner = UserCodeOwner & UserLoginOwner & UserEmailOwner;

export function createUserFormSchema(
  existingUsers: UserFormOwner[],
  excludeDocumentId?: string,
  options?: { requirePassword?: boolean },
) {
  return buildUserFormSchema(options).superRefine((data, ctx) => {
    if (
      data.code != null &&
      !isUserCodeAvailable(data.code, existingUsers, excludeDocumentId)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: USER_CODE_NOT_UNIQUE_KEY,
        path: ["code"],
      });
    }

    if (!isUserLoginAvailable(data.username, existingUsers, excludeDocumentId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: USER_LOGIN_NOT_UNIQUE_KEY,
        path: ["username"],
      });
    }

    if (!isUserEmailAvailable(data.email, existingUsers, excludeDocumentId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: USER_EMAIL_NOT_UNIQUE_KEY,
        path: ["email"],
      });
    }
  });
}

export type UserFormInput = z.infer<typeof userFormSchema>;
