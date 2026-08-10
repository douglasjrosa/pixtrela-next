"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Nfc, Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormModalShell } from "@/components/ui/form-modal-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buildDefaultLogin } from "@/lib/business/default-login";
import { buildKioskColaboratorPath } from "@/lib/kiosk/kiosk-link";
import {
  getNfcCooldownRemainingMs,
  isNfcOnCooldown,
} from "@/lib/kiosk/nfc-cooldown";
import {
  isNfcReadSupported,
  mapNfcReadError,
  NfcReadError,
  readNfcSerialNumberOnce,
} from "@/lib/kiosk/nfc-read";
import {
  USER_CODE_NOT_UNIQUE_KEY,
  USER_LOGIN_NOT_UNIQUE_KEY,
  USER_ROLES,
  createUserFormSchema,
  type UserFormInput,
} from "@/lib/schemas/user";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import { showErrorToast, showSuccessToast } from "@/lib/ui/app-toast";

import type { UserRow } from "./types";
import {
  UserMediaFields,
  type UserImageType,
} from "./user-media-fields";
import { UsersListView } from "./users-list-view";
import { UsersToolbar } from "./users-toolbar";

export type { UserRow } from "./types";

export interface UserManagerProps {
  users: UserRow[];
  onCreate: (values: UserFormInput) => void | Promise<void>;
  onUpdate: (
    userId: UserRow["id"],
    values: UserFormInput,
  ) => void | Promise<void>;
  onUpdateImage?: (
    userId: UserRow["id"],
    imageType: UserImageType,
    formData: FormData,
  ) => void | Promise<void>;
  onDelete?: (userId: UserRow["id"]) => void | Promise<void>;
  /** Soft-deactivate (blocked). Target must be a manageable role. */
  onDeactivate?: (userId: UserRow["id"]) => void | Promise<void>;
  canDelete: boolean;
  /** Show deactivate for manageable active users. Hard delete uses `canDelete`. */
  canDeactivate?: boolean;
  /** Precomputed on the server — do not pass predicate functions from RSC. */
  manageableRoles: UserFormInput["roleType"][];
  canPairUserTag?: boolean;
  canPreviewKioskColaborator?: boolean;
  /** Admin-only password field in create/edit modal. */
  canSetPassword?: boolean;
  /** Admin-only manual login override in create/edit modal. */
  canEditUserLogin?: boolean;
  /** Admin-only avatar and face recognition image management. */
  canManageImages?: boolean;
  onPairUserTag?: (
    userId: UserRow["id"],
    userTag: string,
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
}

const EMPTY_FORM: UserFormInput = {
  name: "",
  username: "",
  password: "",
  code: 0,
  roleType: "colaborator",
  greetingGender: "masculine",
};

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

function loginErrorMessage(
  message: string | undefined,
  translate: (key: "loginNotUnique") => string,
): string | undefined {
  if (!message) return undefined;
  if (message === USER_LOGIN_NOT_UNIQUE_KEY) {
    return translate(USER_LOGIN_NOT_UNIQUE_KEY);
  }
  return message;
}

function isLoginConflictError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes("email already taken") ||
    message.includes("username already taken")
  );
}

interface UserFormDialogProps {
  users: UserRow[];
  editingUser: UserRow | null;
  roleOptions: UserFormInput["roleType"][];
  isPending: boolean;
  canPairUserTag: boolean;
  canPreviewKioskColaborator: boolean;
  canSetPassword: boolean;
  canEditUserLogin: boolean;
  showDelete: boolean;
  showDeactivate: boolean;
  onClose: () => void;
  onSubmit: (values: UserFormInput) => void;
  onDelete?: () => void;
  onDeactivate?: () => void;
  onPreviewKioskColaborator: (documentId: string) => void;
  onPairUserTag: (userId: UserRow["id"]) => Promise<void>;
  onUpdateImage?: (
    userId: UserRow["id"],
    imageType: UserImageType,
    file: File,
    options?: { faceVector?: number[] },
  ) => void | Promise<void>;
  nfcPairDisabled: boolean;
  canManageImages: boolean;
}

