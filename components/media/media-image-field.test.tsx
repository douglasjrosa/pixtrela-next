import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { MediaAssetRecord } from "@/lib/repos/media";
import { renderWithIntl } from "@/test/test-utils";

import { MediaImageField } from "./media-image-field";

const sampleAsset: MediaAssetRecord = {
  id: "00000000-0000-4000-8000-000000000011",
  storageKey: "icon.png",
  url: "/api/media/icon.png",
  browserUrl: "/api/media/icon.png",
  mimeType: "image/png",
  byteSize: 12,
  originalFilename: "star.png",
  displayName: "star",
  description: null,
  altText: null,
  title: null,
  category: "currency",
  sensitivity: "public",
  createdAt: new Date("2026-01-01T00:00:00Z"),
  updatedAt: new Date("2026-01-01T00:00:00Z"),
};

describe("MediaImageField", () => {
  it("opens the shared picker and confirms a library image", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onListImages = vi.fn(async () => [sampleAsset]);

    renderWithIntl(
      <MediaImageField
        onSelect={onSelect}
        onRemove={vi.fn()}
        onListImages={onListImages}
        onUploadImage={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Escolher imagem" }));
    await waitFor(() => {
      expect(screen.getByRole("img", { name: "star.png" })).toBeInTheDocument();
    });
    await user.click(screen.getByRole("button", { name: "star.png" }));
    await user.click(screen.getByRole("button", { name: "Usar selecionada" }));
    expect(onSelect).toHaveBeenCalledWith(sampleAsset);
  });

  it("clears the current image", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();

    renderWithIntl(
      <MediaImageField
        selectedId={sampleAsset.id}
        previewUrl={sampleAsset.browserUrl}
        attachedLabel="Ícone anexado."
        onSelect={vi.fn()}
        onRemove={onRemove}
        onListImages={vi.fn(async () => [])}
        onUploadImage={vi.fn()}
      />,
    );

    expect(screen.getByText("Ícone anexado.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Remover imagem" }));
    expect(onRemove).toHaveBeenCalled();
  });
});
