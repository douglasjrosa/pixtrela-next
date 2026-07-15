import { describe, expect, it } from "vitest";

import {
  canAccessRoute,
  canEditUserLogin,
  canPreviewKioskColaborator,
  canSetUserPassword,
  canWriteKioskNfc,
  canDeactivateTasks,
  canDeleteTasks,
  canExchange,
  canManageAwards,
  canManageTasks,
  canManageTemplates,
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

describe("canDeactivateTasks", () => {
  it("allows admin and manager", () => {
    expect(canDeactivateTasks("admin")).toBe(true);
    expect(canDeactivateTasks("manager")).toBe(true);
  });

  it("denies leader and below", () => {
    expect(canDeactivateTasks("leader")).toBe(false);
    expect(canDeactivateTasks("colaborator")).toBe(false);
    expect(canDeactivateTasks("kiosk")).toBe(false);
  });
});

describe("canDeleteTasks", () => {
  it("allows admin only", () => {
    expect(canDeleteTasks("admin")).toBe(true);
    expect(canDeleteTasks("manager")).toBe(false);
    expect(canDeleteTasks("leader")).toBe(false);
  });
});

describe("canManageTemplates", () => {
  it("allows admin and manager", () => {
    expect(canManageTemplates("admin")).toBe(true);
    expect(canManageTemplates("manager")).toBe(true);
  });

  it("denies leader and below", () => {
    expect(canManageTemplates("leader")).toBe(false);
    expect(canManageTemplates("colaborator")).toBe(false);
    expect(canManageTemplates("kiosk")).toBe(false);
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

describe("canSetUserPassword", () => {
  it("allows admin only", () => {
    expect(canSetUserPassword("admin")).toBe(true);
    expect(canSetUserPassword("manager")).toBe(false);
    expect(canSetUserPassword("leader")).toBe(false);
    expect(canSetUserPassword("colaborator")).toBe(false);
    expect(canSetUserPassword("kiosk")).toBe(false);
  });
});

describe("canEditUserLogin", () => {
  it("allows admin only", () => {
    expect(canEditUserLogin("admin")).toBe(true);
    expect(canEditUserLogin("manager")).toBe(false);
    expect(canEditUserLogin("leader")).toBe(false);
    expect(canEditUserLogin("colaborator")).toBe(false);
    expect(canEditUserLogin("kiosk")).toBe(false);
  });
});

describe("canWriteKioskNfc", () => {
  it("allows admin and manager", () => {
    expect(canWriteKioskNfc("admin")).toBe(true);
    expect(canWriteKioskNfc("manager")).toBe(true);
  });

  it("denies leader and below", () => {
    expect(canWriteKioskNfc("leader")).toBe(false);
    expect(canWriteKioskNfc("colaborator")).toBe(false);
    expect(canWriteKioskNfc("kiosk")).toBe(false);
  });
});

describe("canPreviewKioskColaborator", () => {
  it("allows admin only", () => {
    expect(canPreviewKioskColaborator("admin")).toBe(true);
    expect(canPreviewKioskColaborator("manager")).toBe(false);
    expect(canPreviewKioskColaborator("leader")).toBe(false);
    expect(canPreviewKioskColaborator("colaborator")).toBe(false);
    expect(canPreviewKioskColaborator("kiosk")).toBe(false);
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
