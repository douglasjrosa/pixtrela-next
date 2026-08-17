import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";

import { renderWithIntl } from "@/test/test-utils";
import type { UserManagerProps } from "./user-manager";
import { UserManager } from "./user-manager";
import { UserListRowPresentational } from "./user-list-row-presentational";
import type { UserRow } from "./types";

const refresh = vi.fn();
const push = vi.fn();
const showSuccessToast = vi.fn();
const showErrorToast = vi.fn();
const isNfcReadSupported = vi.fn();
const readNfcSerialNumberOnce = vi.fn();
const isNfcOnCooldown = vi.fn();
const getNfcCooldownRemainingMs = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh, push, replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/lib/ui/app-toast", () => ({
  showSuccessToast: (...args: unknown[]) => showSuccessToast(...args),
  showErrorToast: (...args: unknown[]) => showErrorToast(...args),
}));

vi.mock("@/lib/kiosk/nfc-cooldown", () => ({
  isNfcOnCooldown: () => isNfcOnCooldown(),
  getNfcCooldownRemainingMs: () => getNfcCooldownRemainingMs(),
}));

vi.mock("@/lib/kiosk/nfc-read", () => ({
  isNfcReadSupported: () => isNfcReadSupported(),
  mapNfcReadError: (error: unknown) =>
    error instanceof Error && error.message === "denied"
      ? "permissionDenied"
      : "readFailed",
  NfcReadError: class NfcReadError extends Error {
    code: string;
    constructor(code: string) {
      super(code);
      this.code = code;
    }
  },
  readNfcSerialNumberOnce: (...args: unknown[]) =>
    readNfcSerialNumberOnce(...args),
}));

const users = [
  {
    id: 1,
    documentId: "u1",
    name: "Maria",
    username: "maria.1234",
    code: 1234,
    roleType: "colaborator" as const,
  },
  {
    id: 2,
    documentId: "u2",
    name: "João",
    username: "joao.5678",
    code: 5678,
    roleType: "colaborator" as const,
  },
];

function TestUserManager({
  users: listUsers = [],
  ...props
}: Omit<UserManagerProps, "existingUsers" | "children"> & {
  users?: UserRow[];
}) {
  return (
    <UserManager existingUsers={listUsers} {...props}>
      <table>
        <tbody>
          {listUsers.map((user) => (
            <UserListRowPresentational
              key={user.documentId}
              user={user}
              variant="table"
              labels={{ role: user.roleType }}
            />
          ))}
        </tbody>
      </table>
    </UserManager>
  );
}

