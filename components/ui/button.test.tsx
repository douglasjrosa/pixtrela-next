import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { Button, buttonVariants } from "./button";

describe("buttonVariants", () => {
  it("maps default variant to primary fill classes", () => {
    expect(buttonVariants({ variant: "default" })).toContain("bg-primary");
    expect(buttonVariants({ variant: "default" })).toContain(
      "text-primary-foreground",
    );
  });

  it("keeps outline/ghost/link/destructive off the primary fill", () => {
    expect(buttonVariants({ variant: "outline" })).not.toContain("bg-primary");
    expect(buttonVariants({ variant: "ghost" })).not.toContain("bg-primary");
    expect(buttonVariants({ variant: "link" })).not.toContain("bg-primary");
    expect(buttonVariants({ variant: "destructive" })).not.toContain(
      "bg-primary",
    );
  });
});

describe("Button", () => {
  it("renders the default variant with primary classes", () => {
    render(<Button type="button">Save</Button>);
    const button = screen.getByRole("button", { name: "Save" });
    expect(button).toHaveClass("bg-primary");
    expect(button).toHaveClass("text-primary-foreground");
  });
});
