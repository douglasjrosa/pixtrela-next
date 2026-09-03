import { describe, expect, it, vi, beforeEach } from "vitest";
import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithIntl } from "@/test/test-utils";
import type { KioskSubTask } from "@/lib/business/subtask-queue";
import type { KioskQueueSectionPage } from "@/lib/repos/kiosk-subtasks";
import type { OpenChainRun } from "@/lib/business/kiosk-queue-units";

const fetchSectionPage = vi.fn();
const refreshMaterialFlags = vi.fn();
const startSubTask = vi.fn();
const joinLiveChain = vi.fn();
const startChain = vi.fn();
const exitSubTask = vi.fn();
const advanceChainRun = vi.fn();
const confirmChainStop = vi.fn();
const showSuccessToast = vi.fn();
const showErrorToast = vi.fn();

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
  advanceChainRun: (...args: unknown[]) => advanceChainRun(...args),
  confirmChainStop: (...args: unknown[]) => confirmChainStop(...args),
  releaseMaterialFlag: vi.fn(),
  refreshMaterialFlags: (...args: unknown[]) => refreshMaterialFlags(...args),
  fetchKioskQueueSectionPage: (...args: unknown[]) => fetchSectionPage(...args),
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

function liberadasPage(
  units: KioskQueueSectionPage["units"],
  producingUnits: KioskQueueSectionPage["producingUnits"] = [],
  openRuns: OpenChainRun[] = [],
): KioskQueueSectionPage {
  const subTasks = [
    ...producingUnits.flatMap((unit) =>
      unit.type === "isolated" ? [unit.subTask] : unit.members,
    ),
    ...units.flatMap((unit) =>
      unit.type === "isolated" ? [unit.subTask] : unit.members,
    ),
  ];
  return {
    section: "liberadas",
    producingUnits,
    units,
    nextCursor: null,
    hasMore: false,
    openRuns,
    subTasks,
    catalog: subTasks,
    queuePageSize: 15,
  };
}

