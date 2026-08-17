import { act, fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";

import messages from "@/messages/pt-BR.json";
import { renderWithIntl } from "@/test/test-utils";
import { KIOSK_HOME_PATH } from "@/lib/auth/colaborator-routes";
import { KIOSK_IDLE_MS } from "@/lib/business/kiosk-idle";

import {
  KioskIdleProvider,
  useKioskIdleContext,
} from "./kiosk-idle-provider";
import { KioskIdleLockIndicator } from "./kiosk-idle-lock-indicator";

const pathname = vi.hoisted(() => ({ current: "/kiosk" }));
const replace = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => pathname.current,
}));

function IdleProbe() {
  const ctx = useKioskIdleContext();
  return (
    <div>
      <span data-testid="phase">{ctx.phase}</span>
      <button type="button" onClick={() => ctx.startAuthCountdown(() => {})}>
        start-auth
      </button>
      <button type="button" onClick={() => ctx.clearAuthCountdown()}>
        clear-auth-home
      </button>
      <button
        type="button"
        onClick={() => ctx.clearAuthCountdown({ navigatingAway: true })}
      >
        clear-auth-navigate
      </button>
    </div>
  );
}

function buildTree(withIndicator = false) {
  return (
    <KioskIdleProvider sessionIdleMs={KIOSK_IDLE_MS}>
      <IdleProbe />
      {withIndicator ? <KioskIdleLockIndicator /> : null}
    </KioskIdleProvider>
  );
}

function withIntl(ui: ReturnType<typeof buildTree>) {
  return (
    <NextIntlClientProvider locale="pt-BR" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
}

async function navigateToColaboratorPanel(
  view: ReturnType<typeof render>,
  rerenderTree: ReactElement,
  clearMode: "home" | "navigate",
): Promise<void> {
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "start-auth" }));
    fireEvent.click(
      screen.getByRole("button", {
        name:
          clearMode === "home" ? "clear-auth-home" : "clear-auth-navigate",
      }),
    );
    pathname.current = "/kiosk/colaborator-1";
    view.rerender(rerenderTree);
  });
}

describe("KioskIdleProvider", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    pathname.current = "/kiosk";
    replace.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("keeps session phase active after auth clear races with colaborator navigation", async () => {
    const ui = buildTree();
    const view = render(ui);

    await navigateToColaboratorPanel(view, ui, "home");

    expect(screen.getByTestId("phase")).toHaveTextContent("active");
  });

  it("shows the open lock and runs session idle after identify navigation", async () => {
    const ui = buildTree(true);
    const view = renderWithIntl(ui);

    await navigateToColaboratorPanel(view, withIntl(ui), "navigate");

    expect(screen.getByTestId("phase")).toHaveTextContent("active");
    expect(
      screen.getByRole("button", { name: "Encerrar sessão do totem" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("img", { name: "Totem aguardando identificação" }),
    ).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(KIOSK_IDLE_MS + 200);
    });

    expect(replace).toHaveBeenCalledWith(KIOSK_HOME_PATH);
  });
});
