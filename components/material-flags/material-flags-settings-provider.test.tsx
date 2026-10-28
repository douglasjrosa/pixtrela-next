import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import {
  MaterialFlagsSettingsProvider,
  useMaterialFlagsEnabled,
} from "./material-flags-settings-provider";

function Probe() {
  const enabled = useMaterialFlagsEnabled();
  return <span>{enabled ? "on" : "off"}</span>;
}

describe("MaterialFlagsSettingsProvider", () => {
  it("defaults to enabled outside a provider", () => {
    render(<Probe />);
    expect(screen.getByText("on")).toBeInTheDocument();
  });

  it("exposes the disabled flag to descendants", () => {
    render(
      <MaterialFlagsSettingsProvider enabled={false}>
        <Probe />
      </MaterialFlagsSettingsProvider>,
    );
    expect(screen.getByText("off")).toBeInTheDocument();
  });
});
