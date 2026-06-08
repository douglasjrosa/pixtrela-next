import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithIntl } from "@/test/test-utils";
import { TeamManager } from "./team-manager";

const leaders = [{ documentId: "l1", name: "João" }];
const colaborators = [{ documentId: "c1", name: "Ana" }];
const teams = [
  {
    documentId: "t1",
    name: "Linha A",
    exchangesFirstDay: 3,
    exchangesLastDay: 15,
    since: "2026-01-10",
    untill: null,
    leader: leaders[0],
    colaborators,
  },
  {
    documentId: "t2",
    name: "Linha B",
    exchangesFirstDay: 3,
    exchangesLastDay: 15,
    since: "2025-06-01",
    untill: "2026-05-31",
    leader: leaders[0],
    colaborators,
  },
];

describe("TeamManager", () => {
  it("renders team list with lifecycle and status columns", () => {
    renderWithIntl(
      <TeamManager
        teams={teams}
        leaders={leaders}
        colaborators={colaborators}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
      />,
    );
    expect(screen.getByText("Linha A")).toBeInTheDocument();
    expect(screen.getByText("Linha B")).toBeInTheDocument();
    expect(screen.getByText("Ativa")).toBeInTheDocument();
    expect(screen.getByText("Inativa")).toBeInTheDocument();
  });

  it("shows leader and colaborator fields", () => {
    renderWithIntl(
      <TeamManager
        teams={[]}
        leaders={leaders}
        colaborators={colaborators}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
      />,
    );
    expect(screen.getByLabelText("Líder")).toBeInTheDocument();
    expect(screen.getByLabelText("Colaboradores")).toBeInTheDocument();
  });

  it("defaults exchanges first day to 3 in the new team form", () => {
    renderWithIntl(
      <TeamManager
        teams={[]}
        leaders={leaders}
        colaborators={colaborators}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
      />,
    );
    expect(screen.getByLabelText("Início das trocas")).toHaveValue(3);
    expect(screen.getByLabelText("Fim das trocas")).toHaveValue(15);
  });

  it("shows since and untill fields when editing", async () => {
    const user = userEvent.setup();
    renderWithIntl(
      <TeamManager
        teams={teams}
        leaders={leaders}
        colaborators={colaborators}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Linha A" }));
    expect(screen.getByLabelText("Até")).toBeInTheDocument();
    expect(
      screen.getByText("Deixe vazio para manter a equipe ativa. Preencha para arquivar."),
    ).toBeInTheDocument();
  });

  it("shows new team form title", () => {
    renderWithIntl(
      <TeamManager
        teams={[]}
        leaders={leaders}
        colaborators={colaborators}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
      />,
    );
    expect(screen.getByRole("heading", { name: "Nova equipe" })).toBeInTheDocument();
  });
});
