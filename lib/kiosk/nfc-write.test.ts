import { describe, expect, it, vi, afterEach } from "vitest";

import {
  isNfcWriteSupported,
  mapNfcWriteError,
  writeKioskColaboratorLinkToNfc,
  writeUrlToNfcTag,
} from "./nfc-write";

describe("isNfcWriteSupported", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns true when NDEFWriter exists on window", () => {
    vi.stubGlobal("NDEFWriter", class NDEFWriter {});
    expect(isNfcWriteSupported()).toBe(true);
  });

  it("returns false when NDEFWriter is missing", () => {
    vi.stubGlobal("window", {});
    expect(isNfcWriteSupported()).toBe(false);
  });
});

describe("mapNfcWriteError", () => {
  it("maps NotSupportedError to unsupported", () => {
    const error = new DOMException("unsupported", "NotSupportedError");
    expect(mapNfcWriteError(error)).toBe("unsupported");
  });

  it("maps NotAllowedError to permissionDenied", () => {
    const error = new DOMException("denied", "NotAllowedError");
    expect(mapNfcWriteError(error)).toBe("permissionDenied");
  });

  it("maps NetworkError to tagLost", () => {
    const error = new DOMException("lost", "NetworkError");
    expect(mapNfcWriteError(error)).toBe("tagLost");
  });

  it("maps unknown errors to writeFailed", () => {
    expect(mapNfcWriteError(new Error("other"))).toBe("writeFailed");
  });
});

describe("writeUrlToNfcTag", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("writes a url NDEF record via NDEFWriter", async () => {
    const write = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal(
      "NDEFWriter",
      class NDEFWriter {
        write = write;
      },
    );

    await writeUrlToNfcTag("https://pixtrela.com/kiosk/col-abc");

    expect(write).toHaveBeenCalledWith({
      records: [{ recordType: "url", data: "https://pixtrela.com/kiosk/col-abc" }],
    });
  });

  it("throws mapped error when write fails", async () => {
    vi.stubGlobal(
      "NDEFWriter",
      class NDEFWriter {
        write = vi.fn().mockRejectedValue(
          new DOMException("denied", "NotAllowedError"),
        );
      },
    );

    await expect(writeUrlToNfcTag("https://example.com")).rejects.toMatchObject({
      code: "permissionDenied",
    });
  });
});

describe("writeKioskColaboratorLinkToNfc", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("writes the full kiosk colaborator url", async () => {
    const write = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal(
      "NDEFWriter",
      class NDEFWriter {
        write = write;
      },
    );

    await writeKioskColaboratorLinkToNfc("col-abc", "https://pixtrela.com");

    expect(write).toHaveBeenCalledWith({
      records: [
        { recordType: "url", data: "https://pixtrela.com/kiosk/col-abc" },
      ],
    });
  });
});
