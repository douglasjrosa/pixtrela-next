import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";

import { renderWithIntl } from "@/test/test-utils";
import { UserManager } from "./user-manager";

const users = [
  {
    id: 1,
    documentId: "u1",
    name: "Maria",
    username: "maria.1234",
    code: 1234,
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

  it("shows create form with role select", () => {
    renderWithIntl(
      <UserManager
        users={[]}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        canDelete={false}
        manageableRoles={["colaborator"]}
      />,
    );
    expect(screen.getByRole("heading", { name: "Novo usuário" })).toBeInTheDocument();
    expect(screen.getByLabelText("Função")).toBeInTheDocument();
    expect(screen.getByText("Colaborador")).toBeInTheDocument();
    expect(screen.queryByText("Administrador")).not.toBeInTheDocument();
  });

  it("shows delete action when canDelete is true", () => {
    renderWithIntl(
      <UserManager
        users={users}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        canDelete
        manageableRoles={["colaborator"]}
      />,
    );
    expect(screen.getByRole("button", { name: "Excluir" })).toBeInTheDocument();
  });

  it("loads user into form when name is clicked", () => {
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
    expect(screen.getByRole("heading", { name: "Editar usuário" })).toBeInTheDocument();
    expect(screen.getByLabelText("Nome")).toHaveValue("Maria");
    expect(screen.getByLabelText("Código")).toHaveValue(1234);
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
});
