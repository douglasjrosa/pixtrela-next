import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";

import { renderWithIntl } from "@/test/test-utils";
import { KioskFaceVerify } from "./kiosk-face-verify";

vi.mock("@/lib/kiosk/face/load-face-models", () => ({
  loadFaceModels: vi.fn(async () => ({})),
}));

vi.mock("@/lib/kiosk/face/load-reference-descriptor", () => ({
  loadReferenceFaceDescriptor: vi.fn(async () => new Float32Array([0, 0, 0])),
}));

vi.mock("@/lib/kiosk/face/verify-face-against-photo", () => ({
  stopMediaStream: vi.fn(),
  verifyFaceAgainstPhoto: vi.fn(async ({ signal }: { signal?: AbortSignal }) => {
    await new Promise((resolve) => setTimeout(resolve, 5));
    if (signal?.aborted) {
      return {
        status: "aborted",
        matchingFrames: 0,
        sampledFrames: 0,
        bestDistance: Number.POSITIVE_INFINITY,
      };
    }
    return {
      status: "mismatch",
      matchingFrames: 0,
      sampledFrames: 1,
      bestDistance: 0.9,
    };
  }),
}));

describe("KioskFaceVerify", () => {
  it("renders title and privacy notice", () => {
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: vi.fn(async () => ({
          getTracks: () => [],
        })),
      },
    });

    const { unmount } = renderWithIntl(
      <KioskFaceVerify
        colaboratorName="Ana"
        facePhotoUrl="http://localhost:1337/uploads/a.jpg"
        onSuccess={vi.fn()}
        onCancel={vi.fn()}
        onFallbackCode={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Confirme com o rosto" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Confirmando Ana/i)).toBeInTheDocument();
    expect(
      screen.getByText(/não é salva nem enviada/i),
    ).toBeInTheDocument();

    unmount();
  });
});
