export const NFC_COOLDOWN_MS = 5000;

let cooldownEndsAt = 0;

export function startNfcCooldown(durationMs: number = NFC_COOLDOWN_MS): void {
  cooldownEndsAt = Date.now() + durationMs;
}

export function getNfcCooldownRemainingMs(): number {
  const remaining = cooldownEndsAt - Date.now();
  return remaining > 0 ? remaining : 0;
}

export function isNfcOnCooldown(): boolean {
  return getNfcCooldownRemainingMs() > 0;
}

export function clearNfcCooldown(): void {
  cooldownEndsAt = 0;
}

export async function waitForNfcCooldown(): Promise<void> {
  const remaining = getNfcCooldownRemainingMs();
  if (remaining <= 0) return;
  await new Promise<void>((resolve) => {
    setTimeout(resolve, remaining);
  });
}
