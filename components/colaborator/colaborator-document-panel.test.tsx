import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import { COLABORATOR_STORE_SURFACE_DESKTOP_WIDTH_CLASS } from
  "@/lib/store/store-layout";

import { ColaboratorDocumentPanel } from "./colaborator-document-panel";

const pathname = { value: "/colab-1/store" };

vi.mock("next/navigation", () => ({
  usePathname: () => pathname.value,
}));

describe("ColaboratorDocumentPanel", () => {
  it("widens the store shell on desktop while keeping max-w-lg on mobile", () => {
    pathname.value = "/colab-1/store";
    render(
      <ColaboratorDocumentPanel>
        <span>loja</span>
      </ColaboratorDocumentPanel>,
    );

    const panel = screen.getByText("loja").parentElement;
    expect(panel?.className).toContain("max-w-lg");
    expect(panel?.className).toContain(
      COLABORATOR_STORE_SURFACE_DESKTOP_WIDTH_CLASS.split(" ")[0],
    );
    expect(panel?.className).toContain("md:max-w-4xl");
    expect(panel?.className).toContain("lg:max-w-6xl");
    expect(panel?.className).toContain("overflow-x-hidden");
  });

  it("keeps the default mobile-width panel on other colaborator pages", () => {
    pathname.value = "/colab-1";
    render(
      <ColaboratorDocumentPanel>
        <span>home</span>
      </ColaboratorDocumentPanel>,
    );

    const panel = screen.getByText("home").parentElement;
    expect(panel?.className).toContain("max-w-lg");
    expect(panel?.className).not.toContain("md:max-w-4xl");
    expect(panel?.className).not.toContain("overflow-x-hidden");
  });
});
