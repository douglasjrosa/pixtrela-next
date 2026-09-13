import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const svg = readFileSync(
  path.join(process.cwd(), "public/images/star-sheet.svg"),
  "utf8",
);

describe("star-sheet.svg", () => {
  it("cuts a transparent hole instead of a white inner star", () => {
    expect(svg).not.toMatch(/fill="#fff"/i);
    expect(svg).not.toMatch(/fill="#ffffff"/i);
    expect(svg).toMatch(/fill-rule="evenodd"/);
  });

  it("uses currentColor with a concrete black so <img> and CSS backgrounds paint", () => {
    expect(svg).toMatch(/currentColor/);
    expect(svg).toMatch(/color="#111111"/);
    expect(svg).not.toMatch(/var\(--foreground\)/);
  });
});
