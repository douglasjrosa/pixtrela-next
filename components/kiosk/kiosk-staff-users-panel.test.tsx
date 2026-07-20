import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { saveKioskColaboratorFacePhoto, saveKioskColaboratorPassword } from "@/app/kiosk/staff/[userId]/users/actions";
import { KIOSK_HOME_PATH } from "@/lib/auth/colaborator-routes";
import { renderWithIntl } from "@/test/test-utils";
import { KioskStaffUsersPanel } from "./kiosk-staff-users-panel";

vi.mock("@/app/kiosk/staff/[userId]/users/actions", () => ({
  saveKioskColaboratorPassword: vi.fn(),
  saveKioskColaboratorFacePhoto: vi.fn(),
}));

const savePassword = vi.mocked(saveKioskColaboratorPassword);
const saveFacePhoto = vi.mocked(saveKioskColaboratorFacePhoto);
const showSuccessToast = vi.fn();
const showErrorToast = vi.fn();
const replace = vi.fn();

vi.mock("@/lib/ui/app-toast", () => ({
  showSuccessToast: (...args: unknown[]) => showSuccessToast(...args),
  showErrorToast: (...args: unknown[]) => showErrorToast(...args),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

const colaborators = [
  { documentId: "c1", name: "Ana Costa", code: 1001 },
  { documentId: "c2", name: "Bruno Lima", code: 1002 },
];

async function openPasswordForm(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /Ana Costa/i }));
}

async function submitPassword(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Senha"), "secret1");
  await user.type(screen.getByLabelText("Re-senha"), "secret1");
  await user.click(screen.getByRole("button", { name: "Salvar" }));
}

describe("KioskStaffUsersPanel", () => {
  beforeEach(() => {
    savePassword.mockReset();
    saveFacePhoto.mockReset();
    showSuccessToast.mockReset();
    showErrorToast.mockReset();
    replace.mockReset();
    savePassword.mockResolvedValue({ ok: true });
    saveFacePhoto.mockResolvedValue({
      ok: true,
      facePhotoUrl: "/uploads/face.jpg",
    });
  });
  it("shows face photo and password forms after selecting a colaborator", async () => {
    const user = userEvent.setup();

    renderWithIntl(
      <KioskStaffUsersPanel
        userId="admin-1"
        colaborators={colaborators}
        canSignOut={false}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Ana Costa/i }));

    expect(screen.getByRole("heading", { name: "Ana Costa" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Foto para reconhecimento facial" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Bruno Lima")).toBeNull();
    expect(screen.getByRole("button", { name: "Voltar para a lista" })).toBeInTheDocument();
  });

  it("returns to the list when back is clicked", async () => {
    const user = userEvent.setup();

    renderWithIntl(
      <KioskStaffUsersPanel
        userId="admin-1"
        colaborators={colaborators}
        canSignOut={false}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Ana Costa/i }));
    await user.click(screen.getByRole("button", { name: "Voltar para a lista" }));

    expect(screen.getByText("Bruno Lima")).toBeInTheDocument();
    expect(screen.queryByLabelText("Senha")).toBeNull();
  });

  it("redirects to kiosk home with success toast after saving password", async () => {
    const user = userEvent.setup();

    renderWithIntl(
      <KioskStaffUsersPanel
        userId="admin-1"
        colaborators={colaborators}
        canSignOut={false}
      />,
    );

    await openPasswordForm(user);
    await submitPassword(user);

    expect(savePassword).toHaveBeenCalledWith("admin-1", "c1", {
      password: "secret1",
      confirmPassword: "secret1",
    });
    expect(showSuccessToast).toHaveBeenCalledWith("Senha salva com sucesso.");
    expect(replace).toHaveBeenCalledWith(KIOSK_HOME_PATH);
    expect(showErrorToast).not.toHaveBeenCalled();
  });

  it("redirects to kiosk home with error toast when save fails", async () => {
    const user = userEvent.setup();
    savePassword.mockResolvedValueOnce({ ok: false, error: "forbidden" });

    renderWithIntl(
      <KioskStaffUsersPanel
        userId="admin-1"
        colaborators={colaborators}
        canSignOut={false}
      />,
    );

    await openPasswordForm(user);
    await submitPassword(user);

    expect(showErrorToast).toHaveBeenCalledWith("Não foi possível alterar a senha.");
    expect(replace).toHaveBeenCalledWith(KIOSK_HOME_PATH);
    expect(showSuccessToast).not.toHaveBeenCalled();
  });
});
