import { describe, expect, it } from "vitest";

import {
  canAccessOwnProfile,
  canAccessRoute,
  canEditUserLogin,
  canPairUserTag,
  canPreviewKioskColaborator,
  canSetUserPassword,
  canDeactivateTasks,
  canDeleteTasks,
  canExchange,
  canAdjustColaboratorBalance,
  canDeactivateAwards,
  canDeleteAwards,
  canManageAwards,
  canViewAwards,
  canViewExchanges,
  canUpdateExchangeShoppingPrices,
  canManageTasks,
  canDeactivateTemplates,
  canDeleteTemplates,
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

describe("canDeactivateTemplates", () => {
  it("allows admin and manager", () => {
    expect(canDeactivateTemplates("admin")).toBe(true);
    expect(canDeactivateTemplates("manager")).toBe(true);
  });

  it("denies leader and below", () => {
    expect(canDeactivateTemplates("leader")).toBe(false);
    expect(canDeactivateTemplates("colaborator")).toBe(false);
    expect(canDeactivateTemplates("kiosk")).toBe(false);
  });
});

describe("canDeleteTemplates", () => {
  it("allows admin only", () => {
    expect(canDeleteTemplates("admin")).toBe(true);
    expect(canDeleteTemplates("manager")).toBe(false);
    expect(canDeleteTemplates("leader")).toBe(false);
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

describe("canViewAwards", () => {
  it("allows manager and admin", () => {
    expect(canViewAwards("admin")).toBe(true);
    expect(canViewAwards("manager")).toBe(true);
    expect(canViewAwards("leader")).toBe(false);
  });
});

describe("canAdjustColaboratorBalance", () => {
  it("allows manager and admin only", () => {
    expect(canAdjustColaboratorBalance("admin")).toBe(true);
    expect(canAdjustColaboratorBalance("manager")).toBe(true);
    expect(canAdjustColaboratorBalance("leader")).toBe(false);
    expect(canAdjustColaboratorBalance("colaborator")).toBe(false);
  });
});

describe("canDeactivateAwards", () => {
  it("allows manager and admin", () => {
    expect(canDeactivateAwards("admin")).toBe(true);
    expect(canDeactivateAwards("manager")).toBe(true);
    expect(canDeactivateAwards("leader")).toBe(false);
  });
});

describe("canDeleteAwards", () => {
  it("allows admin only", () => {
    expect(canDeleteAwards("admin")).toBe(true);
    expect(canDeleteAwards("manager")).toBe(false);
  });
});

describe("canViewExchanges", () => {
  it("allows leader and above", () => {
    expect(canViewExchanges("leader")).toBe(true);
    expect(canViewExchanges("manager")).toBe(true);
    expect(canViewExchanges("admin")).toBe(true);
    expect(canViewExchanges("colaborator")).toBe(false);
    expect(canViewExchanges("kiosk")).toBe(false);
  });
});

describe("canUpdateExchangeShoppingPrices", () => {
  it("allows manager and admin only", () => {
    expect(canUpdateExchangeShoppingPrices("admin")).toBe(true);
    expect(canUpdateExchangeShoppingPrices("manager")).toBe(true);
    expect(canUpdateExchangeShoppingPrices("leader")).toBe(false);
    expect(canUpdateExchangeShoppingPrices("colaborator")).toBe(false);
  });
});

describe("canAccessRoute teams", () => {
  it("allows teams only for admin and manager", () => {
    expect(canAccessRoute("admin", "/teams")).toBe(true);
    expect(canAccessRoute("manager", "/teams")).toBe(true);
    expect(canAccessRoute("leader", "/teams")).toBe(false);
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

describe("canPairUserTag", () => {
  it("allows admin and manager", () => {
    expect(canPairUserTag("admin")).toBe(true);
    expect(canPairUserTag("manager")).toBe(true);
  });

  it("denies leader and below", () => {
    expect(canPairUserTag("leader")).toBe(false);
    expect(canPairUserTag("colaborator")).toBe(false);
    expect(canPairUserTag("kiosk")).toBe(false);
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
    expect(canAccessRoute("colaborator", "/col-1/profile", "col-1")).toBe(true);
    expect(canAccessRoute("colaborator", "/col-1/store", "col-1")).toBe(true);
    expect(canAccessRoute("colaborator", "/col-1/store/cart", "col-1")).toBe(
      true,
    );
    expect(canAccessRoute("colaborator", "/kiosk", "col-1")).toBe(false);
    expect(canAccessRoute("manager", "/balance")).toBe(false);
    expect(canAccessRoute("manager", "/col-1/store", "mgr-1")).toBe(false);
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

  it("allows exchanges for leader and above", () => {
    expect(canAccessRoute("leader", "/exchanges")).toBe(true);
    expect(canAccessRoute("manager", "/exchanges/batch-1")).toBe(true);
    expect(canAccessRoute("colaborator", "/exchanges", "col-1")).toBe(false);
  });

  it("allows own profile for manager and leader", () => {
    expect(canAccessRoute("manager", "/mgr-1/profile", "mgr-1")).toBe(true);
    expect(canAccessRoute("leader", "/lead-1/profile", "lead-1")).toBe(true);
    expect(canAccessRoute("manager", "/other/profile", "mgr-1")).toBe(false);
    expect(canAccessRoute("admin", "/admin-1/profile", "admin-1")).toBe(false);
  });
});

describe("canAccessOwnProfile", () => {
  it("allows colaborator, leader and manager only", () => {
    expect(canAccessOwnProfile("colaborator")).toBe(true);
    expect(canAccessOwnProfile("leader")).toBe(true);
    expect(canAccessOwnProfile("manager")).toBe(true);
    expect(canAccessOwnProfile("admin")).toBe(false);
    expect(canAccessOwnProfile("kiosk")).toBe(false);
  });
});
