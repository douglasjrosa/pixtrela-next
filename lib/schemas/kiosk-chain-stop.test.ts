import { describe, expect, it } from "vitest";

import { parseChainStopAnswers } from "./kiosk-chain-stop";

describe("parseChainStopAnswers", () => {
  it("accepts an empty list for a peer who leaves without a wizard", () => {
    expect(parseChainStopAnswers([])).toEqual([]);
  });

  it("keeps a duration answer that does not finish the chain", () => {
    expect(
      parseChainStopAnswers([{ documentId: "a", completed: false }]),
    ).toEqual([{ documentId: "a", completed: false }]);
  });

  it("rejects an answer without a document id", () => {
    expect(() => parseChainStopAnswers([{ completed: true }])).toThrow();
  });
});
