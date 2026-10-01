import { describe, expect, it } from "vitest";

import { showQueueFaceEditForm } from "./queue-face-edit";

describe("showQueueFaceEditForm", () => {
  it("requires allowFaceEdit", () => {
    expect(
      showQueueFaceEditForm("staff-1", "staff-1", "leader", false),
    ).toBe(false);
  });

  it("lets staff edit their own face on their queue", () => {
    expect(
      showQueueFaceEditForm("lead-1", "lead-1", "leader", true),
    ).toBe(true);
    expect(
      showQueueFaceEditForm("mgr-1", "mgr-1", "manager", true),
    ).toBe(true);
  });

  it("lets staff edit a colaborator face from the totem staff queue", () => {
    expect(
      showQueueFaceEditForm("mgr-1", "col-1", "colaborator", true),
    ).toBe(true);
  });

  it("lets staff register a leader or manager face on their queue", () => {
    expect(
      showQueueFaceEditForm("admin-1", "lead-1", "leader", true),
    ).toBe(true);
    expect(
      showQueueFaceEditForm("admin-1", "mgr-1", "manager", true),
    ).toBe(true);
  });

  it("hides the face form for a kiosk device account", () => {
    expect(
      showQueueFaceEditForm("admin-1", "kiosk-1", "kiosk", true),
    ).toBe(false);
  });
});