function UserFormDialog({
  users,
  editingUser,
  roleOptions,
  isPending,
  canPairUserTag,
  canPreviewKioskColaborator,
  canSetPassword,
  canEditUserLogin,
  showDelete,
  showDeactivate,
  onClose,
  onSubmit,
  onDelete,
  onDeactivate,
  onPreviewKioskColaborator,
  onPairUserTag,
  onUpdateImage,
  nfcPairDisabled,
  canManageImages,
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
        greetingGender: editingUser.greetingGender ?? "masculine",
      }
    : EMPTY_FORM;

  const prevNameCodeRef = useRef({ name: defaultValues.name, code: defaultValues.code });

  const {
    register,
    handleSubmit,
    control,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<UserFormInput>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const name = useWatch({ control, name: "name" });
  const code = useWatch({ control, name: "code" });

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
  const loginError = loginErrorMessage(errors.username?.message, tUsers);
  const usernameRegister = register("username");
  const formId = "user-form";

  const headerActions =
    (canPreviewKioskColaborator || canPairUserTag) && editingUser ? (
      <div className="flex shrink-0 gap-1">
        {canPreviewKioskColaborator ? (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-8"
            aria-label={tUsers("previewKioskColaborator")}
            onClick={() => onPreviewKioskColaborator(editingUser.documentId)}
          >
            <Eye className="size-4" aria-hidden />
          </Button>
        ) : null}
        {canPairUserTag ? (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-8"
            aria-label={tUsers("pairUserTag")}
            disabled={nfcPairDisabled}
            onClick={() => void onPairUserTag(editingUser.id)}
          >
            <Nfc className="size-4" aria-hidden />
          </Button>
        ) : null}
      </div>
    ) : undefined;

  return (
    <FormModalShell
      open
      title={isEditing ? tUsers("editUser") : tUsers("newUser")}
      titleId={formTitleId}
      onClose={onClose}
      disabled={isPending}
      fillBody={false}
      headerActions={headerActions}
      footerStart={
        showDeactivate || showDelete ? (
          <div className="flex flex-wrap gap-2">
            {showDeactivate && onDeactivate ? (
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={onDeactivate}
              >
                {tUsers("deactivate")}
              </Button>
            ) : null}
            {showDelete && onDelete ? (
              <Button
                type="button"
                variant="destructive"
                disabled={isPending}
                onClick={onDelete}
              >
                {tCommon("delete")}
              </Button>
            ) : null}
          </div>
        ) : undefined
      }
      footerEnd={
        <Button type="submit" form={formId} disabled={isPending}>
          {isEditing ? tCommon("save") : tCommon("create")}
        </Button>
      }
    >
      <form
        id={formId}
        onSubmit={handleSubmit(onSubmit)}
        className="grid gap-4 sm:grid-cols-2"
      >
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
          {loginError ? (
            <p className="text-sm text-destructive">{loginError}</p>
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

        <div className="space-y-2">
          <Label htmlFor="greetingGender">{tUsers("greetingGender")}</Label>
          <select
            id="greetingGender"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            {...register("greetingGender")}
          >
            <option value="masculine">{tUsers("greetingGenderMasculine")}</option>
            <option value="feminine">{tUsers("greetingGenderFeminine")}</option>
          </select>
          <p className="text-xs text-muted-foreground">
            {tUsers("greetingGenderHint")}
          </p>
        </div>

        {isEditing && canManageImages && onUpdateImage ? (
          <UserMediaFields
            userName={editingUser.name}
            avatarUrl={editingUser.avatarUrl}
            facePhotoUrl={editingUser.facePhotoUrl}
            disabled={isPending}
            onUpload={(imageType, file, options) =>
              onUpdateImage(editingUser.id, imageType, file, options)
            }
          />
        ) : null}
      </form>
    </FormModalShell>
  );
}

export function UserManager({
  users,
  onCreate,
  onUpdate,
  onUpdateImage,
  onDelete,
  onDeactivate,
  canDelete,
  canDeactivate = false,
  manageableRoles,
  canPairUserTag = false,
  canPreviewKioskColaborator = false,
  canSetPassword = false,
  canEditUserLogin = false,
  canManageImages = false,
  onPairUserTag,
}: UserManagerProps) {
  const tCommon = useTranslations("common");
  const tUsers = useTranslations("users");
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<UserRow["id"] | null>(
    null,
  );
  const [nameQuery, setNameQuery] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [nfcPairing, setNfcPairing] = useState(false);
  const [nfcCooldownTick, setNfcCooldownTick] = useState(0);

  const nfcPairDisabled = nfcPairing || isNfcOnCooldown();

  useEffect(() => {
    if (!isNfcOnCooldown()) return;
    const intervalId = window.setInterval(() => {
      if (isNfcOnCooldown()) {
        setNfcCooldownTick(Date.now());
        return;
      }
      setNfcCooldownTick(Date.now());
      window.clearInterval(intervalId);
    }, 250);
    return () => window.clearInterval(intervalId);
  }, [nfcPairing, nfcCooldownTick]);

  const editingUser =
    users.find((user) => user.id === editingUserId) ?? null;

  function closeForm(): void {
    setFormOpen(false);
    setEditingUserId(null);
    setDeleteOpen(false);
    setDeactivateOpen(false);
  }

  function startCreate(): void {
    setEditingUserId(null);
    setMessage(null);
    setDeleteOpen(false);
    setDeactivateOpen(false);
    setFormOpen(true);
  }

  function startEdit(user: UserRow): void {
    setEditingUserId(user.id);
    setMessage(null);
    setDeleteOpen(false);
    setDeactivateOpen(false);
    setFormOpen(true);
  }

  function onSubmit(values: UserFormInput): void {
    const payload: UserFormInput = { ...values };
    if (!canSetPassword || !payload.password) {
      delete payload.password;
    }

    startTransition(async () => {
      try {
        if (editingUserId !== null) {
          await onUpdate(editingUserId, payload);
        } else {
          await onCreate(payload);
        }
        setMessage(tUsers("saved"));
        closeForm();
        router.refresh();
      } catch (error) {
        rethrowIfNavigationError(error);
        if (isLoginConflictError(error)) {
          showErrorToast(tUsers("loginNotUnique"));
          return;
        }
        showErrorToast(tUsers("saveFailed"));
      }
    });
  }

  function handleConfirmDelete(): void {
    if (!onDelete || editingUserId === null) return;
    startTransition(async () => {
      await onDelete(editingUserId);
      setMessage(tUsers("deleted"));
      closeForm();
      router.refresh();
    });
  }

  function handleConfirmDeactivate(): void {
    if (!onDeactivate || editingUserId === null) return;
    startTransition(async () => {
      try {
        await onDeactivate(editingUserId);
        setMessage(tUsers("deactivated"));
        closeForm();
        router.refresh();
      } catch (error) {
        rethrowIfNavigationError(error);
        showErrorToast(tUsers("saveFailed"));
      }
    });
  }

  async function handlePairUserTag(userId: UserRow["id"]): Promise<void> {
    if (isNfcOnCooldown()) {
      const seconds = Math.ceil(getNfcCooldownRemainingMs() / 1000);
      showErrorToast(tUsers("nfcCooldownActive", { seconds }));
      return;
    }

    if (!isNfcReadSupported()) {
      showErrorToast(tUsers("nfcNotSupported"));
      return;
    }

    if (!onPairUserTag) {
      showErrorToast(tUsers("nfcReadFailed"));
      return;
    }

    setNfcPairing(true);
    showSuccessToast(tUsers("nfcHoldTagNear"));

    try {
      const userTag = await readNfcSerialNumberOnce();
      const result = await onPairUserTag(userId, userTag);
      if (!result.ok) {
        if (result.error === "conflict") {
          showErrorToast(tUsers("nfcTagConflict"));
        } else if (result.error === "invalid") {
          showErrorToast(tUsers("nfcTagInvalid"));
        } else {
          showErrorToast(tUsers("nfcReadFailed"));
        }
        return;
      }
      setNfcCooldownTick(Date.now());
      showSuccessToast(tUsers("nfcTagPaired"));
      router.refresh();
    } catch (error) {
      const code =
        error instanceof NfcReadError ? error.code : mapNfcReadError(error);
      if (code === "cooldown") {
        const seconds = Math.ceil(getNfcCooldownRemainingMs() / 1000);
        showErrorToast(tUsers("nfcCooldownActive", { seconds }));
      } else {
        showErrorToast(tUsers("nfcReadFailed"));
      }
    } finally {
      setNfcPairing(false);
      setNfcCooldownTick(Date.now());
    }
  }

  function handlePreviewKioskColaborator(documentId: string): void {
    router.push(buildKioskColaboratorPath(documentId));
  }

  async function handleUpdateImage(
    userId: UserRow["id"],
    imageType: UserImageType,
    file: File,
    options?: { faceVector?: number[] },
  ): Promise<void> {
    if (!onUpdateImage) return;
    const formData = new FormData();
    formData.append("file", file);
    if (options?.faceVector) {
      formData.append("faceVector", JSON.stringify(options.faceVector));
    }
    await onUpdateImage(userId, imageType, formData);
    router.refresh();
  }

  const roleOptions = roleOptionsForUser(editingUser, manageableRoles);
  const formDialogKey = editingUserId ?? "new";
  const canDeactivateEditingUser = Boolean(
    canDeactivate &&
      onDeactivate &&
      editingUser &&
      !editingUser.blocked &&
      manageableRoles.includes(editingUser.roleType),
  );
  const query = nameQuery.trim().toLowerCase();
  const visibleUsers =
    query.length === 0
      ? users
      : users.filter((user) => user.name.toLowerCase().includes(query));

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 max-[500px]:gap-2">
      <div className="flex shrink-0 items-center justify-between gap-3">
        <h1 className="text-2xl font-bold max-[500px]:text-lg">{tUsers("title")}</h1>
        <Button type="button" variant="outline" onClick={startCreate}>
          {tUsers("newUser")}
        </Button>
      </div>

      <UsersToolbar value={nameQuery} onChange={setNameQuery} />

      {message ? (
        <p role="status" className="shrink-0 text-sm text-muted-foreground">
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
          canPairUserTag={canPairUserTag}
          canPreviewKioskColaborator={canPreviewKioskColaborator}
          canSetPassword={canSetPassword}
          canEditUserLogin={canEditUserLogin}
          showDelete={Boolean(canDelete && onDelete && editingUser)}
          showDeactivate={canDeactivateEditingUser}
          onClose={closeForm}
          onSubmit={onSubmit}
          onDelete={() => setDeleteOpen(true)}
          onDeactivate={() => setDeactivateOpen(true)}
          onPreviewKioskColaborator={handlePreviewKioskColaborator}
          onPairUserTag={handlePairUserTag}
          onUpdateImage={onUpdateImage ? handleUpdateImage : undefined}
          nfcPairDisabled={nfcPairDisabled}
          canManageImages={canManageImages}
        />
      ) : null}

      <ConfirmDialog
        open={deleteOpen}
        title={tUsers("deleteTitle")}
        description={tUsers("deleteConfirm")}
        confirmLabel={tCommon("delete")}
        disabled={isPending}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteOpen(false)}
      />

      <ConfirmDialog
        open={deactivateOpen}
        title={tUsers("deactivateTitle")}
        description={tUsers("deactivateConfirm")}
        confirmLabel={tUsers("deactivate")}
        disabled={isPending}
        onConfirm={handleConfirmDeactivate}
        onClose={() => setDeactivateOpen(false)}
      />

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto">
          <UsersListView
            users={visibleUsers}
            manageableRoles={manageableRoles}
            onOpen={startEdit}
          />
        </div>
      </div>
    </div>
  );
}
