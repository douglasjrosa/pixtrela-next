import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithIntl } from "@/test/test-utils";

import { FlagPageHeader } from "./flag-page-header";

const setMaterialFlagsFeatureEnabled = vi.fn();
const createFlags = vi.fn();
const nextIndexForCategory = vi.fn();
const showErrorToast = vi.fn();
const showSuccessToast = vi.fn();
const refresh = vi.fn();

vi.mock("@/app/(app)/settings/subtasks/actions", () => ({
  setMaterialFlagsFeatureEnabled: (...args: unknown[]) =>
    setMaterialFlagsFeatureEnabled(...args),
  createFlags: (...args: unknown[]) => createFlags(...args),
  nextIndexForCategory: (...args: unknown[]) => nextIndexForCategory(...args),
}));

vi.mock("@/lib/ui/app-toast", () => ({
  showErrorToast: (...args: unknown[]) => showErrorToast(...args),
  showSuccessToast: (...args: unknown[]) => showSuccessToast(...args),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

const categories = [{ id: "cat-1", name: "Madeira" }];

describe("FlagPageHeader", () => {
  it("places the feature switch to the left of the add button", () => {
    renderWithIntl(
      <FlagPageHeader categories={categories} flagsEnabled />,
    );

    const toggle = screen.getByRole("switch", { name: "Bandeiras" });
    const add = screen.getByRole("button", { name: "Nova bandeira" });
    const following = Node.DOCUMENT_POSITION_FOLLOWING;
    expect(toggle.compareDocumentPosition(add) & following).toBeTruthy();
  });

  it("hides the add button when flags are disabled", () => {
    renderWithIntl(
      <FlagPageHeader categories={categories} flagsEnabled={false} />,
    );

    expect(screen.getByRole("switch", { name: "Bandeiras" })).not.toBeChecked();
    expect(
      screen.queryByRole("button", { name: "Nova bandeira" }),
    ).not.toBeInTheDocument();
  });

  it("saves the switch and refreshes", async () => {
    const user = userEvent.setup();
    setMaterialFlagsFeatureEnabled.mockResolvedValue(undefined);

    renderWithIntl(
      <FlagPageHeader categories={categories} flagsEnabled />,
    );

    await user.click(screen.getByRole("switch", { name: "Bandeiras" }));
    expect(setMaterialFlagsFeatureEnabled).toHaveBeenCalledWith(false);
  });
});
