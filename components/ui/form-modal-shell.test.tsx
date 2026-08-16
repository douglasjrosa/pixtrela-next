import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithIntl } from "@/test/test-utils";
import { Button } from "@/components/ui/button";
import {
  FORM_MODAL_BODY_MIN_HEIGHT_CLASS,
  FORM_MODAL_NESTED_OVERLAY_Z_CLASS,
  FORM_MODAL_OVERLAY_Z_CLASS,
  FormModalShell,
} from "./form-modal-shell";

describe("FormModalShell", () => {
  it("does not render when closed", () => {
    renderWithIntl(
      <FormModalShell open={false} title="Título" onClose={vi.fn()}>
        <p>Conteúdo</p>
      </FormModalShell>,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders fixed header with title and close, scroll body, and footer slots", () => {
    renderWithIntl(
      <FormModalShell
        open
        title="Editar item"
        onClose={vi.fn()}
        headerActions={<Button type="button">Extra</Button>}
        footerStart={
          <Button type="button" variant="destructive">
            Excluir
          </Button>
        }
        footerEnd={<Button type="submit">Salvar</Button>}
      >
        <p>Corpo do formulário</p>
      </FormModalShell>,
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Editar item" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Fechar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Extra" })).toBeInTheDocument();
    expect(screen.getByText("Corpo do formulário")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Excluir" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Salvar" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Cancelar" }),
    ).not.toBeInTheDocument();

    const body = document.querySelector('[data-slot="form-modal-body"]');
    const footer = document.querySelector('[data-slot="form-modal-footer"]');
    expect(footer).toBeTruthy();
    expect(body?.contains(footer)).toBe(false);
    expect(footer?.className).toContain("shrink-0");
    expect(footer?.className).toContain("bg-background");
  });

  it("gives the scroll body a min-height so short viewports can scroll chrome away", () => {
    renderWithIntl(
      <FormModalShell open title="Título" onClose={vi.fn()}>
        <p>Conteúdo</p>
      </FormModalShell>,
    );

    const body = document.querySelector('[data-slot="form-modal-body"]');
    expect(body).toBeTruthy();
    const inner = body?.firstElementChild;
    expect(inner?.className).toContain(FORM_MODAL_BODY_MIN_HEIGHT_CLASS);
  });

  it("can skip body min-height for compact forms", () => {
    renderWithIntl(
      <FormModalShell open title="Título" fillBody={false} onClose={vi.fn()}>
        <p>Conteúdo</p>
      </FormModalShell>,
    );

    const body = document.querySelector('[data-slot="form-modal-body"]');
    const inner = body?.firstElementChild;
    expect(inner?.className).not.toContain(FORM_MODAL_BODY_MIN_HEIGHT_CLASS);
  });

  it("stacks above the app navbar", () => {
    renderWithIntl(
      <FormModalShell open title="Título" onClose={vi.fn()}>
        <p>Conteúdo</p>
      </FormModalShell>,
    );

    expect(screen.getByRole("presentation").className).toContain(
      FORM_MODAL_OVERLAY_Z_CLASS,
    );
    expect(screen.getByRole("presentation").className).toContain("pt-[4.5rem]");
  });

  it("can stack above another form modal", () => {
    renderWithIntl(
      <FormModalShell open title="Título" layer="nested" onClose={vi.fn()}>
        <p>Conteúdo</p>
      </FormModalShell>,
    );

    expect(screen.getByRole("presentation").className).toContain(
      FORM_MODAL_NESTED_OVERLAY_Z_CLASS,
    );
  });

  it("clears the navbar on viewport layout from sm breakpoint", () => {
    renderWithIntl(
      <FormModalShell open title="Título" layout="viewport" onClose={vi.fn()}>
        <p>Conteúdo</p>
      </FormModalShell>,
    );

    const overlay = screen.getByRole("presentation");
    expect(overlay.className).toContain("items-start");
    expect(overlay.className).toContain("sm:pt-[4.5rem]");
  });

  it("closes from X and backdrop when not disabled", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    renderWithIntl(
      <FormModalShell open title="Título" onClose={onClose}>
        <p>Conteúdo</p>
      </FormModalShell>,
    );

    await user.click(screen.getByRole("button", { name: "Fechar" }));
    expect(onClose).toHaveBeenCalledOnce();

    onClose.mockReset();
    await user.click(screen.getByRole("presentation"));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("blocks close when disabled", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    renderWithIntl(
      <FormModalShell open title="Título" disabled onClose={onClose}>
        <p>Conteúdo</p>
      </FormModalShell>,
    );

    expect(screen.getByRole("button", { name: "Fechar" })).toBeDisabled();
    await user.click(screen.getByRole("presentation"));
    expect(onClose).not.toHaveBeenCalled();
  });

  it("closes on Escape when not disabled", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    renderWithIntl(
      <FormModalShell open title="Título" onClose={onClose}>
        <p>Conteúdo</p>
      </FormModalShell>,
    );

    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledOnce();
  });
});
