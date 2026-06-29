import { z } from "zod";

import {
  isUserCodeAvailable,
  type UserCodeOwner,
} from "@/lib/business/user-code";

export const USER_ROLES = [
  "admin",
  "manager",
  "leader",
  "colaborator",
  "kiosk",
] as const;

export const USER_CODE_NOT_UNIQUE_KEY = "codeNotUnique";

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

export function createUserFormSchema(
  existingUsers: UserCodeOwner[],
  excludeDocumentId?: string,
  options?: { requirePassword?: boolean },
) {
  return buildUserFormSchema(options).superRefine((data, ctx) => {
    if (isUserCodeAvailable(data.code, existingUsers, excludeDocumentId)) {
      return;
    }

    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: USER_CODE_NOT_UNIQUE_KEY,
      path: ["code"],
    });
  });
}

export type UserFormInput = z.infer<typeof userFormSchema>;
