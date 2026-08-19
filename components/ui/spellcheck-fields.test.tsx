import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { APP_LOCALE } from "@/lib/i18n/locale";

describe("Textarea", () => {
  it("disables browser spellcheck and sets app locale for Portuguese text", () => {
    const { container } = render(<Textarea id="notes" />);
    const textarea = container.querySelector("textarea");

    expect(textarea).toHaveAttribute("lang", APP_LOCALE);
    expect(textarea).toHaveAttribute("spellcheck", "false");
  });
});

describe("Input", () => {
  it("disables browser spellcheck on text fields", () => {
    const { container } = render(<Input id="name" />);
    const input = container.querySelector("input");

    expect(input).toHaveAttribute("lang", APP_LOCALE);
    expect(input).toHaveAttribute("spellcheck", "false");
  });

  it("leaves spellcheck unset on password fields", () => {
    const { container } = render(<Input id="password" type="password" />);
    const input = container.querySelector("input");

    expect(input).toHaveAttribute("lang", APP_LOCALE);
    expect(input).not.toHaveAttribute("spellcheck");
  });
});