describe("UserManager", () => {
  beforeEach(() => {
    showSuccessToast.mockReset();
    showErrorToast.mockReset();
    isNfcReadSupported.mockReturnValue(true);
    isNfcOnCooldown.mockReturnValue(false);
    getNfcCooldownRemainingMs.mockReturnValue(0);
    readNfcSerialNumberOnce.mockReset();
    readNfcSerialNumberOnce.mockResolvedValue("04A3B2C1");
  });

  it("renders user list", () => {
    renderWithIntl(
      <TestUserManager
        users={users}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        canDelete={false}
        manageableRoles={["colaborator", "leader", "manager", "admin"]}
      />,
    );
    expect(screen.getAllByText("Maria").length).toBeGreaterThan(0);
  });

  it("hides user form by default", () => {
    renderWithIntl(
      <TestUserManager
        users={users}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        canDelete={false}
        manageableRoles={["colaborator"]}
      />,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Nome")).not.toBeInTheDocument();
  });

  it("shows password field for admin on create", () => {
    renderWithIntl(
      <TestUserManager
        users={[]}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        canDelete={false}
        manageableRoles={["colaborator", "leader", "manager", "admin"]}
        canSetPassword
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Novo usuário" }));
    expect(screen.getByLabelText("Senha")).toBeInTheDocument();
  });

  it("hides password field for manager on create", () => {
    renderWithIntl(
      <TestUserManager
        users={[]}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        canDelete={false}
        manageableRoles={["leader", "colaborator"]}
        canSetPassword={false}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Novo usuário" }));
    expect(screen.queryByLabelText("Senha")).not.toBeInTheDocument();
  });

  it("hides password field for leader on edit", () => {
    renderWithIntl(
      <TestUserManager
        users={users}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        canDelete={false}
        manageableRoles={["colaborator"]}
        canSetPassword={false}
      />,
    );
    fireEvent.click(screen.getAllByRole("button", { name: "Maria" })[0]!);
    expect(screen.queryByLabelText("Senha")).not.toBeInTheDocument();
  });

  it("opens create modal when Novo usuário is clicked", () => {
    renderWithIntl(
      <TestUserManager
        users={[]}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        canDelete={false}
        manageableRoles={["colaborator"]}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Novo usuário" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Novo usuário" })).toBeInTheDocument();
    expect(screen.getByLabelText("Função")).toBeInTheDocument();
    expect(screen.getByText("Colaborador")).toBeInTheDocument();
    expect(screen.queryByText("Administrador")).not.toBeInTheDocument();
  });

  it("shows delete action in edit modal when canDelete is true", () => {
    renderWithIntl(
      <TestUserManager
        users={[users[0]!]}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        canDelete
        manageableRoles={["colaborator"]}
      />,
    );
    expect(screen.queryByRole("button", { name: "Excluir" })).toBeNull();
    fireEvent.click(screen.getAllByRole("button", { name: "Maria" })[0]!);
    expect(screen.getByRole("button", { name: "Excluir" })).toBeInTheDocument();
  });

  it("shows deactivate action for manageable users when canDeactivate", () => {
    renderWithIntl(
      <TestUserManager
        users={[users[0]!]}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        onDeactivate={vi.fn()}
        canDelete={false}
        canDeactivate
        manageableRoles={["colaborator"]}
      />,
    );
    expect(screen.queryByRole("button", { name: "Desativar" })).toBeNull();
    fireEvent.click(screen.getAllByRole("button", { name: "Maria" })[0]!);
    expect(screen.getByRole("button", { name: "Desativar" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Excluir" })).toBeNull();
  });

  it("hides deactivate when user role is not manageable", () => {
    const leaderUser = {
      ...users[0]!,
      id: 3,
      documentId: "u3",
      name: "Ana",
      roleType: "leader" as const,
    };
    renderWithIntl(
      <TestUserManager
        users={[leaderUser]}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        onDeactivate={vi.fn()}
        canDelete={false}
        canDeactivate
        manageableRoles={["colaborator"]}
      />,
    );
    // Leader is not manageable — row is not editable / no open link.
    expect(screen.queryByRole("link", { name: "Ana" })).toBeNull();
  });

  it("hides deactivate for already blocked users", () => {
    const blockedUser = { ...users[0]!, blocked: true };
    renderWithIntl(
      <TestUserManager
        users={[blockedUser]}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        onDeactivate={vi.fn()}
        canDelete={false}
        canDeactivate
        manageableRoles={["colaborator"]}
      />,
    );
    fireEvent.click(screen.getAllByRole("button", { name: "Maria" })[0]!);
    expect(screen.queryByRole("button", { name: "Desativar" })).toBeNull();
  });

  it("confirms deactivate and calls onDeactivate", async () => {
    const onDeactivate = vi.fn().mockResolvedValue(undefined);
    renderWithIntl(
      <TestUserManager
        users={[users[0]!]}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        onDeactivate={onDeactivate}
        canDelete={false}
        canDeactivate
        manageableRoles={["colaborator"]}
      />,
    );
    fireEvent.click(screen.getAllByRole("button", { name: "Maria" })[0]!);
    fireEvent.click(screen.getByRole("button", { name: "Desativar" }));
    const confirm = screen.getByRole("dialog", { name: "Desativar usuário" });
    fireEvent.click(within(confirm).getByRole("button", { name: "Desativar" }));
    await waitFor(() => {
      expect(onDeactivate).toHaveBeenCalledWith(1);
    });
  });

  it("shows both deactivate and delete for admin", () => {
    renderWithIntl(
      <TestUserManager
        users={[users[0]!]}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        onDeactivate={vi.fn()}
        onDelete={vi.fn()}
        canDelete
        canDeactivate
        manageableRoles={["colaborator"]}
      />,
    );
    fireEvent.click(screen.getAllByRole("button", { name: "Maria" })[0]!);
    expect(screen.getByRole("button", { name: "Desativar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Excluir" })).toBeInTheDocument();
  });

  it("opens edit modal when user name is clicked", () => {
    renderWithIntl(
      <TestUserManager
        users={users}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        canDelete={false}
        manageableRoles={["colaborator"]}
      />,
    );
    fireEvent.click(screen.getAllByRole("button", { name: "Maria" })[0]!);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Editar usuário" })).toBeInTheDocument();
    expect(screen.getByLabelText("Nome")).toHaveValue("Maria");
    expect(screen.getByLabelText("Código")).toHaveValue(1234);
  });

  it("uses compact modal height and shows user image fields for admin", () => {
    renderWithIntl(
      <TestUserManager
        users={users}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        onUpdateImage={vi.fn()}
        canDelete={false}
        manageableRoles={["colaborator"]}
        canManageImages
      />,
    );

    fireEvent.click(screen.getAllByRole("button", { name: "Maria" })[0]!);

    const body = document.querySelector('[data-slot="form-modal-body"]');
    expect(body?.firstElementChild?.className).not.toContain(
      "min-h-[calc(90dvh-3.5rem)]",
    );
    expect(screen.getByLabelText("Imagem de avatar")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Imagem para reconhecimento facial"),
    ).toBeInTheDocument();
  });

  it("hides user image fields without image management permission", () => {
    renderWithIntl(
      <TestUserManager
        users={users}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        onUpdateImage={vi.fn()}
        canDelete={false}
        manageableRoles={["colaborator"]}
      />,
    );

    fireEvent.click(screen.getAllByRole("button", { name: "Maria" })[0]!);
    expect(screen.queryByLabelText("Imagem de avatar")).not.toBeInTheDocument();
  });

  it("closes modal on cancel", () => {
    renderWithIntl(
      <TestUserManager
        users={users}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        canDelete={false}
        manageableRoles={["colaborator"]}
      />,
    );
    fireEvent.click(screen.getAllByRole("button", { name: "Maria" })[0]!);
    fireEvent.click(screen.getByRole("button", { name: "Fechar" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("calls onUpdate when saving an edited user", async () => {
    const onUpdate = vi.fn().mockResolvedValue(undefined);
    renderWithIntl(
      <TestUserManager
        users={users}
        onCreate={vi.fn()}
        onUpdate={onUpdate}
        canDelete={false}
        manageableRoles={["colaborator"]}
      />,
    );
    fireEvent.click(screen.getAllByRole("button", { name: "Maria" })[0]!);
    fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "Maria Silva" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ name: "Maria Silva", roleType: "colaborator" }),
      );
    });
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(refresh).toHaveBeenCalled();
  });

  it("does not show edit action for users outside manageable roles", () => {
    renderWithIntl(
      <TestUserManager
        users={[
          {
            id: 2,
            documentId: "u2",
            name: "Admin",
            username: "admin.1",
            code: 1,
            roleType: "admin",
          },
        ]}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        canDelete={false}
        manageableRoles={["colaborator"]}
      />,
    );
    expect(screen.queryByRole("link", { name: "Admin" })).not.toBeInTheDocument();
    expect(screen.getAllByText("Admin").length).toBeGreaterThan(0);
  });

  it("blocks create when code is already used by another user", async () => {
    const onCreate = vi.fn();
    renderWithIntl(
      <TestUserManager
        users={users}
        onCreate={onCreate}
        onUpdate={vi.fn()}
        canDelete={false}
        manageableRoles={["colaborator"]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Novo usuário" }));
    fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "Ana" } });
    fireEvent.change(screen.getByLabelText("Código"), {
      target: { value: "1234" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Criar" }));

    expect(
      await screen.findByText("Este código já está em uso por outro usuário."),
    ).toBeInTheDocument();
    expect(onCreate).not.toHaveBeenCalled();
  });

  it("allows saving edit with the user's own code", async () => {
    const onUpdate = vi.fn().mockResolvedValue(undefined);
    renderWithIntl(
      <TestUserManager
        users={users}
        onCreate={vi.fn()}
        onUpdate={onUpdate}
        canDelete={false}
        manageableRoles={["colaborator"]}
      />,
    );

    fireEvent.click(screen.getAllByRole("button", { name: "Maria" })[0]!);
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ code: 1234 }),
      );
    });
  });

  it("allows create with a unique code", async () => {
    const onCreate = vi.fn().mockResolvedValue(undefined);
    renderWithIntl(
      <TestUserManager
        users={users}
        onCreate={onCreate}
        onUpdate={vi.fn()}
        canDelete={false}
        manageableRoles={["colaborator"]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Novo usuário" }));
    fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "Ana" } });
    fireEvent.change(screen.getByLabelText("Código"), {
      target: { value: "9999" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Criar" }));

    await waitFor(() => {
      expect(onCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 9999,
          name: "Ana",
          username: "ana.9999",
        }),
      );
    });
  });

  it("allows create without code", async () => {
    const onCreate = vi.fn().mockResolvedValue(undefined);
    renderWithIntl(
      <TestUserManager
        users={users}
        onCreate={onCreate}
        onUpdate={vi.fn()}
        canDelete={false}
        manageableRoles={["colaborator"]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Novo usuário" }));
    fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "Ana" } });
    fireEvent.click(screen.getByRole("button", { name: "Criar" }));

    await waitFor(() => {
      expect(onCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          code: null,
          name: "Ana",
          username: "ana",
        }),
      );
    });
  });

  it("auto-fills login from name and code on create", () => {
    renderWithIntl(
      <TestUserManager
        users={[]}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        canDelete={false}
        manageableRoles={["colaborator"]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Novo usuário" }));
    fireEvent.change(screen.getByLabelText("Nome"), {
      target: { value: "Ana Maria" },
    });
    fireEvent.change(screen.getByLabelText("Código"), {
      target: { value: "4321" },
    });

    expect(screen.getByLabelText("Login")).toHaveValue("ana.maria.4321");
  });

  it("keeps login read-only for manager and leader", () => {
    renderWithIntl(
      <TestUserManager
        users={[]}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        canDelete={false}
        manageableRoles={["colaborator"]}
        canEditUserLogin={false}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Novo usuário" }));
    expect(screen.getByLabelText("Login")).toHaveAttribute("readonly");
  });

  it("allows admin to override auto-generated login", async () => {
    const onCreate = vi.fn().mockResolvedValue(undefined);
    renderWithIntl(
      <TestUserManager
        users={[]}
        onCreate={onCreate}
        onUpdate={vi.fn()}
        canDelete={false}
        manageableRoles={["colaborator"]}
        canEditUserLogin
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Novo usuário" }));
    fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "Ana" } });
    fireEvent.change(screen.getByLabelText("Código"), {
      target: { value: "9999" },
    });
    fireEvent.change(screen.getByLabelText("Login"), {
      target: { value: "custom.login" },
    });
    fireEvent.change(screen.getByLabelText("Nome"), {
      target: { value: "Ana Maria" },
    });
    expect(screen.getByLabelText("Login")).toHaveValue("custom.login");

    fireEvent.click(screen.getByRole("button", { name: "Criar" }));

    await waitFor(() => {
      expect(onCreate).toHaveBeenCalledWith(
        expect.objectContaining({ username: "custom.login" }),
      );
    });
  });

  it("updates login when editing name and code", async () => {
    const onUpdate = vi.fn().mockResolvedValue(undefined);
    renderWithIntl(
      <TestUserManager
        users={users}
        onCreate={vi.fn()}
        onUpdate={onUpdate}
        canDelete={false}
        manageableRoles={["colaborator"]}
      />,
    );

    fireEvent.click(screen.getAllByRole("button", { name: "Maria" })[0]!);
    fireEvent.change(screen.getByLabelText("Nome"), {
      target: { value: "Maria Silva" },
    });

    expect(screen.getByLabelText("Login")).toHaveValue("maria.silva.1234");

    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          name: "Maria Silva",
          username: "maria.silva.1234",
        }),
      );
    });
  });

  it("shows NFC pair button when canPairUserTag and editing", () => {
    renderWithIntl(
      <TestUserManager
        users={users}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        canDelete={false}
        manageableRoles={["colaborator"]}
        canPairUserTag
        onPairUserTag={vi.fn()}
      />,
    );

    fireEvent.click(screen.getAllByRole("button", { name: "Maria" })[0]!);

    expect(
      screen.getByRole("button", { name: "Vincular chaveiro NFC" }),
    ).toBeInTheDocument();
  });

  it("hides NFC pair button on create modal", () => {
    renderWithIntl(
      <TestUserManager
        users={users}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        canDelete={false}
        manageableRoles={["colaborator"]}
        canPairUserTag
        onPairUserTag={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Novo usuário" }));

    expect(
      screen.queryByRole("button", { name: "Vincular chaveiro NFC" }),
    ).not.toBeInTheDocument();
  });

  it("shows preview button for admin and navigates to kiosk panel", () => {
    renderWithIntl(
      <TestUserManager
        users={users}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        canDelete={false}
        manageableRoles={["colaborator"]}
        canPreviewKioskColaborator
      />,
    );

    fireEvent.click(screen.getAllByRole("button", { name: "Maria" })[0]!);
    fireEvent.click(
      screen.getByRole("button", {
        name: "Visualizar painel do kiosk do colaborador",
      }),
    );

    expect(push).toHaveBeenCalledWith("/kiosk/u1");
    expect(
      screen.queryByRole("button", { name: "Vincular chaveiro NFC" }),
    ).not.toBeInTheDocument();
  });

  it("hides preview button when admin preview is not allowed", () => {
    renderWithIntl(
      <TestUserManager
        users={users}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        canDelete={false}
        manageableRoles={["colaborator"]}
        canPairUserTag
        onPairUserTag={vi.fn()}
      />,
    );

    fireEvent.click(screen.getAllByRole("button", { name: "Maria" })[0]!);

    expect(
      screen.queryByRole("button", {
        name: "Visualizar painel do kiosk do colaborador",
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Vincular chaveiro NFC" }),
    ).toBeInTheDocument();
  });

  it("pairs NFC tag when NFC button is clicked", async () => {
    const onPairUserTag = vi.fn().mockResolvedValue({ ok: true });

    renderWithIntl(
      <TestUserManager
        users={users}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        canDelete={false}
        manageableRoles={["colaborator"]}
        canPairUserTag
        onPairUserTag={onPairUserTag}
      />,
    );

    fireEvent.click(screen.getAllByRole("button", { name: "Maria" })[0]!);
    fireEvent.click(
      screen.getByRole("button", { name: "Vincular chaveiro NFC" }),
    );

    await waitFor(() => {
      expect(readNfcSerialNumberOnce).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(onPairUserTag).toHaveBeenCalledWith(1, "04A3B2C1");
    });
    expect(showSuccessToast).toHaveBeenCalledWith(
      "Aproxime o chaveiro NFC do celular…",
    );
    expect(showSuccessToast).toHaveBeenCalledWith(
      "Chaveiro NFC vinculado ao usuário.",
    );
  });

  it("shows error toast when NFC is not supported", async () => {
    isNfcReadSupported.mockReturnValue(false);

    renderWithIntl(
      <TestUserManager
        users={users}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        canDelete={false}
        manageableRoles={["colaborator"]}
        canPairUserTag
        onPairUserTag={vi.fn()}
      />,
    );

    fireEvent.click(screen.getAllByRole("button", { name: "Maria" })[0]!);
    fireEvent.click(
      screen.getByRole("button", { name: "Vincular chaveiro NFC" }),
    );

    await waitFor(() => {
      expect(showErrorToast).toHaveBeenCalledWith(
        "Seu dispositivo ou navegador não suporta NFC. Use Chrome no Android.",
      );
    });
    expect(readNfcSerialNumberOnce).not.toHaveBeenCalled();
  });
});
