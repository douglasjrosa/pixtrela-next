"use client";

import { Controller, useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";

import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import {
  KIOSK_IDENTIFY_INVALID_CODE_KEY,
  KIOSK_IDENTIFY_PASSWORD_MIN_LENGTH_KEY,
  kioskIdentifySchema,
  type KioskIdentifyInput,
} from "@/lib/schemas/kiosk-identify";

import { KioskActionButton } from "./kiosk-action-button";

export interface KioskColaboratorFormProps {
  onSubmit: (values: KioskIdentifyInput) => void | Promise<void>;
  pending?: boolean;
  messagesNamespace?: "kiosk" | "auth";
}

type IdentifyFieldErrorKey =
  | typeof KIOSK_IDENTIFY_INVALID_CODE_KEY
  | typeof KIOSK_IDENTIFY_PASSWORD_MIN_LENGTH_KEY;

function identifyFieldErrorKey(
  field: "code" | "password",
  message: string | undefined,
): IdentifyFieldErrorKey {
  if (message === KIOSK_IDENTIFY_INVALID_CODE_KEY) {
    return KIOSK_IDENTIFY_INVALID_CODE_KEY;
  }
  if (message === KIOSK_IDENTIFY_PASSWORD_MIN_LENGTH_KEY) {
    return KIOSK_IDENTIFY_PASSWORD_MIN_LENGTH_KEY;
  }
  if (field === "code") return KIOSK_IDENTIFY_INVALID_CODE_KEY;
  return KIOSK_IDENTIFY_PASSWORD_MIN_LENGTH_KEY;
}

export function KioskColaboratorForm({
  onSubmit,
  pending,
  messagesNamespace = "kiosk",
}: KioskColaboratorFormProps) {
  const t = useTranslations(messagesNamespace);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<KioskIdentifyInput>({
    resolver: zodResolver(kioskIdentifySchema) as Resolver<KioskIdentifyInput>,
    defaultValues: { password: "" },
  });

  function handleFormSubmit(values: KioskIdentifyInput): void {
    void onSubmit(values);
  }

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className="mx-auto w-full max-w-sm space-y-4 px-1"
    >
      <div className="space-y-2">
        <Label htmlFor="code" className="text-base">
          {t("code")}
        </Label>
        <Input
          id="code"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          autoFocus
          className="h-14 rounded-2xl text-center text-lg"
          {...register("code")}
        />
        {errors.code ? (
          <p className="text-sm text-destructive" role="alert">
            {t(identifyFieldErrorKey("code", errors.code.message))}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-base">
          {t("password")}
        </Label>
        <Controller
          name="password"
          control={control}
          render={({ field }) => (
            <PasswordInput
              id="password"
              autoComplete="current-password"
              className="h-14 rounded-2xl text-center text-lg"
              forceNative
              name={field.name}
              onBlur={field.onBlur}
              ref={field.ref}
              onChange={(event) => field.onChange(event.target.value)}
            />
          )}
        />
        {errors.password ? (
          <p className="text-sm text-destructive" role="alert">
            {t(identifyFieldErrorKey("password", errors.password.message))}
          </p>
        ) : null}
      </div>

      <KioskActionButton type="submit" disabled={pending} actionVariant="primary">
        {t("enter")}
      </KioskActionButton>
    </form>
  );
}
