import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";

import {
  KanbanTaskSubtasksLoadingBody,
  SUBTASK_LOADING_SKELETON_COUNT,
} from "@/components/kanban/kanban-task-subtasks-loading";
import { renderWithIntl } from "@/test/test-utils";

describe("KanbanTaskSubtasksLoadingBody", () => {
  it("shows subtask card skeletons without chain links", () => {
    renderWithIntl(
      <KanbanTaskSubtasksLoadingBody
        teams={[]}
        assignWarnMax={4}
        assignedCountByColaboratorId={{}}
      />,
    );

    expect(screen.getByTestId("kanban-subtasks-loading")).toHaveAttribute(
      "aria-busy",
      "true",
    );
    expect(
      screen.getByRole("status", { name: "Carregando..." }),
    ).toBeInTheDocument();
    expect(screen.getAllByTestId("task-progress-bar-skeleton")).toHaveLength(
      SUBTASK_LOADING_SKELETON_COUNT,
    );
    expect(screen.queryByTestId("subtask-chain-link")).not.toBeInTheDocument();
    expect(screen.getAllByTestId("kanban-team-skeleton").length).toBeGreaterThan(
      0,
    );
  });

  it("renders loaded teams instead of team skeletons", () => {
    renderWithIntl(
      <KanbanTaskSubtasksLoadingBody
        teams={[
          {
            documentId: "team-1",
            name: "Equipe A",
            members: [{ documentId: "u-1", name: "Ana" }],
          },
        ]}
        assignWarnMax={4}
        assignedCountByColaboratorId={{ "u-1": 3 }}
      />,
    );

    expect(screen.getByText("Equipe A")).toBeInTheDocument();
    expect(screen.getByText("Ana")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Ana: 3 subtarefa(s) atribuída(s)"),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("kanban-team-skeleton")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Ana" }),
    ).not.toBeInTheDocument();
  });
});
