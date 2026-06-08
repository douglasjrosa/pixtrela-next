"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  USER_ROLES,
  userFormSchema,
  type UserFormInput,
} from "@/lib/schemas/user";

export interface UserRow {
  /** Strapi users-permissions numeric id (required for mutations). */
  id: number;
  documentId: string;
  name: string;
  username: string;
  code: number;
  roleType: UserFormInput["roleType"];
}

export interface UserManagerProps {
  users: UserRow[];
  onCreate: (values: UserFormInput) => void | Promise<void>;
  onUpdate: (userId: number, values: UserFormInput) => void | Promise<void>;
  onDelete?: (userId: number) => void | Promise<void>;
  canDelete: boolean;
  /** Precomputed on the server — do not pass predicate functions from RSC. */
  manageableRoles: UserFormInput["roleType"][];
}

const EMPTY_FORM: UserFormInput = {
  name: "",
  username: "",
  password: "",
  code: 0,
  roleType: "colaborator",
};

function canEditUser(
  user: UserRow,
  manageableRoles: UserFormInput["roleType"][],
): boolean {
  return manageableRoles.includes(user.roleType);
}

function roleOptionsForUser(
  user: UserRow | null,
  manageableRoles: UserFormInput["roleType"][],
): UserFormInput["roleType"][] {
  if (manageableRoles.length === 0) {
    return USER_ROLES.slice(0, 0);
  }
  if (!user) {
    return manageableRoles;
  }
  if (manageableRoles.includes(user.roleType)) {
    return manageableRoles;
  }
  return [user.roleType, ...manageableRoles];
}

export function UserManager({
  users,
  onCreate,
  onUpdate,
  onDelete,
  canDelete,
  manageableRoles,
}: UserManagerProps) {
  const tCommon = useTranslations("common");
  const tUsers = useTranslations("users");
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const editingUser =
    users.find((user) => user.id === editingUserId) ?? null;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserFormInput>({
    resolver: zodResolver(userFormSchema),
    defaultValues: EMPTY_FORM,
  });

  function startCreate(): void {
    setEditingUserId(null);
    reset(EMPTY_FORM);
    setMessage(null);
  }

  function startEdit(user: UserRow): void {
    setEditingUserId(user.id);
    reset({
      name: user.name,
      username: user.username,
      password: "",
      code: user.code,
      roleType: user.roleType,
    });
    setMessage(null);
  }

  function onSubmit(values: UserFormInput): void {
    const payload: UserFormInput = { ...values };
    if (!payload.password) {
      delete payload.password;
    }

    startTransition(async () => {
      if (editingUserId !== null) {
        await onUpdate(editingUserId, payload);
      } else {
        await onCreate(payload);
      }
      setMessage(tUsers("saved"));
      setEditingUserId(null);
      reset(EMPTY_FORM);
    });
  }

  function handleDelete(userId: number): void {
    if (!onDelete || !window.confirm(tCommon("delete"))) return;
    startTransition(async () => {
      await onDelete(userId);
      setMessage(tUsers("deleted"));
    });
  }

  const roleOptions = roleOptionsForUser(editingUser, manageableRoles);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{tUsers("title")}</h1>
        <Button type="button" variant="outline" onClick={startCreate}>
          {tUsers("newUser")}
        </Button>
      </div>

      {message ? (
        <p role="status" className="text-sm text-muted-foreground">
          {message}
        </p>
      ) : null}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid gap-4 rounded-lg border p-4 sm:grid-cols-2"
      >
        <h2 className="sm:col-span-2 text-lg font-semibold">
          {editingUserId !== null ? tUsers("editUser") : tUsers("newUser")}
        </h2>

        <div className="space-y-2">
          <Label htmlFor="name">{tUsers("name")}</Label>
          <Input id="name" {...register("name")} />
          {errors.name ? (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="username">{tUsers("username")}</Label>
          <Input id="username" {...register("username")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">{tUsers("password")}</Label>
          <Input id="password" type="password" {...register("password")} />
          {editingUserId !== null ? (
            <p className="text-xs text-muted-foreground">
              {tUsers("passwordOptional")}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="code">{tUsers("code")}</Label>
          <Input
            id="code"
            type="number"
            min={0}
            {...register("code", { valueAsNumber: true })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="roleType">{tUsers("role")}</Label>
          <select
            id="roleType"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            {...register("roleType")}
          >
            {roleOptions.map((role) => (
              <option key={role} value={role}>
                {tUsers(`roles.${role}`)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2 sm:col-span-2">
          <Button type="submit" disabled={isPending}>
            {editingUserId !== null ? tCommon("save") : tCommon("create")}
          </Button>
          {editingUserId !== null ? (
            <Button type="button" variant="outline" onClick={startCreate}>
              {tCommon("cancel")}
            </Button>
          ) : null}
        </div>
      </form>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="py-2">{tUsers("name")}</th>
            <th>{tUsers("code")}</th>
            <th>{tUsers("role")}</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.documentId} className="border-b">
              <td className="py-2">
                {canEditUser(user, manageableRoles) ? (
                  <button
                    type="button"
                    className="text-left hover:underline"
                    onClick={() => startEdit(user)}
                  >
                    {user.name}
                  </button>
                ) : (
                  user.name
                )}
              </td>
              <td>{user.code}</td>
              <td>{tUsers(`roles.${user.roleType}`)}</td>
              <td>
                {canDelete && onDelete ? (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={isPending}
                    onClick={() => handleDelete(user.id)}
                  >
                    {tCommon("delete")}
                  </Button>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
