import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";

import { renderWithIntl } from "@/test/test-utils";

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

import { TemplatesFilterModal } from "./templates-filter-modal";

describe("TemplatesFilterModal", () => {
  it("applies code filter to the URL", () => {
    renderWithIntl(
      <TemplatesFilterModal
        open
        initialFilters={{}}
        onClose={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText("Código"), {
      target: { value: "100" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Aplicar" }));

    expect(replace).toHaveBeenCalledWith("/templates/tasks?code=100");
  });
});
