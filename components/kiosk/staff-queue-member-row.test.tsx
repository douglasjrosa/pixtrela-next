import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";

import { renderWithIntl } from "@/test/test-utils";
import type { StaffQueueMember } from "@/lib/kiosk/load-staff-queues-grouped";
import { StaffQueueMemberRow } from "./staff-queue-member-row";

const memberWithActivity: StaffQueueMember = {
  documentId: "c1",
  name: "Alice",
  code: 5535,
  lastActivity: {
    action: "started",
    timestamp: "2026-03-27T14:30:00.000Z",
    subTaskName: "Montagem",
    taskName: "Pedido A",
    taskQty: 2,
    taskCrmItemKey: null,
    taskDeliveryDate: null,
  },
  assignedCount: 8,
};

describe("StaffQueueMemberRow", () => {
  it("shows name, code, activity time badge, and subtask label", () => {
    renderWithIntl(
      <StaffQueueMemberRow
        member={memberWithActivity}
        href="/queues/c1"
      />,
    );

    expect(screen.getByRole("link", { name: /Alice/i })).toHaveAttribute(
      "href",
      "/queues/c1",
    );
    expect(screen.getByText("Alice 5535")).toBeInTheDocument();
    expect(screen.getByText("2 - Pedido A")).toBeInTheDocument();
    expect(screen.getByText("Montagem")).toBeInTheDocument();
    expect(screen.getByText("— - —")).toBeInTheDocument();
    expect(screen.getByLabelText("Iniciada")).toBeInTheDocument();
  });

  it("shows leader badge when member is leader", () => {
    renderWithIntl(
      <StaffQueueMemberRow
        member={{ ...memberWithActivity, isLeader: true }}
        href="/queues/lead"
      />,
    );

    expect(screen.getByText("Líder")).toBeInTheDocument();
  });

  it("shows the assign-warn badge on a low unfinished assignment count", () => {
    renderWithIntl(
      <StaffQueueMemberRow
        member={{ ...memberWithActivity, assignedCount: 1 }}
        href="/queues/c1"
      />,
    );

    expect(
      screen.getByLabelText("Alice: 1 subtarefa(s) atribuída(s)"),
    ).toHaveTextContent("1");
  });

  it("hides the assign-warn badge when the assignment count is above the max", () => {
    renderWithIntl(
      <StaffQueueMemberRow
        member={memberWithActivity}
        href="/queues/c1"
      />,
    );

    expect(
      screen.queryByLabelText(/subtarefa\(s\) atribuída\(s\)/),
    ).not.toBeInTheDocument();
  });
});
