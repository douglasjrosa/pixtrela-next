"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Nfc, ScanBarcode } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buildDefaultLogin } from "@/lib/business/default-login";
import { copyKioskColaboratorLink } from "@/lib/kiosk/kiosk-link";
import {
  collectNfcDiagnostics,
  isNfcWriteSupported,
  mapNfcWriteError,
  NfcWriteError,
  writeKioskColaboratorLinkToNfc,
} from "@/lib/kiosk/nfc-write";
import {
  USER_CODE_NOT_UNIQUE_KEY,
  USER_ROLES,
  createUserFormSchema,
  type UserFormInput,
} from "@/lib/schemas/user";
import { showErrorToast, showSuccessToast } from "@/lib/ui/app-toast";

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
  canCopyKioskLink?: boolean;
  /** Admin-only password field in create/edit modal. */
  canSetPassword?: boolean;
  /** Admin-only manual login override in create/edit modal. */
  canEditUserLogin?: boolean;
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

function codeErrorMessage(
  message: string | undefined,
  translate: (key: "codeNotUnique") => string,
): string | undefined {
  if (!message) return undefined;
  if (message === USER_CODE_NOT_UNIQUE_KEY) {
    return translate(USER_CODE_NOT_UNIQUE_KEY);
  }
  return message;
}

interface UserFormDialogProps {
  users: UserRow[];
  editingUser: UserRow | null;
  roleOptions: UserFormInput["roleType"][];
  isPending: boolean;
  canCopyKioskLink: boolean;
  canSetPassword: boolean;
  canEditUserLogin: boolean;
  onClose: () => void;
  onSubmit: (values: UserFormInput) => void;
  onCopyKioskLink: (documentId: string) => Promise<void>;
  onWriteKioskNfc: (documentId: string) => Promise<void>;
  nfcDebugJson: string | null;
}

