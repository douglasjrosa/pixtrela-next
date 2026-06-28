import { describe, expect, it, vi } from "vitest";

const toastSuccess = vi.fn();
const toastError = vi.fn();

vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: (...args: unknown[]) => toastError(...args),
  },
}));

describe("app-toast", () => {
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
});
