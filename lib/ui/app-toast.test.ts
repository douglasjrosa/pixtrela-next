import { beforeEach, describe, expect, it, vi } from "vitest";

const toastFn = vi.fn();
const toastSuccess = vi.fn();
const toastError = vi.fn();

vi.mock("sonner", () => ({
  toast: Object.assign(
    (...args: unknown[]) => toastFn(...args),
    {
      success: (...args: unknown[]) => toastSuccess(...args),
      error: (...args: unknown[]) => toastError(...args),
    },
  ),
}));

describe("app-toast", () => {
  beforeEach(() => {
    toastFn.mockReset();
    toastSuccess.mockReset();
    toastError.mockReset();
  });

  it("shows success toast", async () => {
    const { showSuccessToast } = await import("./app-toast");
    showSuccessToast("Salvo");
    expect(toastSuccess).toHaveBeenCalledWith("Salvo");
  });

  it("shows error toast", async () => {
    const { showErrorToast } = await import("./app-toast");
    showErrorToast("Erro");
    expect(toastError).toHaveBeenCalledWith("Erro");
  });

  it("shows hint toast that auto-dismisses in 2 seconds", async () => {
    const { HINT_TOAST_DURATION_MS, showHintToast } = await import("./app-toast");
    showHintToast("Primeiro, escolha uma Subtarefa.");
    expect(HINT_TOAST_DURATION_MS).toBe(2000);
    expect(toastFn).toHaveBeenCalledWith("Primeiro, escolha uma Subtarefa.", {
      duration: 2000,
    });
  });

  it("shows confirm toast with yes/no actions", async () => {
    const onYes = vi.fn();
    const onNo = vi.fn();
    const { showConfirmToast } = await import("./app-toast");

    showConfirmToast({
      message: "Tem certeza?",
      yesLabel: "Sim",
      noLabel: "Não",
      onYes,
      onNo,
    });

    expect(toastFn).toHaveBeenCalledOnce();
    const [message, options] = toastFn.mock.calls[0] as [
      string,
      {
        duration: number | typeof Infinity;
        cancel: { label: string; onClick: () => void };
        action: { label: string; onClick: () => void };
      },
    ];
    expect(message).toBe("Tem certeza?");
    expect(options.duration).toBe(Infinity);
    expect(options.cancel.label).toBe("Sim");
    expect(options.action.label).toBe("Não");

    options.cancel.onClick();
    options.action.onClick();
    expect(onYes).toHaveBeenCalledOnce();
    expect(onNo).toHaveBeenCalledOnce();
  });
});
