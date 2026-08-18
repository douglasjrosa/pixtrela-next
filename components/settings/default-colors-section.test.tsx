import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

import { renderWithIntl } from "@/test/test-utils";
import { DEFAULT_SEMANTIC_TOKENS } from "@/lib/themes/semantic-tokens";

import { DefaultColorsSection } from "./default-colors-section";

describe("DefaultColorsSection", () => {
  it("applies a preset to color pickers without saving", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);

    renderWithIntl(
      <DefaultColorsSection
        initialTokens={DEFAULT_SEMANTIC_TOKENS}
        onSave={onSave}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Oceano" }));

    expect(
      (document.getElementById("semantic-token-primary") as HTMLInputElement)
        ?.value,
    ).toBe("#1e6fbf");
    expect(onSave).not.toHaveBeenCalled();
  });

  it("calls onSave with draft tokens when save is clicked", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);

    renderWithIntl(
      <DefaultColorsSection
        initialTokens={DEFAULT_SEMANTIC_TOKENS}
        onSave={onSave}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Violeta" }));
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ primary: "#6d28d9" }),
    );
    expect(refresh).toHaveBeenCalled();
  });
});
