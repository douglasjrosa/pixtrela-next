import { describe, expect, it, vi, afterEach } from "vitest";

import {
  isNfcReadSupported,
  mapNfcReadError,
  readNfcSerialNumberOnce,
} from "./nfc-read";
import { clearNfcCooldown, startNfcCooldown } from "./nfc-cooldown";

describe("isNfcReadSupported", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns true when NDEFReader exists on window", () => {
    vi.stubGlobal("NDEFReader", class NDEFReader {});
    expect(isNfcReadSupported()).toBe(true);
  });

  it("returns false when NDEFReader is missing", () => {
    vi.stubGlobal("window", {});
    expect(isNfcReadSupported()).toBe(false);
  });
});

describe("mapNfcReadError", () => {
  it("maps DOMException names", () => {
    expect(
      mapNfcReadError(new DOMException("x", "NotSupportedError")),
    ).toBe("unsupported");
    expect(
      mapNfcReadError(new DOMException("x", "NotAllowedError")),
    ).toBe("permissionDenied");
    expect(mapNfcReadError(new DOMException("x", "NetworkError"))).toBe(
      "tagLost",
    );
  });

  it("maps unknown errors to readFailed", () => {
    expect(mapNfcReadError(new Error("other"))).toBe("readFailed");
  });
});

describe("readNfcSerialNumberOnce", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    clearNfcCooldown();
  });

  it("resolves with normalized serialNumber from the first reading", async () => {
    type Listener = (event: { serialNumber?: string }) => void;
    let readingListener: Listener | null = null;

    vi.stubGlobal(
      "NDEFReader",
      class NDEFReader {
        scan = vi.fn().mockResolvedValue(undefined);
        addEventListener = vi.fn((type: string, listener: Listener) => {
          if (type === "reading") readingListener = listener;
        });
        removeEventListener = vi.fn();
      },
    );

    const pending = readNfcSerialNumberOnce();
    expect(readingListener).toBeTruthy();
    readingListener?.({ serialNumber: "04:a3:b2:c1" });

    await expect(pending).resolves.toBe("04A3B2C1");
  });

  it("throws cooldown when active", async () => {
    vi.stubGlobal(
      "NDEFReader",
      class NDEFReader {
        scan = vi.fn();
        addEventListener = vi.fn();
        removeEventListener = vi.fn();
      },
    );
    startNfcCooldown();

    await expect(readNfcSerialNumberOnce()).rejects.toMatchObject({
      code: "cooldown",
    });
  });

  it("throws noSerial when serialNumber is missing", async () => {
    type Listener = (event: { serialNumber?: string }) => void;
    let readingListener: Listener | null = null;

    vi.stubGlobal(
      "NDEFReader",
      class NDEFReader {
        scan = vi.fn().mockResolvedValue(undefined);
        addEventListener = vi.fn((type: string, listener: Listener) => {
          if (type === "reading") readingListener = listener;
        });
        removeEventListener = vi.fn();
      },
    );

    const pending = readNfcSerialNumberOnce({ applyCooldown: false });
    readingListener?.({ serialNumber: "" });

    await expect(pending).rejects.toMatchObject({ code: "noSerial" });
  });
});

describe("watchNfcSerialNumbers", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    clearNfcCooldown();
  });

  it("invokes onTag for each reading while not on cooldown", async () => {
    const { watchNfcSerialNumbers } = await import("./nfc-read");
    type Listener = (event: { serialNumber?: string }) => void;
    let readingListener: Listener | null = null;

    vi.stubGlobal(
      "NDEFReader",
      class NDEFReader {
        scan = vi.fn().mockResolvedValue(undefined);
        addEventListener = vi.fn((type: string, listener: Listener) => {
          if (type === "reading") readingListener = listener;
        });
        removeEventListener = vi.fn();
      },
    );

    const onTag = vi.fn();
    const { stop } = watchNfcSerialNumbers({ onTag });

    readingListener?.({ serialNumber: "04:aa:bb:cc" });
    readingListener?.({ serialNumber: "04:aa:bb:dd" });

    expect(onTag).toHaveBeenCalledTimes(1);
    expect(onTag).toHaveBeenCalledWith("04AABBCC");
    stop();
  });
});
