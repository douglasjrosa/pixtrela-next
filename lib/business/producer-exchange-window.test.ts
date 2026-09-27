import { describe, expect, it } from "vitest";

import { pickProducerExchangeWindow } from "./producer-exchange-window";

describe("pickProducerExchangeWindow", () => {
  const closed = { exchangesFirstDay: 20, exchangesLastDay: 25 };
  const open = { exchangesFirstDay: 1, exchangesLastDay: 31 };
  const midMonth = new Date("2026-09-15T12:00:00.000Z");

  it("returns null when the producer has no teams", () => {
    expect(pickProducerExchangeWindow([], midMonth)).toBeNull();
  });

  it("picks an open led-team window when another team is closed", () => {
    expect(pickProducerExchangeWindow([closed, open], midMonth)).toEqual(open);
  });

  it("falls back to the first window when every team is closed", () => {
    expect(pickProducerExchangeWindow([closed], midMonth)).toEqual(closed);
  });
});
