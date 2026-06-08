import { describe, expect, it } from "vitest";

import {
  canAccessRoute,
  canDeleteTasks,
  canExchange,
  canManageAwards,
  canManageTasks,
  canManageTeams,
  canViewBalance,
  canViewUsers,
} from "./permissions";

describe("canManageTasks", () => {
  it("allows admin, manager and leader", () => {
    expect(canManageTasks("admin")).toBe(true);
    expect(canManageTasks("manager")).toBe(true);
    expect(canManageTasks("leader")).toBe(true);
  });

  it("denies colaborator and kiosk", () => {
    expect(canManageTasks("colaborator")).toBe(false);
    expect(canManageTasks("kiosk")).toBe(false);
  });
});

describe("canDeleteTasks", () => {
  it("allows admin only", () => {
    expect(canDeleteTasks("admin")).toBe(true);
    expect(canDeleteTasks("manager")).toBe(false);
    expect(canDeleteTasks("leader")).toBe(false);
  });
});

describe("canExchange", () => {
  it("allows colaborator only", () => {
    expect(canExchange("colaborator")).toBe(true);
    expect(canExchange("leader")).toBe(false);
  });
});

describe("canViewBalance", () => {
  it("allows colaborator only", () => {
    expect(canViewBalance("colaborator")).toBe(true);
    expect(canViewBalance("admin")).toBe(false);
  });
});

describe("canManageTeams", () => {
  it("allows admin and manager", () => {
    expect(canManageTeams("admin")).toBe(true);
    expect(canManageTeams("manager")).toBe(true);
    expect(canManageTeams("leader")).toBe(false);
  });
});

describe("canManageAwards", () => {
  it("allows admin only", () => {
    expect(canManageAwards("admin")).toBe(true);
    expect(canManageAwards("manager")).toBe(false);
  });
});

describe("canViewUsers", () => {
  it("allows leader and above", () => {
    expect(canViewUsers("leader")).toBe(true);
    expect(canViewUsers("colaborator")).toBe(false);
    expect(canViewUsers("kiosk")).toBe(false);
  });
});

describe("canAccessRoute", () => {
  it("restricts colaborator to own private path", () => {
    expect(canAccessRoute("colaborator", "/balance", "col-1")).toBe(false);
    expect(canAccessRoute("colaborator", "/col-1", "col-1")).toBe(true);
    expect(canAccessRoute("colaborator", "/kiosk", "col-1")).toBe(false);
    expect(canAccessRoute("manager", "/balance")).toBe(false);
  });

  it("allows kiosk only on kiosk paths", () => {
    expect(canAccessRoute("kiosk", "/kiosk")).toBe(true);
    expect(canAccessRoute("kiosk", "/kiosk/col-1")).toBe(true);
    expect(canAccessRoute("kiosk", "/board")).toBe(false);
    expect(canAccessRoute("kiosk", "/col-1")).toBe(false);
  });

  it("allows board for staff roles", () => {
    expect(canAccessRoute("leader", "/board")).toBe(true);
  });
});
