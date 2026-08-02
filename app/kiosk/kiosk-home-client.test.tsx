import { describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithIntl } from "@/test/test-utils";
import { KioskHomeClient } from "@/app/kiosk/kiosk-home-client";

vi.mock("@/components/kiosk/kiosk-face-1n-capture", () => ({
  KioskFace1nCapture: ({
    onProbeReady,
    onFallbackCode,
  }: {
    onProbeReady: (descriptor: number[]) => void;
    onFallbackCode: () => void;
  }) => (
    <div>
      <h2>Quem é você?</h2>
      <button
        type="button"
        onClick={() =>
          onProbeReady(Array.from({ length: 128 }, (_, i) => i / 128))
        }
      >
        mock-probe
      </button>
      <button type="button" onClick={onFallbackCode}>
        Usar código e senha
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
}));

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

describe("KioskHomeClient", () => {
  it("shows 1:N camera first and welcomes on unique match", async () => {
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

    renderWithIntl(<KioskHomeClient />);

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

    renderWithIntl(<KioskHomeClient />);

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

  it("opens code form from fallback", async () => {
    const user = userEvent.setup();
    renderWithIntl(<KioskHomeClient />);

    await user.click(screen.getByRole("button", { name: "Usar código e senha" }));

    await waitFor(() => {
      expect(screen.getByLabelText("Código")).toBeInTheDocument();
      expect(screen.getByLabelText("Senha")).toBeInTheDocument();
    });
  });
});
