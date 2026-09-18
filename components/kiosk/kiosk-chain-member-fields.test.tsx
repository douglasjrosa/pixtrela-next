import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";

import messages from "@/messages/pt-BR.json";
import { renderWithIntl } from "@/test/test-utils";

import { KioskChainMemberFields } from "./kiosk-chain-member-fields";

function renderMemberFields(ui: ReactElement) {
  return render(
    <NextIntlClientProvider locale="pt-BR" messages={messages}>
      {ui}
    </NextIntlClientProvider>,
  );
}

describe("KioskChainMemberFields", () => {
  it("renders with intl provider", () => {
    renderWithIntl(
      <KioskChainMemberFields
        documentId="step-a"
        name="Cortar"
        sharingType="duration"
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByText("Cortar")).toBeInTheDocument();
  });

  it("shows each member's own flag options when the wizard step changes", () => {
    const onChange = vi.fn();
    const { rerender } = renderMemberFields(
      <KioskChainMemberFields
        documentId="step-a"
        name="Cortar"
        sharingType="duration"
        availableFlags={[{ id: "flag-a", code: "ALM-1" }]}
        subTaskCategoryId="cat-a"
        requiresMaterialFlagsOnFinish
        onChange={onChange}
      />,
    );

    expect(screen.getByRole("button", { name: "ALM-1" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "MAD-2" })).toBeNull();

    rerender(
      <NextIntlClientProvider locale="pt-BR" messages={messages}>
        <KioskChainMemberFields
          documentId="step-b"
          name="Embalar"
          sharingType="duration"
          availableFlags={[{ id: "flag-b", code: "MAD-2" }]}
          subTaskCategoryId="cat-b"
          requiresMaterialFlagsOnFinish
          onChange={onChange}
        />
      </NextIntlClientProvider>,
    );

    expect(screen.getByRole("button", { name: "MAD-2" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "ALM-1" })).toBeNull();
  });
});
