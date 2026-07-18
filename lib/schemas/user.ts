import { z } from "zod";

import {
  isUserCodeAvailable,
  type UserCodeOwner,
} from "@/lib/business/user-code";
import {
  isUserLoginAvailable,
  type UserLoginOwner,
} from "@/lib/business/user-login";

export const USER_ROLES = [
  "admin",
  "manager",
  "leader",
  "colaborator",
  "kiosk",
] as const;

export const USER_CODE_NOT_UNIQUE_KEY = "codeNotUnique";
export const USER_LOGIN_NOT_UNIQUE_KEY = "loginNotUnique";

const optionalPasswordSchema = z
  .string()
  .optional()
  .refine((value) => !value || value.length >= 6);

export function buildUserFormSchema(options?: { requirePassword?: boolean }) {
  return z.object({
    name: z.string().min(1),
    username: z.string().min(3),
    password: options?.requirePassword
      ? z.string().min(6)
      : optionalPasswordSchema,
    code: z.number().int().min(0),
    roleType: z.enum(USER_ROLES),
  });
}

export const userFormSchema = buildUserFormSchema();

export type UserFormOwner = UserCodeOwner & UserLoginOwner;

export function createUserFormSchema(
  existingUsers: UserFormOwner[],
  excludeDocumentId?: string,
  options?: { requirePassword?: boolean },
) {
  return buildUserFormSchema(options).superRefine((data, ctx) => {
    if (!isUserCodeAvailable(data.code, existingUsers, excludeDocumentId)) {
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
  });
}

export type UserFormInput = z.infer<typeof userFormSchema>;
