import { USER_PASSWORD_MIN_LENGTH } from "@/lib/schemas/user";

export function resolveInitialUserPassword(input: {
  password?: string;
  code: number | null;
  username: string;
}): string {
  const trimmed = input.password?.trim();
  if (trimmed && trimmed.length >= USER_PASSWORD_MIN_LENGTH) {
    return trimmed;
  }
  if (input.code != null) {
    return String(input.code);
  }
  if (input.username.length >= USER_PASSWORD_MIN_LENGTH) {
    return input.username;
  }
  throw new Error("initialPasswordUnavailable");
}
