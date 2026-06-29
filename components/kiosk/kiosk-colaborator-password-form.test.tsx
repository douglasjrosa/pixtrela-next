import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithIntl } from "@/test/test-utils";
import { KioskColaboratorPasswordForm } from "./kiosk-colaborator-password-form";

describe("KioskColaboratorPasswordForm", () => {
  it("shows colaborator name as title and submits password", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(true);

    renderWithIntl(
      <KioskColaboratorPasswordForm
        colaboratorName="Maria Silva"
        onCancel={vi.fn()}
        onSave={onSave}
      />,
    );

    expect(screen.getByRole("heading", { name: "Maria Silva" })).toBeInTheDocument();

    await user.type(screen.getByLabelText("Senha"), "secret1");
    await user.type(screen.getByLabelText("Re-senha"), "secret1");
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(onSave).toHaveBeenCalledWith({
      password: "secret1",
      confirmPassword: "secret1",
    });
  });
});
