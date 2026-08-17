import { z } from "zod";

import { userEmailFieldSchema } from "@/lib/schemas/email";

const MIN_PASSWORD_LENGTH = 6;

export const requestPasswordResetSchema = z.object({
  email: userEmailFieldSchema,
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password: z.string().min(MIN_PASSWORD_LENGTH),
    passwordConfirmation: z.string().min(MIN_PASSWORD_LENGTH),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: "passwordMismatch",
    path: ["passwordConfirmation"],
  });

export type RequestPasswordResetInput = z.infer<
  typeof requestPasswordResetSchema
>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
