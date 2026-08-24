import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import { ColaboratorDocumentPanel } from "./colaborator-document-panel";

const pathname = { value: "/colab-1/store" };

vi.mock("next/navigation", () => ({
  usePathname: () => pathname.value,
}));

describe("ColaboratorDocumentPanel", () => {
  it("keeps a mobile-width store shell and disables page scroll", () => {
    pathname.value = "/colab-1/store";
    render(
      <ColaboratorDocumentPanel>
        <span>loja</span>
      </ColaboratorDocumentPanel>,
    );

    const panel = screen.getByText("loja").parentElement;
    expect(panel?.className).toContain("max-w-lg");
    expect(panel?.className).toContain("overflow-hidden");
    expect(panel?.className).not.toContain("overflow-y-auto");
  });

  it("keeps the default scrollable panel on other colaborator pages", () => {
    pathname.value = "/colab-1";
    render(
      <ColaboratorDocumentPanel>
        <span>home</span>
      </ColaboratorDocumentPanel>,
    );

    const panel = screen.getByText("home").parentElement;
    expect(panel?.className).toContain("overflow-y-auto");
    expect(panel?.className).toContain("max-w-lg");
  });
});
