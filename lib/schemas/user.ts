import { z } from "zod";

export const USER_ROLES = [
  "admin",
  "manager",
  "leader",
  "colaborator",
  "kiosk",
] as const;

export const userFormSchema = z.object({
  name: z.string().min(1),
  username: z.string().min(3),
  password: z
    .string()
    .optional()
    .refine((value) => !value || value.length >= 6),
  code: z.number().int().min(0),
  roleType: z.enum(USER_ROLES),
});

export type UserFormInput = z.infer<typeof userFormSchema>;
