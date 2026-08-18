import { describe, expect, it, vi, beforeEach } from "vitest";
import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithIntl } from "@/test/test-utils";
import type { KioskSubTask } from "@/lib/business/subtask-queue";

const refresh = vi.fn();
const startSubTask = vi.fn();
const joinLiveChain = vi.fn();
const startChain = vi.fn();
const exitSubTask = vi.fn();
const showSuccessToast = vi.fn();
const showErrorToast = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

vi.mock("@/lib/ui/app-toast", () => ({
  showSuccessToast: (...args: unknown[]) => showSuccessToast(...args),
  showErrorToast: (...args: unknown[]) => showErrorToast(...args),
}));

vi.mock("@/lib/welcome/kiosk-welcome-ready", () => ({
  markKioskColaboratorReady: vi.fn(),
}));

vi.mock("./actions", () => ({
  startSubTask: (...args: unknown[]) => startSubTask(...args),
  joinLiveChain: (...args: unknown[]) => joinLiveChain(...args),
  startChain: (...args: unknown[]) => startChain(...args),
  exitSubTask: (...args: unknown[]) => exitSubTask(...args),
  advanceChainRun: vi.fn(),
  confirmChainStop: vi.fn(),
}));

import { KioskPanelClient } from "./kiosk-panel-client";

function waitingTask(): KioskSubTask {
  return {
    documentId: "st-1",
    name: "Cortar",
    index: 0,
    status: "waiting",
    activationStatus: "unlocked",
    qty: 1,
    targetQty: 1,
    completedQty: 0,
    sharingType: "duration",
    timeSpent: 0,
    startedAt: null,
    expectedTime: 60,
    taskDocumentId: "task-1",
    taskName: "Caixa",
    taskIndex: 0,
    finishedAt: null,
    activeWorkerCount: 0,
  };
}

describe("KioskPanelClient", () => {
  beforeEach(() => {
    refresh.mockReset();
    startSubTask.mockReset();
    joinLiveChain.mockReset();
    startChain.mockReset();
    exitSubTask.mockReset();
    showSuccessToast.mockReset();
    showErrorToast.mockReset();
  });

  it("shows the producing card immediately while start is in flight", async () => {
    const user = userEvent.setup();
    let resolveStart!: () => void;
    const startGate = new Promise<void>((resolve) => {
      resolveStart = resolve;
    });
    startSubTask.mockImplementation(async () => startGate);

    renderWithIntl(
      <KioskPanelClient
        colaboratorId="u-1"
        colaboratorName="Ana"
        subTasks={[waitingTask()]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Iniciar" }));

    expect(screen.getByRole("heading", { name: "Em execução" })).toBeInTheDocument();
    expect(screen.getByText("Cortar")).toBeInTheDocument();
    expect(screen.queryByText("Processando...")).not.toBeInTheDocument();
    expect(startSubTask).toHaveBeenCalledWith("u-1", "st-1");

    await act(async () => {
      resolveStart();
    });
  });

  it("keeps the producing card and shows processing on exit confirm", async () => {
    const user = userEvent.setup();
    let resolveExit!: () => void;
    const exitGate = new Promise<void>((resolve) => {
      resolveExit = resolve;
    });
    exitSubTask.mockImplementation(async () => {
      await exitGate;
      return { remainingWorkerNames: [] };
    });

    renderWithIntl(
      <KioskPanelClient
        colaboratorId="u-1"
        colaboratorName="Ana"
        subTasks={[
          {
            ...waitingTask(),
            status: "producing",
            startedAt: "2026-08-17T23:00:00.000Z",
            activeWorkerCount: 1,
          },
        ]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Sair da subtarefa" }));
    await user.click(screen.getByRole("button", { name: "Sim, concluí" }));

    expect(screen.getByRole("heading", { name: "Em execução" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Processando..." })).toBeDisabled();
    expect(showSuccessToast).not.toHaveBeenCalled();

    await act(async () => {
      resolveExit();
    });
    expect(showSuccessToast).toHaveBeenCalledWith("Saída registrada.");
  });
});