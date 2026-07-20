import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";

import { renderWithIntl } from "@/test/test-utils";
import { KioskColaboratorFacePhotoForm } from "./kiosk-colaborator-face-photo-form";

vi.mock("@/lib/media/compress-profile-image", () => ({
  compressProfileImage: vi.fn(async (file: File) => file),
}));

vi.mock("@/lib/kiosk/face/validate-face-photo-file", () => ({
  validateFacePhotoHasSingleFace: vi.fn(async () => ({ ok: true })),
}));

vi.mock("@/lib/ui/app-toast", () => ({
  showErrorToast: vi.fn(),
  showSuccessToast: vi.fn(),
}));

describe("KioskColaboratorFacePhotoForm", () => {
  it("calls onSave when face validation passes", async () => {
    const onSave = vi.fn().mockResolvedValue(true);
    renderWithIntl(
      <KioskColaboratorFacePhotoForm onSave={onSave} facePhotoUrl={null} />,
    );

    const file = new File(["photo"], "photo.jpg", { type: "image/jpeg" });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(file);
    });
  });
});