function UserFormDialog({
  users,
  editingUser,
  roleOptions,
  isPending,
  canCopyKioskLink,
  canSetPassword,
  canEditUserLogin,
  onClose,
  onSubmit,
  onCopyKioskLink,
  onWriteKioskNfc,
  nfcDebugJson,
}: UserFormDialogProps) {
  const tCommon = useTranslations("common");
  const tUsers = useTranslations("users");
  const isEditing = editingUser !== null;
  const formTitleId = "user-form-title";
  const [loginManuallyEdited, setLoginManuallyEdited] = useState(false);

  const formSchema = useMemo(
    () =>
      createUserFormSchema(users, editingUser?.documentId, {
        requirePassword: canSetPassword && !isEditing,
      }),
    [users, editingUser?.documentId, canSetPassword, isEditing],
  );

  const defaultValues = editingUser
    ? {
        name: editingUser.name,
        username: editingUser.username,
        password: "",
        code: editingUser.code,
        roleType: editingUser.roleType,
      }
    : EMPTY_FORM;

  const prevNameCodeRef = useRef({ name: defaultValues.name, code: defaultValues.code });

  const {
    register,
    handleSubmit,
    setValue,
    trigger,
    watch,
    formState: { errors },
  } = useForm<UserFormInput>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const name = watch("name");
  const code = watch("code");

  useEffect(() => {
    const prev = prevNameCodeRef.current;
    if (prev.name === name && prev.code === code) {
      return;
    }
    prevNameCodeRef.current = { name, code };

    if (canEditUserLogin && loginManuallyEdited) {
      return;
    }

    setValue("username", buildDefaultLogin(name, code), { shouldValidate: true });
  }, [name, code, canEditUserLogin, loginManuallyEdited, setValue]);

  const codeError = codeErrorMessage(errors.code?.message, tUsers);
  const usernameRegister = register("username");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={formTitleId}
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border bg-background p-4 shadow-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid gap-4 sm:grid-cols-2"
        >
          <div className="flex items-start justify-between gap-2 sm:col-span-2">
            <h2 id={formTitleId} className="text-lg font-semibold">
              {isEditing ? tUsers("editUser") : tUsers("newUser")}
            </h2>
            {canCopyKioskLink && editingUser ? (
              <div className="flex shrink-0 gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-8"
                  aria-label={tUsers("copyKioskLink")}
                  onClick={() => void onCopyKioskLink(editingUser.documentId)}
                >
                  <ScanBarcode className="size-4" aria-hidden />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-8"
                  aria-label={tUsers("writeKioskNfc")}
                  onClick={() => void onWriteKioskNfc(editingUser.documentId)}
                >
                  <Nfc className="size-4" aria-hidden />
                </Button>
              </div>
            ) : null}
          </div>

          {nfcDebugJson ? (
            <details className="rounded-lg border bg-muted/20 p-3 text-xs sm:col-span-2">
              <summary className="cursor-pointer font-medium">
                {tUsers("nfcDebugTitle")}
              </summary>
              <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-all">
                {nfcDebugJson}
              </pre>
            </details>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="name">{tUsers("name")}</Label>
            <Input id="name" {...register("name")} />
            {errors.name ? (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">{tUsers("username")}</Label>
            <Input
              id="username"
              readOnly={!canEditUserLogin}
              aria-readonly={!canEditUserLogin}
              className={!canEditUserLogin ? "bg-muted" : undefined}
              {...usernameRegister}
              onChange={(event) => {
                if (canEditUserLogin) {
                  setLoginManuallyEdited(true);
                }
                void usernameRegister.onChange(event);
              }}
            />
            {errors.username ? (
              <p className="text-sm text-destructive">{errors.username.message}</p>
            ) : null}
            {canEditUserLogin ? (
              <p className="text-xs text-muted-foreground">
                {tUsers("loginOverrideHint")}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                {tUsers("loginAutoFill")}
              </p>
            )}
          </div>

          {canSetPassword ? (
            <div className="space-y-2">
              <Label htmlFor="password">{tUsers("password")}</Label>
              <Input id="password" type="password" {...register("password")} />
              {isEditing ? (
                <p className="text-xs text-muted-foreground">
                  {tUsers("passwordOptional")}
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="code">{tUsers("code")}</Label>
            <Input
              id="code"
              type="number"
              min={0}
              {...register("code", {
                valueAsNumber: true,
                onBlur: () => {
                  void trigger("code");
                },
              })}
            />
            {codeError ? (
              <p className="text-sm text-destructive">{codeError}</p>
            ) : null}
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
              {isEditing ? tCommon("save") : tCommon("create")}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              {tCommon("cancel")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function UserManager({
  users,
  onCreate,
  onUpdate,
  onDelete,
  canDelete,
  manageableRoles,
  canCopyKioskLink = false,
  canSetPassword = false,
  canEditUserLogin = false,
}: UserManagerProps) {
  const tCommon = useTranslations("common");
  const tUsers = useTranslations("users");
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [nfcDebugJson, setNfcDebugJson] = useState<string | null>(null);

  const editingUser =
    users.find((user) => user.id === editingUserId) ?? null;

  function closeForm(): void {
    setFormOpen(false);
    setEditingUserId(null);
    setNfcDebugJson(null);
  }

  function startCreate(): void {
    setEditingUserId(null);
    setMessage(null);
    setNfcDebugJson(null);
    setFormOpen(true);
  }

  function startEdit(user: UserRow): void {
    setEditingUserId(user.id);
    setMessage(null);
    setNfcDebugJson(null);
    setFormOpen(true);
  }

  function onSubmit(values: UserFormInput): void {
    const payload: UserFormInput = { ...values };
    if (!canSetPassword || !payload.password) {
      delete payload.password;
    }

    startTransition(async () => {
      if (editingUserId !== null) {
        await onUpdate(editingUserId, payload);
      } else {
        await onCreate(payload);
      }
      setMessage(tUsers("saved"));
      closeForm();
      router.refresh();
    });
  }

  function handleDelete(userId: number): void {
    if (!onDelete || !window.confirm(tCommon("delete"))) return;
    startTransition(async () => {
      await onDelete(userId);
      setMessage(tUsers("deleted"));
      router.refresh();
    });
  }

  async function handleCopyKioskLink(documentId: string): Promise<void> {
    await copyKioskColaboratorLink(documentId, window.location.origin);
    showSuccessToast(tUsers("kioskLinkCopied"));
  }

  async function handleWriteKioskNfc(documentId: string): Promise<void> {
    const diagnostics = await collectNfcDiagnostics();
    const steps: Array<{ step: string; at: string; data?: Record<string, unknown> }> =
      [{ step: "start", at: new Date().toISOString(), data: { documentId } }];

    const publishDebug = (): void => {
      setNfcDebugJson(JSON.stringify({ diagnostics, steps }, null, 2));
    };

    steps.push({
      step: "diagnostics",
      at: new Date().toISOString(),
      data: diagnostics as unknown as Record<string, unknown>,
    });
    publishDebug();

    if (!isNfcWriteSupported()) {
      steps.push({
        step: "blocked-unsupported",
        at: new Date().toISOString(),
        data: {
          hasNdefReader: diagnostics.hasNdefReader,
          hasNdefWriter: diagnostics.hasNdefWriter,
        },
      });
      publishDebug();
      showErrorToast(tUsers("nfcNotSupported"));
      return;
    }

    showSuccessToast(tUsers("nfcHoldTagNear"));
    steps.push({
      step: "write-start",
      at: new Date().toISOString(),
      data: { origin: window.location.origin },
    });
    publishDebug();

    try {
      const result = await writeKioskColaboratorLinkToNfc(
        documentId,
        window.location.origin,
      );
      steps.push({
        step: "write-success",
        at: new Date().toISOString(),
        data: result as unknown as Record<string, unknown>,
      });
      showSuccessToast(tUsers("nfcTagWritten"));
    } catch (error) {
      const code =
        error instanceof NfcWriteError ? error.code : mapNfcWriteError(error);
      steps.push({
        step: "write-failed",
        at: new Date().toISOString(),
        data: {
          code,
          name: error instanceof Error ? error.name : "unknown",
          message: error instanceof Error ? error.message : String(error),
        },
      });
      showErrorToast(tUsers("nfcWriteFailed"));
    } finally {
      publishDebug();
    }
  }

  const roleOptions = roleOptionsForUser(editingUser, manageableRoles);
  const formDialogKey = editingUserId ?? "new";

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

      {formOpen ? (
        <UserFormDialog
          key={formDialogKey}
          users={users}
          editingUser={editingUser}
          roleOptions={roleOptions}
          isPending={isPending}
          canCopyKioskLink={canCopyKioskLink}
          canSetPassword={canSetPassword}
          canEditUserLogin={canEditUserLogin}
          onClose={closeForm}
          onSubmit={onSubmit}
          onCopyKioskLink={handleCopyKioskLink}
          onWriteKioskNfc={handleWriteKioskNfc}
          nfcDebugJson={nfcDebugJson}
        />
      ) : null}

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
