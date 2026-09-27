import { describe, expect, it } from "vitest";

import {
  canEditOtherPersonCredentialsOnKiosk,
  canManageColaboratorCredentialsOnKiosk,
} from "./kiosk-credentials-access";

describe("canManageColaboratorCredentialsOnKiosk", () => {
  it("allows leader, manager and admin", () => {
    expect(canManageColaboratorCredentialsOnKiosk("leader")).toBe(true);
    expect(canManageColaboratorCredentialsOnKiosk("manager")).toBe(true);
    expect(canManageColaboratorCredentialsOnKiosk("admin")).toBe(true);
  });

  it("denies colaborator and kiosk roles", () => {
    expect(canManageColaboratorCredentialsOnKiosk("colaborator")).toBe(false);
    expect(canManageColaboratorCredentialsOnKiosk("kiosk")).toBe(false);
  });
});

describe("canEditOtherPersonCredentialsOnKiosk", () => {
  it("allows only the kiosk device session", () => {
    expect(canEditOtherPersonCredentialsOnKiosk("kiosk")).toBe(true);
    expect(canEditOtherPersonCredentialsOnKiosk("admin")).toBe(false);
    expect(canEditOtherPersonCredentialsOnKiosk("manager")).toBe(false);
    expect(canEditOtherPersonCredentialsOnKiosk("leader")).toBe(false);
  });
});
