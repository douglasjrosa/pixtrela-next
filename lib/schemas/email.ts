import { z } from "zod";

const MIN_EMAIL_LENGTH = 6;

export const userEmailFieldSchema = z
  .string()
  .trim()
  .min(MIN_EMAIL_LENGTH)
  .email({ message: "invalidEmail" })
  .transform((value) => value.toLowerCase());
