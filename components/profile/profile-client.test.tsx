import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";

import { renderWithIntl } from "@/test/test-utils";

import { ProfileClient } from "./profile-client";

vi.mock("next-auth/react", () => ({
  signIn: vi.fn(),
}));

vi.mock("@/app/[documentId]/profile/actions", () => ({
  changeOwnPassword: vi.fn(),
  updateOwnAvatar: vi.fn(),
  updateOwnPersonal: vi.fn(),
}));

vi.mock("@/lib/media/compress-profile-image", () => ({
  compressProfileImage: vi.fn(async (file: File) => file),
}));

vi.mock("@/components/kiosk/face-oval-capture", () => ({
  FaceOvalCapture: () => <div>capture</div>,
}));

vi.mock("@/lib/ui/app-toast", () => ({
  showErrorToast: vi.fn(),
  showSuccessToast: vi.fn(),
}));

const personal = {
  name: "Ana",
  lastName: "Silva",
  email: "ana@example.com",
  phone: "11987654321",
};

describe("ProfileClient", () => {
  it("renders profile title, personal fields, avatar and password", () => {
    renderWithIntl(
      <ProfileClient userName="Ana Silva" avatarUrl={null} personal={personal} />,
    );

    expect(screen.getByRole("heading", { name: "Meu perfil" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Dados pessoais" })).toBeInTheDocument();
    expect(screen.getByLabelText("Nome")).toHaveValue("Ana");
    expect(screen.getByLabelText("Sobrenome")).toHaveValue("Silva");
    expect(screen.getByLabelText("E-mail")).toHaveValue("ana@example.com");
    expect(screen.getByLabelText("Celular")).toHaveValue("11987654321");
    expect(screen.getByRole("button", { name: "Tirar foto" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Enviar foto" })).toBeInTheDocument();
    expect(screen.getByLabelText("Senha atual")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Salvar" })).toBeNull();
  });

  it("shows one shared Save when personal data is dirty", async () => {
    renderWithIntl(
      <ProfileClient userName="Ana Silva" avatarUrl={null} personal={personal} />,
    );

    fireEvent.change(screen.getByLabelText("Nome"), {
      target: { value: "Ana Paula" },
    });

    expect(
      await screen.findByRole("button", { name: "Salvar" }),
    ).toBeInTheDocument();
  });

  it("shows one shared Save when password is dirty", async () => {
    renderWithIntl(
      <ProfileClient userName="Ana Silva" avatarUrl={null} personal={personal} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Alterar senha" }));
    fireEvent.change(screen.getByLabelText("Senha atual"), {
      target: { value: "oldpass1" },
    });

    expect(
      await screen.findByRole("button", { name: "Salvar" }),
    ).toBeInTheDocument();
  });
});
