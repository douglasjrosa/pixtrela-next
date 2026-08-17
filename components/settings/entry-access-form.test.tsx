import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";

import { renderWithIntl } from "@/test/test-utils";
import { DEFAULT_KIOSK_ENTRY_ACCESS } from "@/lib/business/entry-access";
import { EntryAccessForm } from "./entry-access-form";

const showSuccessToast = vi.fn();
const showErrorToast = vi.fn();
const refresh = vi.fn();

vi.mock("@/lib/ui/app-toast", () => ({
  showSuccessToast: (...args: unknown[]) => showSuccessToast(...args),
  showErrorToast: (...args: unknown[]) => showErrorToast(...args),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

describe("EntryAccessForm", () => {
  beforeEach(() => {
    showSuccessToast.mockReset();
    showErrorToast.mockReset();
    refresh.mockReset();
  });

  it("renders computer and mobile access switches", () => {
    renderWithIntl(
      <EntryAccessForm
        value={DEFAULT_KIOSK_ENTRY_ACCESS}
        onSave={vi.fn()}
      />,
    );
    expect(screen.getByText("Formas de acesso")).toBeInTheDocument();
    expect(screen.getByText("No computador")).toBeInTheDocument();
    expect(screen.getByText("No celular")).toBeInTheDocument();
    expect(screen.getAllByText("Login e senha")).toHaveLength(2);
    expect(screen.getAllByText("Código e senha")).toHaveLength(2);
    expect(screen.getAllByText("Reconhecimento facial")).toHaveLength(2);
    expect(screen.getAllByText("Tag NFC")).toHaveLength(2);
  });

  it("saves when a switch is toggled", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    renderWithIntl(
      <EntryAccessForm
        value={DEFAULT_KIOSK_ENTRY_ACCESS}
        onSave={onSave}
      />,
    );

    const switches = screen.getAllByRole("switch");
    fireEvent.click(switches[3]!);

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          computer: expect.objectContaining({ nfc: true }),
        }),
      );
    });
    expect(showSuccessToast).toHaveBeenCalledWith("Configurações salvas.");
  });
});
