import { describe, expect, it } from "vitest";

import {
  BOARD_LIVE_PROGRESS_DATA_PROP_KEYS,
  pickBoardLiveProgressDataProps,
} from "@/components/board/board-live-progress";
import {
  hasNoFunctionValues,
  isJsonSerializable,
} from "@/lib/server/serializable-props";

describe("BoardLiveProgress RSC data props", () => {
  it("pickBoardLiveProgressDataProps stays JSON-serializable", () => {
    expect(BOARD_LIVE_PROGRESS_DATA_PROP_KEYS).not.toContain("children");
    const props = pickBoardLiveProgressDataProps({
      tasks: [
        {
          id: 1,
          documentId: "t1",
          name: "Task",
          qty: 1,
          status: "producing",
          stepId: 1,
          index: 0,
          deliveryDate: null,
          totalExpectedTime: 60,
          totalTimeSpent: 10,
        },
      ],
      steps: [{ id: 1, name: "Produção" }],
      teams: [],
      interactive: true,
      assignWarnMax: 4,
      assignedCountByColaboratorId: { "u-1": 2 },
      paymentCurrency: {
        iconUrl: "https://cdn.example/star.png",
        currencyPerSecond: 2,
        pluralTitle: "Estrelas",
      },
    });

    expect(hasNoFunctionValues(props)).toBe(true);
    expect(isJsonSerializable(props)).toBe(true);
    expect("children" in props).toBe(false);
  });
});
