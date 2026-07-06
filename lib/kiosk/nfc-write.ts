import { buildKioskColaboratorUrl } from "./kiosk-link";

export type NfcWriteErrorCode =
  | "unsupported"
  | "permissionDenied"
  | "tagLost"
  | "writeFailed";

export class NfcWriteError extends Error {
  readonly code: NfcWriteErrorCode;

  constructor(code: NfcWriteErrorCode, message?: string) {
    super(message ?? code);
    this.code = code;
  }
}

export function isNfcWriteSupported(): boolean {
  return typeof window !== "undefined" && "NDEFWriter" in window;
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

export async function writeUrlToNfcTag(url: string): Promise<void> {
  if (!isNfcWriteSupported()) {
    throw new NfcWriteError("unsupported");
  }

  const Writer = window.NDEFWriter;
  if (!Writer) {
    throw new NfcWriteError("unsupported");
  }

  try {
    const writer = new Writer();
    await writer.write({
      records: [{ recordType: "url", data: url }],
    });
  } catch (error) {
    throw new NfcWriteError(mapNfcWriteError(error));
  }
}

export async function writeKioskColaboratorLinkToNfc(
  documentId: string,
  origin: string,
): Promise<void> {
  const url = buildKioskColaboratorUrl(documentId, origin);
  await writeUrlToNfcTag(url);
}

declare global {
  interface Window {
    NDEFWriter?: new () => {
      write: (message: {
        records: Array<{ recordType: string; data: string }>;
      }) => Promise<void>;
    };
  }
}
