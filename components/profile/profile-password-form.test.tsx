import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";

import { renderWithIntl, typePassword } from "@/test/test-utils";

import { ProfilePasswordForm } from "./profile-password-form";

function expandPasswordForm(): void {
  fireEvent.click(screen.getByRole("button", { name: "Alterar senha" }));
}

describe("ProfilePasswordForm", () => {
  it("is collapsed by default and expands on title click", () => {
    renderWithIntl(<ProfilePasswordForm onSave={vi.fn()} />);

    const toggle = screen.getByRole("button", { name: "Alterar senha" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByLabelText("Senha atual")).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Salvar" })).toBeNull();

    expandPasswordForm();

    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByLabelText("Senha atual")).toBeEnabled();
  });

  it("does not render its own Save button when dirty", async () => {
    renderWithIntl(<ProfilePasswordForm onSave={vi.fn()} />);
    expandPasswordForm();

    typePassword(screen.getByLabelText("Senha atual"), "oldpass1");

    expect(screen.queryByRole("button", { name: "Salvar" })).toBeNull();
  });

  it("notifies dirty state when a field changes", async () => {
    const onDirtyChange = vi.fn();
    renderWithIntl(
      <ProfilePasswordForm onSave={vi.fn()} onDirtyChange={onDirtyChange} />,
    );
    expandPasswordForm();

    typePassword(screen.getByLabelText("Senha atual"), "oldpass1");

    expect(onDirtyChange).toHaveBeenCalledWith(true);
  });

  it("shows mismatch message when confirmation differs after submit", async () => {
    const { createRef } = await import("react");
    const ref = createRef<{
      submit: () => Promise<{ ok: true } | { ok: false; error: string }>;
    }>();

    renderWithIntl(<ProfilePasswordForm ref={ref} onSave={vi.fn()} />);
    expandPasswordForm();

    typePassword(screen.getByLabelText("Senha atual"), "oldpass1");
    typePassword(screen.getByLabelText("Nova senha"), "newpass1");
    typePassword(screen.getByLabelText("Confirmar nova senha"), "other1");

    const result = await ref.current!.submit();
    expect(result).toEqual({ ok: false, error: "invalid" });
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "As senhas não coincidem.",
    );
  });
});