describe("KioskPanelClient", () => {
  beforeEach(() => {
    fetchSectionPage.mockReset();
    fetchSectionPage.mockImplementation(async () => liberadasPage([]));
    refreshMaterialFlags.mockReset();
    refreshMaterialFlags.mockResolvedValue({
      flags: [],
      categoryId: null,
      requiresMaterialFlagsOnFinish: false,
    });
    startSubTask.mockReset();
    joinLiveChain.mockReset();
    startChain.mockReset();
    exitSubTask.mockReset();
    advanceChainRun.mockReset();
    advanceChainRun.mockResolvedValue(undefined);
    confirmChainStop.mockReset();
    confirmChainStop.mockResolvedValue(undefined);
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
    fetchSectionPage.mockResolvedValue(
      liberadasPage([], [
        {
          type: "isolated",
          subTask: {
            ...waitingTask(),
            status: "producing",
            startedAt: "2026-08-17T23:00:00.000Z",
            activeWorkerCount: 1,
          },
          helperMode: false,
          showStart: false,
        },
      ]),
    );

    renderWithIntl(
      <KioskPanelClient
        colaboratorId="u-1"
        colaboratorName="Ana"
        initialLiberadas={liberadasPage([
          {
            type: "isolated",
            subTask: waitingTask(),
            helperMode: false,
            showStart: true,
          },
        ])}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Iniciar" }));

    expect(screen.getByRole("heading", { name: "Liberadas" })).toBeInTheDocument();
    expect(screen.getByText("Cortar")).toBeInTheDocument();
    expect(screen.queryByText("Processando...")).not.toBeInTheDocument();
    expect(startSubTask).toHaveBeenCalledWith("u-1", "st-1");

    await act(async () => {
      resolveStart();
      await Promise.resolve();
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

    const producing = {
      ...waitingTask(),
      status: "producing" as const,
      startedAt: "2026-08-17T23:00:00.000Z",
      activeWorkerCount: 1,
      requiresMaterialFlagsOnFinish: false,
      availableFlags: [],
    };
    const page = liberadasPage([], [
      {
        type: "isolated",
        subTask: producing,
        helperMode: false,
        showStart: false,
      },
    ]);
    fetchSectionPage.mockResolvedValue(page);

    renderWithIntl(
      <KioskPanelClient
        colaboratorId="u-1"
        colaboratorName="Ana"
        initialLiberadas={page}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Sair da subtarefa" }));
    await user.click(screen.getByRole("button", { name: "Sim, concluí" }));

    expect(screen.getByRole("heading", { name: "Liberadas" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Processando..." })).toBeDisabled();
    expect(showSuccessToast).not.toHaveBeenCalled();

    await act(async () => {
      resolveExit();
      await Promise.resolve();
    });
    expect(showSuccessToast).toHaveBeenCalledWith("Saída registrada.");
  });

  it("keeps chain stop enabled after background auto-advance", async () => {
    const user = userEvent.setup();
    const members = [
      {
        ...waitingTask(),
        documentId: "a",
        name: "Cortar",
        status: "producing" as const,
        startedAt: "2026-08-16T12:00:00.000Z",
        activeWorkerCount: 1,
      },
      {
        ...waitingTask(),
        documentId: "b",
        name: "Embalar",
        index: 1,
        linkedToPrevious: true,
      },
    ];
    const openRuns = [
      {
        chainHeadId: "a",
        chainRunId: "run-1",
        principalId: "u-1",
        runStartedAt: "2026-08-16T12:00:00.000Z",
      },
    ];
    const page = liberadasPage(
      [],
      [
        {
          type: "group",
          headId: "a",
          memberIds: ["a", "b"],
          members,
          locked: false,
          principalActive: true,
          chainRunId: "run-1",
          runStartedAt: "2026-08-16T12:00:00.000Z",
          showStart: false,
        },
      ],
      openRuns,
    );
    fetchSectionPage.mockResolvedValue(page);

    renderWithIntl(
      <KioskPanelClient
        colaboratorId="u-1"
        colaboratorName="Ana"
        initialLiberadas={page}
      />,
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(advanceChainRun).toHaveBeenCalledWith("run-1");
    const stopButton = screen.getByRole("button", { name: "Parar" });
    expect(stopButton).toBeEnabled();
    await user.click(stopButton);
    expect(
      screen.getAllByText("A subtarefa foi concluída?").length,
    ).toBeGreaterThan(0);
  });

  it("confirms chain stop with the persisted run id", async () => {
    const user = userEvent.setup();
    const members = [
      {
        ...waitingTask(),
        documentId: "a",
        name: "Cortar",
        status: "producing" as const,
        startedAt: "2026-08-16T12:00:00.000Z",
        activeWorkerCount: 1,
      },
      {
        ...waitingTask(),
        documentId: "b",
        name: "Embalar",
        index: 1,
        linkedToPrevious: true,
      },
    ];
    const openRuns = [
      {
        chainHeadId: "a",
        chainRunId: "run-1",
        principalId: "u-1",
        runStartedAt: "2026-08-16T12:00:00.000Z",
      },
    ];
    const page = liberadasPage(
      [],
      [
        {
          type: "group",
          headId: "a",
          memberIds: ["a", "b"],
          members,
          locked: false,
          principalActive: true,
          chainRunId: "run-1",
          runStartedAt: "2026-08-16T12:00:00.000Z",
          showStart: false,
        },
      ],
      openRuns,
    );
    fetchSectionPage.mockResolvedValue(page);

    renderWithIntl(
      <KioskPanelClient
        colaboratorId="u-1"
        colaboratorName="Ana"
        initialLiberadas={page}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Parar" }));
    const yesButtons = screen.getAllByRole("button", { name: "Sim, concluí" });
    await user.click(yesButtons[0]!);
    await user.click(yesButtons[1]!);
    await user.click(screen.getByRole("button", { name: "Confirmar saída" }));

    expect(confirmChainStop).toHaveBeenCalledWith("u-1", "run-1", [
      { documentId: "a", completed: true },
      { documentId: "b", completed: true },
    ]);
    expect(showSuccessToast).toHaveBeenCalledWith("Saída registrada.");
  });
});
