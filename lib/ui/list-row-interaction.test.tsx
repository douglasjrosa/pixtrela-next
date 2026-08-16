import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { useListRowNavigateInteraction } from "./list-row-interaction";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

function NavigateRow(props: { href: string; label: string }) {
  const { interactive, activate, ...a11yProps } = useListRowNavigateInteraction(
    props.href,
    props.label,
  );

  return (
    <tr
      data-testid="row"
      data-interactive={interactive}
      onClick={activate}
      {...a11yProps}
    >
      <td>{props.label}</td>
    </tr>
  );
}

describe("useListRowNavigateInteraction", () => {
  it("navigates when the row is clicked", () => {
    push.mockReset();

    render(
      <table>
        <tbody>
          <NavigateRow href="/tasks/t1" label="Montagem" />
        </tbody>
      </table>,
    );

    fireEvent.click(screen.getByRole("link", { name: "Montagem" }));
    expect(push).toHaveBeenCalledWith("/tasks/t1");
  });
});
