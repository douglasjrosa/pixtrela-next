import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { renderWithIntl } from "@/test/test-utils";
import { UserMediaFields } from "./user-media-fields";

vi.mock("@/lib/media/compress-profile-image", () => ({
  compressProfileImage: (file: File) => Promise.resolve(file),
}));

vi.mock("@/lib/kiosk/face/extract-face-descriptor", () => ({
  extractFaceDescriptorFromFile: () =>
    Promise.resolve({
      ok: true,
      faceVector: Array.from({ length: 128 }, (_, i) => i / 128),
    }),
}));

describe("UserMediaFields", () => {
  it("renders avatar and facial recognition image controls", () => {
    renderWithIntl(
      <UserMediaFields
        userName="Ana"
        avatarUrl="/api/media/avatar.jpg"
        facePhotoUrl="/api/media/face.jpg"
        onUpload={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Imagem de avatar")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Imagem para reconhecimento facial"),
    ).toBeInTheDocument();
    expect(screen.getByAltText("Avatar de Ana")).toBeInTheDocument();
    expect(screen.getByAltText("Foto facial de Ana")).toBeInTheDocument();
  });

  it("uploads the selected avatar", async () => {
    const onUpload = vi.fn().mockResolvedValue(undefined);
    const file = new File(["avatar"], "avatar.png", { type: "image/png" });

    renderWithIntl(
      <UserMediaFields userName="Ana" onUpload={onUpload} />,
    );

    fireEvent.change(screen.getByLabelText("Imagem de avatar"), {
      target: { files: [file] },
    });

    await waitFor(() => {
      expect(onUpload).toHaveBeenCalledWith("avatar", file, undefined);
    });
  });

  it("validates and uploads the selected face photo with faceVector", async () => {
    const onUpload = vi.fn().mockResolvedValue(undefined);
    const file = new File(["face"], "face.png", { type: "image/png" });

    renderWithIntl(
      <UserMediaFields userName="Ana" onUpload={onUpload} />,
    );

    fireEvent.change(
      screen.getByLabelText("Imagem para reconhecimento facial"),
      { target: { files: [file] } },
    );

    await waitFor(() => {
      expect(onUpload).toHaveBeenCalledWith(
        "facePhoto",
        file,
        expect.objectContaining({
          faceVector: expect.any(Array),
        }),
      );
    });
  });
});
