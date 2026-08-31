export const PASSWORD_CHAR_REVEAL_MS = 1000;

export const PASSWORD_MASK_CHAR = "•";

export type PasswordRevealState = {
  value: string;
  visibleUntil: number[];
};

export function createPasswordRevealState(value = ""): PasswordRevealState {
  return { value, visibleUntil: [] };
}

function maskCharAt(
  visibleUntil: number[],
  index: number,
  now: number,
): void {
  if (index >= 0 && index < visibleUntil.length) {
    visibleUntil[index] = now;
  }
}

function maskPreviousChar(visibleUntil: number[], now: number): void {
  maskCharAt(visibleUntil, visibleUntil.length - 1, now);
}

export function appendPasswordChars(
  state: PasswordRevealState,
  chars: string,
  now: number,
  revealMs = PASSWORD_CHAR_REVEAL_MS,
): PasswordRevealState {
  return insertPasswordCharsAt(state, state.value.length, chars, now, revealMs);
}

export function deletePasswordRange(
  state: PasswordRevealState,
  start: number,
  end: number,
): PasswordRevealState {
  const safeStart = Math.max(0, Math.min(start, state.value.length));
  const safeEnd = Math.max(safeStart, Math.min(end, state.value.length));

  return {
    value: state.value.slice(0, safeStart) + state.value.slice(safeEnd),
    visibleUntil: [
      ...state.visibleUntil.slice(0, safeStart),
      ...state.visibleUntil.slice(safeEnd),
    ],
  };
}

export function insertPasswordCharsAt(
  state: PasswordRevealState,
  index: number,
  chars: string,
  now: number,
  revealMs = PASSWORD_CHAR_REVEAL_MS,
): PasswordRevealState {
  if (chars.length === 0) {
    return state;
  }

  const safeIndex = Math.max(0, Math.min(index, state.value.length));
  const visibleUntil = state.visibleUntil.slice(0, safeIndex);
  let value = state.value.slice(0, safeIndex);

  for (const char of chars) {
    maskPreviousChar(visibleUntil, now);
    value += char;
    visibleUntil.push(now + revealMs);
  }

  const tailValue = state.value.slice(safeIndex);
  const tailVisible = state.visibleUntil
    .slice(safeIndex)
    .map(() => now);

  return {
    value: value + tailValue,
    visibleUntil: [...visibleUntil, ...tailVisible],
  };
}

export function replacePasswordRange(
  state: PasswordRevealState,
  start: number,
  end: number,
  chars: string,
  now: number,
  revealMs = PASSWORD_CHAR_REVEAL_MS,
): PasswordRevealState {
  const cleared = deletePasswordRange(state, start, end);
  return insertPasswordCharsAt(cleared, start, chars, now, revealMs);
}

export function removeLastPasswordChar(
  state: PasswordRevealState,
  now: number = Date.now(),
  revealMs = PASSWORD_CHAR_REVEAL_MS,
): PasswordRevealState {
  if (state.value.length === 0) {
    return state;
  }

  const next = deletePasswordRange(
    state,
    state.value.length - 1,
    state.value.length,
  );

  if (next.value.length === 0) {
    return next;
  }

  const visibleUntil = next.visibleUntil.slice();
  visibleUntil[visibleUntil.length - 1] = now + revealMs;

  return { ...next, visibleUntil };
}

export function buildPasswordDisplay(
  state: PasswordRevealState,
  showAll: boolean,
  now: number,
  maskChar = PASSWORD_MASK_CHAR,
): string {
  if (showAll) {
    return state.value;
  }

  return state.value
    .split("")
    .map((char, index) =>
      now < (state.visibleUntil[index] ?? 0) ? char : maskChar,
    )
    .join("");
}

export function nextPasswordMaskTickMs(
  state: PasswordRevealState,
  now: number,
): number | null {
  const pending = state.visibleUntil.filter((until) => until > now);
  if (pending.length === 0) {
    return null;
  }

  return Math.min(...pending) - now + 1;
}
