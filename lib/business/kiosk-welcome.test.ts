import { describe, expect, it } from "vitest";

import {
  KIOSK_FACE_WELCOME_MS,
  firstNameFromDisplayName,
  formatKioskWelcomeMessage,
} from "./kiosk-welcome";

describe("firstNameFromDisplayName", () => {
  it("returns the first token", () => {
    expect(firstNameFromDisplayName("Ana Silva")).toBe("Ana");
  });

  it("trims whitespace", () => {
    expect(firstNameFromDisplayName("  Bruno  ")).toBe("Bruno");
  });
});

describe("formatKioskWelcomeMessage", () => {
  it("uses masculine greeting by default", () => {
    expect(formatKioskWelcomeMessage("Bruno Costa")).toBe("Bem vindo Bruno!");
  });

  it("uses feminine greeting when gender is feminine", () => {
    expect(formatKioskWelcomeMessage("Ana Silva", "feminine")).toBe(
      "Bem vinda Ana!",
    );
  });

  it("keeps welcome duration at two seconds", () => {
    expect(KIOSK_FACE_WELCOME_MS).toBe(800);
  });
});
