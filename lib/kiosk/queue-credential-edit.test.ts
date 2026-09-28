import { describe, expect, it } from "vitest";

import { showQueueCredentialPasswordForm } from "./queue-credential-edit";

describe("showQueueCredentialPasswordForm", () => {
  it("hides the password form on the staff member's own queue", () => {
    expect(showQueueCredentialPasswordForm("lead-1", "lead-1")).toBe(false);
  });

  it("shows the password form for another person and for self-service", () => {
    expect(showQueueCredentialPasswordForm("lead-1", "col-1")).toBe(true);
    expect(showQueueCredentialPasswordForm(undefined, "col-1")).toBe(true);
  });

  it("never shows the password form for a leader queue target", () => {
    expect(showQueueCredentialPasswordForm("mgr-1", "lead-1", "leader")).toBe(
      false,
    );
  });
});
