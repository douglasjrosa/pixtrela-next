import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { renderWithIntl } from "@/test/test-utils";

import { MediaFilesFilterModal } from "./media-files-filter-modal";

describe("MediaFilesFilterModal", () => {
  it("applies mime and category filters from the modal", () => {
    const onApply = vi.fn();
    const onClose = vi.fn();

    renderWithIntl(
      <MediaFilesFilterModal
        initialValues={{ mimeFilter: "all", categoryFilter: "all" }}
        onClose={onClose}
        onApply={onApply}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Imagens" }));
    fireEvent.click(screen.getByRole("button", { name: "Prêmios" }));
    fireEvent.click(screen.getByRole("button", { name: "Aplicar" }));

    expect(onApply).toHaveBeenCalledWith({
      mimeFilter: "image",
      categoryFilter: "award",
    });
    expect(onClose).toHaveBeenCalled();
  });
});
