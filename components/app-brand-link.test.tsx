import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AppBrandLink } from "@/components/app-brand-link";
import { APP_LOGO_MARK } from "@/lib/assets/branding";
import { renderWithIntl } from "@/test/test-utils";

vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    ...props
  }: {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    className?: string;
  }) => <img src={src} alt={alt} {...props} />,
}));

describe("AppBrandLink", () => {
  it("renders the brand mark image and app name", () => {
    renderWithIntl(<AppBrandLink href="/" />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/");
    expect(link.querySelector("img")).toHaveAttribute("src", APP_LOGO_MARK);
    expect(link.textContent?.length).toBeGreaterThan(0);
  });
});
