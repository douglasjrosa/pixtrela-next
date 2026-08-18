import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AppBrandLink } from "@/components/app-brand-link";
import { renderWithIntl } from "@/test/test-utils";

describe("AppBrandLink", () => {
  it("renders the brand mark image when logoUrl is provided", () => {
    renderWithIntl(
      <AppBrandLink href="/" logoUrl="https://media.example/logo.png" />,
    );

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/");
    expect(link.querySelector("img")).toHaveAttribute(
      "src",
      "https://media.example/logo.png",
    );
    expect(link.textContent?.length).toBeGreaterThan(0);
  });

  it("renders name only when logoUrl is missing", () => {
    renderWithIntl(<AppBrandLink href="/home" />);
    const link = screen.getByRole("link");
    expect(link.querySelector("img")).toBeNull();
    expect(link).toHaveAttribute("href", "/home");
  });

  it("applies background color behind the logo mark", () => {
    renderWithIntl(
      <AppBrandLink
        href="/"
        logoUrl="https://media.example/logo.png"
        menuLogoBackgroundColor="#ffffff"
        menuLogoBackgroundColorOpacity={40}
      />,
    );

    const wrapper = screen.getByRole("link").querySelector("span");
    expect(wrapper).toHaveStyle({ backgroundColor: "rgba(255, 255, 255, 0.4)" });
  });
});
