import { describe, expect, it, vi } from "vitest";
import { createRef } from "react";
import { fireEvent, screen, waitFor } from "@testing-library/react";

import { renderWithIntl } from "@/test/test-utils";

import {
  ProfilePersonalForm,
  type ProfilePersonalFormHandle,
} from "./profile-personal-form";

const defaults = {
  name: "Ana",
  lastName: "Silva",
  email: "ana@example.com",
  phone: "11987654321",
};

describe("ProfilePersonalForm", () => {
  it("renders personal fields", () => {
    renderWithIntl(
      <ProfilePersonalForm defaultValues={defaults} onSave={vi.fn()} />,
    );

    expect(screen.getByLabelText("Nome")).toHaveValue("Ana");
    expect(screen.getByLabelText("Sobrenome")).toHaveValue("Silva");
    expect(screen.getByLabelText("E-mail")).toHaveValue("ana@example.com");
    expect(screen.getByLabelText("Celular")).toHaveValue("11987654321");
  });

  it("notifies dirty state on change", async () => {
    const onDirtyChange = vi.fn();
    renderWithIntl(
      <ProfilePersonalForm
        defaultValues={defaults}
        onSave={vi.fn()}
        onDirtyChange={onDirtyChange}
      />,
    );

    fireEvent.change(screen.getByLabelText("Nome"), {
      target: { value: "Ana Paula" },
    });

    await waitFor(() => {
      expect(onDirtyChange).toHaveBeenCalledWith(true);
    });
  });

  it("submits validated values through the handle", async () => {
    const onSave = vi.fn().mockResolvedValue({ ok: true });
    const ref = createRef<ProfilePersonalFormHandle>();

    renderWithIntl(
      <ProfilePersonalForm
        ref={ref}
        defaultValues={defaults}
        onSave={onSave}
      />,
    );

    fireEvent.change(screen.getByLabelText("Celular"), {
      target: { value: "(11) 99876-5432" },
    });

    const result = await ref.current!.submit();
    expect(result.ok).toBe(true);
    expect(onSave).toHaveBeenCalledWith({
      name: "Ana",
      lastName: "Silva",
      email: "ana@example.com",
      phone: "11998765432",
    });
  });

  it("shows invalid phone message when submit fails validation", async () => {
    const ref = createRef<ProfilePersonalFormHandle>();

    renderWithIntl(
      <ProfilePersonalForm
        ref={ref}
        defaultValues={defaults}
        onSave={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText("Celular"), {
      target: { value: "1134567890" },
    });

    const result = await ref.current!.submit();
    expect(result).toEqual({ ok: false, error: "invalid" });
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Informe um celular válido com DDD.",
    );
  });
});
