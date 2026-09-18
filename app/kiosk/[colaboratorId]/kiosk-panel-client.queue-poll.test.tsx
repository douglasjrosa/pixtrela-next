import { describe, expect, it, vi, beforeEach } from "vitest";
import { act } from "@testing-library/react";

import { renderWithIntl } from "@/test/test-utils";
import type { KioskSubTask } from "@/lib/business/subtask-queue";
import type { KioskQueueSectionPage } from "@/lib/repos/kiosk-subtasks";

const fetchSectionPage = vi.fn();

vi.mock("@/lib/kiosk/kiosk-queue-poll-interval", () => ({
  KIOSK_QUEUE_POLL_MS: 1_000,
}));

vi.mock("@/lib/kiosk/kiosk-toast", () => ({
  showKioskSuccessToast: vi.fn(),
  showKioskErrorToast: vi.fn(),
}));

vi.mock("@/lib/welcome/kiosk-welcome-ready", () => ({
  markKioskColaboratorReady: vi.fn(),
}));

vi.mock("@/app/kiosk/staff/[userId]/users/actions", () => ({
  saveKioskColaboratorPassword: vi.fn(),
  saveKioskColaboratorFacePhoto: vi.fn(),
}));

vi.mock("./actions", () => ({
  startSubTask: vi.fn(),
  joinLiveChain: vi.fn(),
  startChain: vi.fn(),
  exitSubTask: vi.fn(),
  advanceChainRun: vi.fn(),
  confirmChainStop: vi.fn(),
  releaseMaterialFlag: vi.fn(),
  refreshMaterialFlags: vi.fn(),
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

function liberadasPage(): KioskQueueSectionPage {
  const subTask = waitingTask();
  return {
    section: "liberadas",
    producingUnits: [],
    units: [
      {
        type: "isolated",
        subTask,
        helperMode: false,
        showStart: true,
      },
    ],
    nextCursor: null,
    hasMore: false,
    openRuns: [],
    subTasks: [subTask],
    catalog: [subTask],
    queuePageSize: 15,
  };
}

describe("KioskPanelClient queue polling", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    fetchSectionPage.mockReset();
    fetchSectionPage.mockResolvedValue(liberadasPage());
  });

  it("refreshes liberadas on mount and on each poll interval", async () => {
    renderWithIntl(
      <KioskPanelClient
        colaboratorId="u-1"
        colaboratorName="Ana"
        initialLiberadas={liberadasPage()}
      />,
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(fetchSectionPage).toHaveBeenCalledTimes(1);
    expect(fetchSectionPage).toHaveBeenCalledWith({
      colaboratorId: "u-1",
      section: "liberadas",
      staffUserId: undefined,
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_000);
    });
    expect(fetchSectionPage).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });
});
