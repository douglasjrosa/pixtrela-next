import { describe, expect, it } from "vitest";

import {
  CHAIN_STOP_ANSWERS_REQUIRED,
  resolveGroupLeave,
} from "./chain-stop-policy";

describe("resolveGroupLeave", () => {
  it("lets a peer leave without answers while someone else is still in", () => {
    expect(
      resolveGroupLeave({
        openUserIds: ["ana", "bia"],
        colaboratorId: "ana",
        answerCount: 0,
      }),
    ).toBe("peerLeave");
  });

  it("keeps a peer leave from closing even when qty answers were sent", () => {
    expect(
      resolveGroupLeave({
        openUserIds: ["ana", "bia"],
        colaboratorId: "ana",
        answerCount: 2,
      }),
    ).toBe("peerLeave");
  });

  it("requires answers when this person is the last one in the session", () => {
    expect(
      resolveGroupLeave({
        openUserIds: ["ana"],
        colaboratorId: "ana",
        answerCount: 0,
      }),
    ).toBe("answersRequired");
    expect(CHAIN_STOP_ANSWERS_REQUIRED).toBe("chainStopAnswersRequired");
  });

  it("closes the group when the last person sends answers", () => {
    expect(
      resolveGroupLeave({
        openUserIds: ["ana"],
        colaboratorId: "ana",
        answerCount: 2,
      }),
    ).toBe("close");
  });

  it("requires answers when nobody is recorded as open", () => {
    expect(
      resolveGroupLeave({
        openUserIds: [],
        colaboratorId: "ana",
        answerCount: 0,
      }),
    ).toBe("answersRequired");
  });
});
