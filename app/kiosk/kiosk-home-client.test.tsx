import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithIntl } from "@/test/test-utils";
import { KioskHomeClient } from "@/app/kiosk/kiosk-home-client";
import { KioskIdleProvider } from "@/components/kiosk/kiosk-idle-provider";

vi.mock("@/components/kiosk/kiosk-face-1n-capture", () => ({
  KioskFace1nCapture: ({
    onProbeReady,
    unidentifiedMessage,
  }: {
    onProbeReady: (descriptor: number[]) => void;
    unidentifiedMessage?: string | null;
  }) => (
    <div>
      <h2>Quem é você?</h2>
      {unidentifiedMessage ? <p>{unidentifiedMessage}</p> : null}
      <button
        type="button"
        onClick={() =>
          onProbeReady(Array.from({ length: 128 }, (_, i) => i / 128))
        }
      >
        mock-probe
      </button>
    </div>
  ),
}));

vi.mock("@/components/kiosk/kiosk-face-verify", () => ({
  KioskFaceVerify: ({ colaboratorName }: { colaboratorName: string }) => (
    <div>
      <h2>Confirme com o rosto</h2>
      <p>{colaboratorName}</p>
    </div>
  ),
}));

vi.mock("@/lib/kiosk/face/load-face-models", () => ({
  loadFaceModels: vi.fn(async () => ({})),
}));

const identifyKioskUserByFace = vi.fn();
const identifyKioskUserByCode = vi.fn();
const identifyKioskUserByTag = vi.fn();
const watchNfcSerialNumbers = vi.fn(() => ({ stop: vi.fn() }));
const isNfcReadSupported = vi.fn(() => false);

vi.mock("@/app/kiosk/actions", () => ({
  fetchKioskDirectoryTeams: vi.fn(async () => ({ ok: true, teams: [] })),
  fetchKioskDirectoryColaborators: vi.fn(async () => ({
    ok: true,
    colaborators: [],
  })),
  identifyKioskUserByFace: (...args: unknown[]) =>
    identifyKioskUserByFace(...args),
  identifyKioskUserByCode: (...args: unknown[]) =>
    identifyKioskUserByCode(...args),
  identifyKioskUserByTag: (...args: unknown[]) =>
    identifyKioskUserByTag(...args),
}));

vi.mock("@/lib/kiosk/nfc-read", () => ({
  isNfcReadSupported: () => isNfcReadSupported(),
  watchNfcSerialNumbers: (...args: unknown[]) =>
    watchNfcSerialNumbers(...args),
}));

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => "/kiosk",
}));

function renderHome() {
  return renderWithIntl(
    <KioskIdleProvider sessionIdleMs={60_000}>
      <KioskHomeClient />
    </KioskIdleProvider>,
  );
}

describe("KioskHomeClient", () => {
  beforeEach(() => {
    replace.mockReset();
    identifyKioskUserByFace.mockReset();
    identifyKioskUserByCode.mockReset();
    identifyKioskUserByTag.mockReset();
    watchNfcSerialNumbers.mockReset();
    watchNfcSerialNumbers.mockReturnValue({ stop: vi.fn() });
    isNfcReadSupported.mockReturnValue(false);
  });

  afterEach(() => {
    cleanup();
  });

  it("shows camera and password chooser first", () => {
    renderHome();
    expect(
      screen.getByRole("button", { name: "Reconhecimento facial" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Código e senha" }),
    ).toBeInTheDocument();
  });

  it("opens camera and welcomes on unique match", async () => {
    const user = userEvent.setup();
    identifyKioskUserByFace.mockResolvedValue({
      ok: true,
      status: "match",
      match: {
        documentId: "c1",
        name: "Ana Silva",
        greetingGender: "feminine",
        avatarUrl: "/uploads/av.jpg",
        facePhotoUrl: "/uploads/a.jpg",
      },
    });

    renderHome();
    await user.click(
      screen.getByRole("button", { name: "Reconhecimento facial" }),
    );

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Quem é você?" }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "mock-probe" }));

    await waitFor(() => {
      expect(screen.getByText(/Bem vinda Ana/i)).toBeInTheDocument();
    });
  });

  it("lists ambiguous candidates then opens 1:1 verify", async () => {
    const user = userEvent.setup();
    identifyKioskUserByFace.mockResolvedValue({
      ok: true,
      status: "ambiguous",
      candidates: [
        {
          documentId: "c1",
          name: "Ana",
          greetingGender: "feminine",
          avatarUrl: null,
          facePhotoUrl: "/uploads/a.jpg",
          faceVector: Array.from({ length: 128 }, () => 0.1),
        },
        {
          documentId: "c2",
          name: "Bruno",
          greetingGender: "masculine",
          avatarUrl: null,
          facePhotoUrl: "/uploads/b.jpg",
          faceVector: Array.from({ length: 128 }, () => 0.2),
        },
      ],
    });

    renderHome();
    await user.click(
      screen.getByRole("button", { name: "Reconhecimento facial" }),
    );
    await user.click(screen.getByRole("button", { name: "mock-probe" }));

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Qual é você?" }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /Ana/i }));

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Confirme com o rosto" }),
      ).toBeInTheDocument();
      expect(screen.getByText("Ana")).toBeInTheDocument();
    });
  });

  it("opens code form from password chooser", async () => {
    const user = userEvent.setup();
    renderHome();

    await user.click(screen.getByRole("button", { name: "Código e senha" }));

    await waitFor(() => {
      expect(screen.getByLabelText("Código")).toBeInTheDocument();
      expect(screen.getByLabelText("Senha")).toBeInTheDocument();
    });
  });

  it("navigates when NFC tag identifies a user on choose step", async () => {
    isNfcReadSupported.mockReturnValue(true);
    identifyKioskUserByTag.mockResolvedValue({
      ok: true,
      documentId: "c1",
      role: "colaborator",
      path: "/kiosk/c1",
    });

    let onTag: ((userTag: string) => void) | null = null;
    watchNfcSerialNumbers.mockImplementation(
      (options: { onTag: (userTag: string) => void }) => {
        onTag = options.onTag;
        return { stop: vi.fn() };
      },
    );

    renderHome();

    await waitFor(() => {
      expect(watchNfcSerialNumbers).toHaveBeenCalled();
    });

    onTag?.("04A3B2C1");

    await waitFor(() => {
      expect(identifyKioskUserByTag).toHaveBeenCalledWith("04A3B2C1");
      expect(replace).toHaveBeenCalledWith("/kiosk/c1");
    });
  });

  it("shows tagNotFound when NFC tag is unknown", async () => {
    isNfcReadSupported.mockReturnValue(true);
    identifyKioskUserByTag.mockResolvedValue({
      ok: false,
      error: "invalidCredentials",
    });

    let onTag: ((userTag: string) => void) | null = null;
    watchNfcSerialNumbers.mockImplementation(
      (options: { onTag: (userTag: string) => void }) => {
        onTag = options.onTag;
        return { stop: vi.fn() };
      },
    );

    renderHome();

    await waitFor(() => {
      expect(watchNfcSerialNumbers).toHaveBeenCalled();
    });

    onTag?.("DEADBEEF");

    await waitFor(() => {
      expect(
        screen.getByText(/Chaveiro não reconhecido/i),
      ).toBeInTheDocument();
    });
  });
});
