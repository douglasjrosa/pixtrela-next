import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithIntl } from "@/test/test-utils";

import { ProfileAvatarEditor } from "./profile-avatar-editor";

vi.mock("@/lib/media/compress-profile-image", () => ({
  compressProfileImage: vi.fn(async (file: File) => file),
}));

vi.mock("@/components/kiosk/face-oval-capture", () => ({
  FaceOvalCapture: ({
    onCapture,
    onCancel,
  }: {
    onCapture: (file: File) => void;
    onCancel: () => void;
  }) => (
    <div>
      <button
        type="button"
        onClick={() =>
          onCapture(new File(["x"], "shot.jpg", { type: "image/jpeg" }))
        }
      >
        mock-capture
      </button>
      <button type="button" onClick={onCancel}>
        mock-cancel
      </button>
    </div>
  ),
}));

vi.mock("@/lib/ui/app-toast", () => ({
  showErrorToast: vi.fn(),
  showSuccessToast: vi.fn(),
}));

describe("ProfileAvatarEditor", () => {
  it("shows take photo and upload photo buttons", () => {
    renderWithIntl(
      <ProfileAvatarEditor userName="Ana" avatarUrl={null} onUpload={vi.fn()} />,
    );

    expect(
      screen.getByRole("button", { name: "Tirar foto" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Enviar foto" }),
    ).toBeInTheDocument();
  });

  it("opens camera capture when take photo is clicked", async () => {
    const user = userEvent.setup();
    renderWithIntl(
      <ProfileAvatarEditor userName="Ana" avatarUrl={null} onUpload={vi.fn()} />,
    );

    await user.click(screen.getByRole("button", { name: "Tirar foto" }));
    expect(screen.getByRole("button", { name: "mock-capture" })).toBeInTheDocument();
  });
});
