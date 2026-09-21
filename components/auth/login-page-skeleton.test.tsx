import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LoginPageSkeleton } from "./login-page-skeleton";

describe("LoginPageSkeleton", () => {
  it("announces the label", () => {
    render(<LoginPageSkeleton label="Loading..." />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });
});
