import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";

import { renderWithIntl } from "@/test/test-utils";

const mockPathname = { value: "/templates/tasks" };

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname.value,
}));

import { SectionTabs } from "./section-tabs";

describe("SectionTabs", () => {
  it("renders tab links and marks the active route", () => {
    mockPathname.value = "/templates/tasks";

    renderWithIntl(
      <SectionTabs
        ariaLabel="Modelos"
        items={[
          { href: "/templates/tasks", label: "Tarefas" },
          { href: "/templates/subtasks", label: "Subtarefas" },
        ]}
      />,
    );

    expect(screen.getByRole("link", { name: "Tarefas" })).toHaveAttribute(
      "href",
      "/templates/tasks",
    );
    expect(screen.getByRole("link", { name: "Tarefas" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(
      screen.getByRole("link", { name: "Subtarefas" }),
    ).not.toHaveAttribute("aria-current");
  });

  it("marks detail routes under a tab as active", () => {
    mockPathname.value = "/templates/tasks/tpl-1";

    renderWithIntl(
      <SectionTabs
        ariaLabel="Modelos"
        items={[
          { href: "/templates/tasks", label: "Tarefas" },
          { href: "/templates/subtasks", label: "Subtarefas" },
        ]}
      />,
    );

    expect(screen.getByRole("link", { name: "Tarefas" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });
});
