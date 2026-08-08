import { z } from "zod";

const MIN_PASSWORD_LENGTH = 6;
const MIN_NAME_LENGTH = 1;
const MIN_EMAIL_LENGTH = 6;
const BR_MOBILE_NATIONAL_LENGTH = 11;
const BR_COUNTRY_CODE = "55";
const BR_MOBILE_NINTH_DIGIT = "9";

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

/** Normalize to 11-digit Brazilian mobile (DDD + 9xxxxxxxx). */
export function normalizeBrMobilePhone(value: string): string | null {
  const digits = digitsOnly(value);
  const national =
    digits.startsWith(BR_COUNTRY_CODE) &&
    digits.length === BR_MOBILE_NATIONAL_LENGTH + BR_COUNTRY_CODE.length
      ? digits.slice(BR_COUNTRY_CODE.length)
      : digits;

  if (national.length !== BR_MOBILE_NATIONAL_LENGTH) return null;
  if (national[2] !== BR_MOBILE_NINTH_DIGIT) return null;
  return national;
}

const brMobilePhoneSchema = z
  .string()
  .trim()
  .min(1)
  .refine((value) => normalizeBrMobilePhone(value) !== null, {
    message: "invalidPhone",
  })
  .transform((value) => normalizeBrMobilePhone(value)!);

export const changeOwnPasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    password: z.string().min(MIN_PASSWORD_LENGTH),
    passwordConfirmation: z.string().min(MIN_PASSWORD_LENGTH),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: "passwordMismatch",
    path: ["passwordConfirmation"],
  })
  .refine((data) => data.currentPassword !== data.password, {
    message: "passwordUnchanged",
    path: ["password"],
  });

export type ChangeOwnPasswordInput = z.infer<typeof changeOwnPasswordSchema>;

export const updateOwnPersonalSchema = z.object({
  name: z.string().trim().min(MIN_NAME_LENGTH),
  lastName: z.string().trim().min(MIN_NAME_LENGTH),
  email: z
    .string()
    .trim()
    .min(MIN_EMAIL_LENGTH)
    .email({ message: "invalidEmail" })
    .transform((value) => value.toLowerCase()),
  phone: brMobilePhoneSchema,
});

export type UpdateOwnPersonalInput = z.infer<typeof updateOwnPersonalSchema>;
