import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { MediaPickerModal } from "@/components/settings/media-picker-modal";
import type { MediaAssetRecord } from "@/lib/repos/media";
import { renderWithIntl } from "@/test/test-utils";

const sampleAsset: MediaAssetRecord = {
  id: "m1",
  storageKey: "m1.png",
  url: "/api/media/m1.png",
  browserUrl: "/api/media/m1.png",
  mimeType: "image/png",
  byteSize: 12,
  originalFilename: "logo.png",
  displayName: "logo",
  description: null,
  altText: null,
  title: null,
  category: "branding",
  sensitivity: "public",
  createdAt: new Date("2026-01-01T00:00:00Z"),
  updatedAt: new Date("2026-01-01T00:00:00Z"),
};

describe("MediaPickerModal", () => {
  it("lists images and confirms selection", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onListImages = vi.fn(async () => [sampleAsset]);
    const onUploadImage = vi.fn();

    renderWithIntl(
      <MediaPickerModal
        open
        onClose={vi.fn()}
        onConfirm={onConfirm}
        onListImages={onListImages}
        onUploadImage={onUploadImage}
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole("img", { name: "logo.png" })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "logo.png" }));
    await user.click(screen.getByRole("button", { name: "Usar selecionada" }));
    expect(onConfirm).toHaveBeenCalledWith(sampleAsset);
  });
});
