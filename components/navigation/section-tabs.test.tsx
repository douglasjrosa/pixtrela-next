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

  it("uses activePrefix when the tab href is a nested child route", () => {
    mockPathname.value = "/settings/subtasks/flags";

    renderWithIntl(
      <SectionTabs
        ariaLabel="Configurações"
        items={[
          {
            href: "/settings/subtasks/categories",
            activePrefix: "/settings/subtasks",
            label: "Subtarefas",
          },
          { href: "/settings/steps", label: "Etapas" },
        ]}
      />,
    );

    expect(screen.getByRole("link", { name: "Subtarefas" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Etapas" })).not.toHaveAttribute(
      "aria-current",
    );
  });
});
