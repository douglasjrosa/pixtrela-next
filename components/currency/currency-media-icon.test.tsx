import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";

import { CurrencyMediaIcon } from "./currency-media-icon";

describe("CurrencyMediaIcon", () => {
  it("renders an image when url is set", () => {
    const { container } = render(
      <CurrencyMediaIcon url="https://cdn.example/star.png" className="size-4" />,
    );
    const img = container.querySelector("img");
    expect(img).toHaveAttribute("src", "https://cdn.example/star.png");
    expect(img).toHaveClass("size-4");
  });

  it("renders Lucide Currency fallback when url is missing", () => {
    const { container } = render(<CurrencyMediaIcon url={null} />);
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("svg")).not.toBeNull();
  });
});
