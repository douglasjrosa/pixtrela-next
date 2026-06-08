import { describe, expect, it, vi } from "vitest";

import { SessionExpiredNotice } from "./session-expired-notice";

vi.mock("next-auth/react", () => ({
  signOut: vi.fn().mockResolvedValue(undefined),
}));

describe("SessionExpiredNotice", () => {
  it("shows message when session expired", async () => {
    const { renderWithIntl } = await import("@/test/test-utils");
    const { screen } = await import("@testing-library/react");

    renderWithIntl(<SessionExpiredNotice reason="sessionExpired" />);
    expect(
      screen.getByText("Sua sessão expirou. Entre novamente para continuar."),
    ).toBeInTheDocument();
  });

  it("renders nothing for other reasons", async () => {
    const { renderWithIntl } = await import("@/test/test-utils");
    const { screen } = await import("@testing-library/react");

    const { container } = renderWithIntl(
      <SessionExpiredNotice reason="other" />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
