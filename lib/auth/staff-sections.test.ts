import { describe, expect, it } from "vitest";

import {
  awardsSectionTabs,
  tasksSectionTabs,
  teamsSectionTabs,
} from "./staff-sections";

const labels = {
  tasks: "Tarefas",
  templates: "Modelos",
  queues: "Filas",
  teams: "Equipes",
  users: "Usuários",
  activities: "Atividades",
  awards: "Prêmios",
  exchanges: "Trocas",
};

describe("tasksSectionTabs", () => {
  it("shows only tasks for leader", () => {
    expect(
      tasksSectionTabs("leader", labels, {
        tasks: "/tasks",
        templates: "/templates/tasks",
      }),
    ).toEqual([
      { href: "/tasks", label: "Tarefas", activePrefix: "/tasks" },
    ]);
  });

  it("shows tasks and templates for manager", () => {
    expect(
      tasksSectionTabs("manager", labels, {
        tasks: "/tasks",
        templates: "/templates/tasks",
      }).map((tab) => tab.href),
    ).toEqual(["/tasks", "/templates/tasks"]);
  });
});

describe("teamsSectionTabs", () => {
  it("shows only queues for leader", () => {
    expect(
      teamsSectionTabs("leader", labels, {
        queues: "/queues",
        teams: "/teams",
        users: "/users",
        activities: "/activities",
      }),
    ).toEqual([
      { href: "/queues", label: "Filas", activePrefix: "/queues" },
    ]);
  });

  it("shows all team section tabs for manager", () => {
    expect(
      teamsSectionTabs("manager", labels, {
        queues: "/queues",
        teams: "/teams",
        users: "/users",
        activities: "/activities",
      }).map((tab) => tab.href),
    ).toEqual(["/queues", "/teams", "/users"]);
  });

  it("appends activities after users for admin", () => {
    expect(
      teamsSectionTabs("admin", labels, {
        queues: "/queues",
        teams: "/teams",
        users: "/users",
        activities: "/activities",
      }).map((tab) => tab.href),
    ).toEqual(["/queues", "/teams", "/users", "/activities"]);
  });
});

describe("awardsSectionTabs", () => {
  it("is empty for leader", () => {
    expect(
      awardsSectionTabs("leader", labels, {
        awards: "/awards",
        exchanges: "/exchanges",
      }),
    ).toEqual([]);
  });

  it("shows awards and exchanges for manager", () => {
    expect(
      awardsSectionTabs("manager", labels, {
        awards: "/awards",
        exchanges: "/exchanges",
      }).map((tab) => tab.href),
    ).toEqual(["/awards", "/exchanges"]);
  });
});
