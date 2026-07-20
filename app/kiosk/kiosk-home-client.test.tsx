import { describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithIntl } from "@/test/test-utils";
import { KioskHomeClient } from "@/app/kiosk/kiosk-home-client";

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

vi.mock("@/app/kiosk/actions", () => ({
  fetchKioskDirectoryTeams: vi.fn(async () => ({
    ok: true,
    teams: [{ documentId: "t1", name: "Alpha" }],
  })),
  fetchKioskDirectoryColaborators: vi.fn(async () => ({
    ok: true,
    colaborators: [
      {
        documentId: "c1",
        name: "Ana",
        facePhotoUrl: "http://127.0.0.1:1337/uploads/a.jpg",
      },
    ],
  })),
  identifyKioskUserByCode: vi.fn(),
}));

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

describe("KioskHomeClient", () => {
  it("navigates team -> member and opens face verify", async () => {
    const user = userEvent.setup();
    renderWithIntl(<KioskHomeClient />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Alpha" })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Alpha" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Ana/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /Ana/i }));

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Confirme com o rosto" }),
      ).toBeInTheDocument();
    });
  });
});
