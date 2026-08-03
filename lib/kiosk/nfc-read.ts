import {
  isNfcOnCooldown,
  NFC_COOLDOWN_MS,
  startNfcCooldown,
} from "./nfc-cooldown";
import { normalizeUserTag } from "./user-tag";

export type NfcReadErrorCode =
  | "unsupported"
  | "permissionDenied"
  | "tagLost"
  | "noSerial"
  | "cooldown"
  | "readFailed";

export class NfcReadError extends Error {
  readonly code: NfcReadErrorCode;

  constructor(code: NfcReadErrorCode, message?: string) {
    super(message ?? code);
    this.code = code;
  }
}

type NdefReadingEvent = {
  serialNumber?: string;
};

type NdefReaderInstance = {
  scan: (options?: { signal?: AbortSignal }) => Promise<void>;
  addEventListener: (
    type: "reading",
    listener: (event: NdefReadingEvent) => void,
  ) => void;
  removeEventListener: (
    type: "reading",
    listener: (event: NdefReadingEvent) => void,
  ) => void;
};

export function isNfcReadSupported(): boolean {
  if (typeof window === "undefined") return false;
  return "NDEFReader" in window;
}

export function mapNfcReadError(error: unknown): NfcReadErrorCode {
  if (error instanceof DOMException) {
    if (error.name === "NotSupportedError") return "unsupported";
    if (error.name === "NotAllowedError") return "permissionDenied";
    if (error.name === "NetworkError") return "tagLost";
    if (error.name === "AbortError") return "readFailed";
  }
  if (error instanceof NfcReadError) {
    return error.code;
  }
  return "readFailed";
}

/**
 * Starts a one-shot NFC scan and resolves with the first normalized serialNumber.
 * Caller should pass an AbortSignal to cancel (e.g. on unmount).
 */
export async function readNfcSerialNumberOnce(
  options: { signal?: AbortSignal; applyCooldown?: boolean } = {},
): Promise<string> {
  const { signal, applyCooldown = true } = options;

  if (!isNfcReadSupported()) {
    throw new NfcReadError("unsupported");
  }
  if (isNfcOnCooldown()) {
    throw new NfcReadError("cooldown");
  }
  if (!window.NDEFReader) {
    throw new NfcReadError("unsupported");
  }

  const reader = new window.NDEFReader() as NdefReaderInstance;

  return new Promise<string>((resolve, reject) => {
    let settled = false;

    const cleanup = () => {
      reader.removeEventListener("reading", onReading);
      signal?.removeEventListener("abort", onAbort);
    };

    const fail = (code: NfcReadErrorCode) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new NfcReadError(code));
    };

    const succeed = (userTag: string) => {
      if (settled) return;
      settled = true;
      cleanup();
      if (applyCooldown) {
        startNfcCooldown(NFC_COOLDOWN_MS);
      }
      resolve(userTag);
    };

    const onReading = (event: NdefReadingEvent) => {
      const userTag = normalizeUserTag(event.serialNumber ?? "");
      if (!userTag) {
        fail("noSerial");
        return;
      }
      succeed(userTag);
    };

    const onAbort = () => {
      fail("readFailed");
    };

    if (signal?.aborted) {
      fail("readFailed");
      return;
    }

    signal?.addEventListener("abort", onAbort);
    reader.addEventListener("reading", onReading);

    reader.scan({ signal }).catch((error: unknown) => {
      fail(mapNfcReadError(error));
    });
  });
}

/**
 * Starts a continuous NFC scan and invokes `onTag` for each normalized
 * serialNumber. Returns a stop function. Respects cooldown between tags when
 * `applyCooldown` is true (default).
 */
export function watchNfcSerialNumbers(options: {
  onTag: (userTag: string) => void;
  onError?: (code: NfcReadErrorCode) => void;
  signal?: AbortSignal;
  applyCooldown?: boolean;
}): { stop: () => void } {
  const { onTag, onError, signal, applyCooldown = true } = options;
  const controller = new AbortController();

  const onAbort = () => {
    controller.abort();
  };
  signal?.addEventListener("abort", onAbort);

  if (!isNfcReadSupported() || !window.NDEFReader) {
    onError?.("unsupported");
    return {
      stop: () => {
        signal?.removeEventListener("abort", onAbort);
        controller.abort();
      },
    };
  }

  const reader = new window.NDEFReader() as NdefReaderInstance;

  const onReading = (event: NdefReadingEvent) => {
    if (isNfcOnCooldown()) return;
    const userTag = normalizeUserTag(event.serialNumber ?? "");
    if (!userTag) {
      onError?.("noSerial");
      return;
    }
    if (applyCooldown) {
      startNfcCooldown(NFC_COOLDOWN_MS);
    }
    onTag(userTag);
  };

  reader.addEventListener("reading", onReading);
  reader.scan({ signal: controller.signal }).catch((error: unknown) => {
    if (controller.signal.aborted) return;
    onError?.(mapNfcReadError(error));
  });

  return {
    stop: () => {
      signal?.removeEventListener("abort", onAbort);
      reader.removeEventListener("reading", onReading);
      controller.abort();
    },
  };
}

declare global {
  interface Window {
    NDEFReader?: new () => NdefReaderInstance;
  }
}
