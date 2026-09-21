import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AppFormSkeleton } from "./app-form-skeleton";

describe("AppFormSkeleton", () => {
  it("announces the label and renders the default fields", () => {
    render(<AppFormSkeleton label="Loading..." />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
    expect(document.querySelectorAll("[aria-hidden]")).toHaveLength(4);
  });
});
