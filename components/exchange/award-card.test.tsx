import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithIntl } from "@/test/test-utils";
import { AwardCard } from "./award-card";

vi.mock("next-intl", async () => {
  const actual = await vi.importActual<typeof import("next-intl")>("next-intl");
  return { ...actual, useTranslations: () => (key: string) => key };
});

describe("AwardCard", () => {
  const award = {
    id: "a1",
    title: "Arroz 5kg",
    description: "Pacote de arroz",
    cost: 100,
    currency: "star",
    imageUrl: "/uploads/arroz.png",
  };

  it("shows title, cost and image", () => {
    renderWithIntl(
      <AwardCard
        award={award}
        windowOpen
        balance={200}
        onRedeem={vi.fn()}
      />,
    );
    expect(screen.getByText("Arroz 5kg")).toBeInTheDocument();
    expect(screen.getByText("100")).toBeInTheDocument();
    expect(screen.getByRole("img")).toHaveAttribute("src", "/uploads/arroz.png");
  });

  it("shows remaining stars bar when unaffordable", () => {
    renderWithIntl(
      <AwardCard
        award={award}
        windowOpen
        balance={50}
        onRedeem={vi.fn()}
      />,
    );
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(screen.getByText("starsRemaining")).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("calls onRedeem when affordable and clicked", async () => {
    const onRedeem = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderWithIntl(
      <AwardCard
        award={award}
        windowOpen
        balance={200}
        onRedeem={onRedeem}
      />,
    );
    await user.click(screen.getByRole("button"));
    expect(onRedeem).toHaveBeenCalledWith("a1", "star", 1);
  });
});
