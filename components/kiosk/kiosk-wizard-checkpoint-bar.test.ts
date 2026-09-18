import { describe, expect, it } from "vitest";

import {
  isWizardConnectorComplete,
  resolveWizardCheckpointState,
} from "./kiosk-wizard-checkpoint-bar";

describe("kiosk wizard checkpoint bar", () => {
  it("marks steps before the current index as completed", () => {
    expect(resolveWizardCheckpointState(0, 2)).toBe("completed");
    expect(resolveWizardCheckpointState(1, 2)).toBe("completed");
    expect(resolveWizardCheckpointState(2, 2)).toBe("current");
    expect(resolveWizardCheckpointState(3, 2)).toBe("upcoming");
  });

  it("marks connectors before the current step as complete", () => {
    expect(isWizardConnectorComplete(0, 0)).toBe(false);
    expect(isWizardConnectorComplete(0, 1)).toBe(true);
    expect(isWizardConnectorComplete(1, 2)).toBe(true);
    expect(isWizardConnectorComplete(2, 2)).toBe(false);
  });
});
