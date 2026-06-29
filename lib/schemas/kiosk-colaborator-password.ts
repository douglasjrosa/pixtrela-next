import { z } from "zod";

export const kioskColaboratorPasswordSchema = z
  .object({
    password: z.string().min(6),
    confirmPassword: z.string().min(6),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "passwordMismatch",
    path: ["confirmPassword"],
  });

export type KioskColaboratorPasswordInput = z.infer<
  typeof kioskColaboratorPasswordSchema
>;
