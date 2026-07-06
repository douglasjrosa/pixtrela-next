import { describe, expect, it, vi, afterEach } from "vitest";

import {
  collectNfcDiagnostics,
  isNfcWriteSupported,
  mapNfcWriteError,
  writeKioskColaboratorLinkToNfc,
  writeUrlToNfcTag,
} from "./nfc-write";

describe("isNfcWriteSupported", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns true when NDEFReader exists on window", () => {
    vi.stubGlobal("NDEFReader", class NDEFReader {});
    expect(isNfcWriteSupported()).toBe(true);
  });

  it("returns true when only NDEFWriter exists on window", () => {
    vi.stubGlobal("NDEFWriter", class NDEFWriter {});
    expect(isNfcWriteSupported()).toBe(true);
  });

  it("returns false when NFC APIs are missing", () => {
    vi.stubGlobal("window", {});
    expect(isNfcWriteSupported()).toBe(false);
  });
});

describe("collectNfcDiagnostics", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reports NDEFReader availability", async () => {
    class NDEFReader {}
    vi.stubGlobal("NDEFReader", NDEFReader);
    vi.stubGlobal("navigator", {
      userAgent: "test-agent",
      permissions: {
        query: vi.fn().mockResolvedValue({ state: "prompt" }),
      },
    });
    vi.stubGlobal("window", {
      isSecureContext: true,
      location: { protocol: "https:", origin: "https://pixtrela.com" },
      matchMedia: () => ({ matches: false }),
      NDEFReader,
    });
    vi.stubGlobal("document", { visibilityState: "visible" });

    const diagnostics = await collectNfcDiagnostics();

    expect(diagnostics.hasNdefReader).toBe(true);
    expect(diagnostics.isWriteSupported).toBe(true);
    expect(diagnostics.permissionState).toBe("prompt");
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

  it("writes a url NDEF record via NDEFReader on Chrome Android", async () => {
    const write = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal(
      "NDEFReader",
      class NDEFReader {
        write = write;
      },
    );

    const result = await writeUrlToNfcTag("https://pixtrela.com/kiosk/col-abc");

    expect(result.api).toBe("NDEFReader");
    expect(write).toHaveBeenCalledWith({
      records: [{ recordType: "url", data: "https://pixtrela.com/kiosk/col-abc" }],
    });
  });

  it("falls back to NDEFWriter when NDEFReader is missing", async () => {
    const write = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal(
      "NDEFWriter",
      class NDEFWriter {
        write = write;
      },
    );

    const result = await writeUrlToNfcTag("https://pixtrela.com/kiosk/col-abc");

    expect(result.api).toBe("NDEFWriter");
    expect(write).toHaveBeenCalled();
  });

  it("throws mapped error when write fails", async () => {
    vi.stubGlobal(
      "NDEFReader",
      class NDEFReader {
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
      "NDEFReader",
      class NDEFReader {
        write = write;
      },
    );

    const result = await writeKioskColaboratorLinkToNfc(
      "col-abc",
      "https://pixtrela.com",
    );

    expect(result.url).toBe("https://pixtrela.com/kiosk/col-abc");
    expect(write).toHaveBeenCalledWith({
      records: [
        { recordType: "url", data: "https://pixtrela.com/kiosk/col-abc" },
      ],
    });
  });
});
