import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";

import { renderWithIntl } from "@/test/test-utils";
import { KioskColaboratorAvatarForm } from "./kiosk-colaborator-avatar-form";

vi.mock("@/lib/media/compress-profile-image", () => ({
  compressProfileImage: vi.fn(async (file: File) => file),
}));

describe("KioskColaboratorAvatarForm", () => {
  it("calls onSave with selected file", async () => {
    const onSave = vi.fn().mockResolvedValue(true);
    renderWithIntl(
      <KioskColaboratorAvatarForm onSave={onSave} avatarUrl={null} />,
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
