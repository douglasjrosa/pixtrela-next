import { buildKioskColaboratorUrl } from "./kiosk-link";

export type NfcWriteErrorCode =
  | "unsupported"
  | "permissionDenied"
  | "tagLost"
  | "writeFailed";

export type NfcDiagnosticStep = {
  step: string;
  at: string;
  data?: Record<string, unknown>;
};

export type NfcDiagnostics = {
  at: string;
  isSecureContext: boolean;
  protocol: string;
  origin: string;
  hasNdefReader: boolean;
  hasNdefWriter: boolean;
  isWriteSupported: boolean;
  displayMode: string;
  visibilityState: string;
  userAgent: string;
  permissionState: string;
};

export class NfcWriteError extends Error {
  readonly code: NfcWriteErrorCode;

  constructor(code: NfcWriteErrorCode, message?: string) {
    super(message ?? code);
    this.code = code;
  }
}

export function isNfcWriteSupported(): boolean {
  if (typeof window === "undefined") return false;
  return "NDEFReader" in window || "NDEFWriter" in window;
}

export async function collectNfcDiagnostics(): Promise<NfcDiagnostics> {
  if (typeof window === "undefined") {
    return {
      at: new Date().toISOString(),
      isSecureContext: false,
      protocol: "ssr",
      origin: "",
      hasNdefReader: false,
      hasNdefWriter: false,
      isWriteSupported: false,
      displayMode: "unknown",
      visibilityState: "unknown",
      userAgent: "",
      permissionState: "unavailable",
    };
  }

  let permissionState = "unavailable";
  try {
    const status = await navigator.permissions.query({
      name: "nfc" as PermissionName,
    });
    permissionState = status.state;
  } catch {
    permissionState = "query-failed";
  }

  return {
    at: new Date().toISOString(),
    isSecureContext: window.isSecureContext,
    protocol: window.location.protocol,
    origin: window.location.origin,
    hasNdefReader: "NDEFReader" in window,
    hasNdefWriter: "NDEFWriter" in window,
    isWriteSupported: isNfcWriteSupported(),
    displayMode:
      typeof window.matchMedia === "function" &&
      window.matchMedia("(display-mode: standalone)").matches
        ? "standalone"
        : "browser",
    visibilityState: document.visibilityState,
    userAgent: navigator.userAgent,
    permissionState,
  };
}

export function mapNfcWriteError(error: unknown): NfcWriteErrorCode {
  if (error instanceof DOMException) {
    if (error.name === "NotSupportedError") return "unsupported";
    if (error.name === "NotAllowedError") return "permissionDenied";
    if (error.name === "NetworkError") return "tagLost";
  }
  if (error instanceof NfcWriteError) {
    return error.code;
  }
  return "writeFailed";
}

function createNfcWriter(): {
  write: (message: {
    records: Array<{ recordType: string; data: string }>;
  }) => Promise<void>;
  api: "NDEFReader" | "NDEFWriter";
} {
  if (typeof window === "undefined") {
    throw new NfcWriteError("unsupported");
  }

  if ("NDEFReader" in window && window.NDEFReader) {
    const reader = new window.NDEFReader();
    return {
      api: "NDEFReader",
      write: (message) => reader.write(message),
    };
  }

  if (window.NDEFWriter) {
    const writer = new window.NDEFWriter();
    return {
      api: "NDEFWriter",
      write: (message) => writer.write(message),
    };
  }

  throw new NfcWriteError("unsupported");
}

export async function writeUrlToNfcTag(url: string): Promise<{
  api: "NDEFReader" | "NDEFWriter";
}> {
  if (!isNfcWriteSupported()) {
    throw new NfcWriteError("unsupported");
  }

  try {
    const writer = createNfcWriter();
    await writer.write({
      records: [{ recordType: "url", data: url }],
    });
    return { api: writer.api };
  } catch (error) {
    throw new NfcWriteError(mapNfcWriteError(error));
  }
}

export async function writeKioskColaboratorLinkToNfc(
  documentId: string,
  origin: string,
): Promise<{ url: string; api: "NDEFReader" | "NDEFWriter" }> {
  const url = buildKioskColaboratorUrl(documentId, origin);
  const result = await writeUrlToNfcTag(url);
  return { url, ...result };
}

declare global {
  interface Window {
    NDEFReader?: new () => {
      write: (message: {
        records: Array<{ recordType: string; data: string }>;
      }) => Promise<void>;
    };
    NDEFWriter?: new () => {
      write: (message: {
        records: Array<{ recordType: string; data: string }>;
      }) => Promise<void>;
    };
  }
}
