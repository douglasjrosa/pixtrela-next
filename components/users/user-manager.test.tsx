import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";

import { renderWithIntl } from "@/test/test-utils";
import { UserManager } from "./user-manager";

const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
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

describe("UserManager", () => {
  it("renders user list", () => {
    renderWithIntl(
      <UserManager
        users={users}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        canDelete={false}
        manageableRoles={["colaborator", "leader", "manager", "admin"]}
      />,
    );
    expect(screen.getByText("Maria")).toBeInTheDocument();
  });

  it("hides user form by default", () => {
    renderWithIntl(
      <UserManager
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
      <UserManager
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
      <UserManager
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
      <UserManager
        users={users}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        canDelete={false}
        manageableRoles={["colaborator"]}
        canSetPassword={false}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Maria" }));
    expect(screen.queryByLabelText("Senha")).not.toBeInTheDocument();
  });

  it("opens create modal when Novo usuário is clicked", () => {
    renderWithIntl(
      <UserManager
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

  it("shows delete action when canDelete is true", () => {
    renderWithIntl(
      <UserManager
        users={[users[0]!]}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        canDelete
        manageableRoles={["colaborator"]}
      />,
    );
    expect(screen.getByRole("button", { name: "Excluir" })).toBeInTheDocument();
  });

  it("opens edit modal when user name is clicked", () => {
    renderWithIntl(
      <UserManager
        users={users}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        canDelete={false}
        manageableRoles={["colaborator"]}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Maria" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Editar usuário" })).toBeInTheDocument();
    expect(screen.getByLabelText("Nome")).toHaveValue("Maria");
    expect(screen.getByLabelText("Código")).toHaveValue(1234);
  });

  it("closes modal on cancel", () => {
    renderWithIntl(
      <UserManager
        users={users}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        canDelete={false}
        manageableRoles={["colaborator"]}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Maria" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("calls onUpdate when saving an edited user", async () => {
    const onUpdate = vi.fn().mockResolvedValue(undefined);
    renderWithIntl(
      <UserManager
        users={users}
        onCreate={vi.fn()}
        onUpdate={onUpdate}
        canDelete={false}
        manageableRoles={["colaborator"]}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Maria" }));
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
      <UserManager
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
    expect(screen.queryByRole("button", { name: "Admin" })).not.toBeInTheDocument();
    expect(screen.getByText("Admin")).toBeInTheDocument();
  });

  it("blocks create when code is already used by another user", async () => {
    const onCreate = vi.fn();
    renderWithIntl(
      <UserManager
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
      <UserManager
        users={users}
        onCreate={vi.fn()}
        onUpdate={onUpdate}
        canDelete={false}
        manageableRoles={["colaborator"]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Maria" }));
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
      <UserManager
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

  it("auto-fills login from name and code on create", () => {
    renderWithIntl(
      <UserManager
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
      <UserManager
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
      <UserManager
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
      <UserManager
        users={users}
        onCreate={vi.fn()}
        onUpdate={onUpdate}
        canDelete={false}
        manageableRoles={["colaborator"]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Maria" }));
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
});
