export const NFC_WRITE_COOLDOWN_MS = 5000;

let cooldownEndsAt = 0;

export function startNfcWriteCooldown(
  durationMs: number = NFC_WRITE_COOLDOWN_MS,
): void {
  cooldownEndsAt = Date.now() + durationMs;
}

export function getNfcWriteCooldownRemainingMs(): number {
  const remaining = cooldownEndsAt - Date.now();
  return remaining > 0 ? remaining : 0;
}

export function isNfcWriteOnCooldown(): boolean {
  return getNfcWriteCooldownRemainingMs() > 0;
}

export function clearNfcWriteCooldown(): void {
  cooldownEndsAt = 0;
}

export async function waitForNfcWriteCooldown(): Promise<void> {
  const remaining = getNfcWriteCooldownRemainingMs();
  if (remaining <= 0) return;
  await new Promise<void>((resolve) => {
    setTimeout(resolve, remaining);
  });
}
