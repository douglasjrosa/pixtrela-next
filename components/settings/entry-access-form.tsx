"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { SwitchField } from "@/components/ui/switch-field";
import type {
  EntryAccessByDevice,
  EntryAccessDevice,
  EntryAccessMethods,
} from "@/lib/business/entry-access";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import { showErrorToast, showSuccessToast } from "@/lib/ui/app-toast";

const METHOD_KEYS = ["username", "code", "face", "nfc"] as const;

export interface EntryAccessFormProps {
  value: EntryAccessByDevice;
  onSave: (value: EntryAccessByDevice) => void | Promise<void>;
}

function MethodSwitchRow({
  id,
  label,
  ariaLabel,
  checked,
  disabled,
  onCheckedChange,
}: {
  id: string;
  label: string;
  ariaLabel: string;
  checked: boolean;
  disabled: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <SwitchField
      id={id}
      label={label}
      ariaLabel={ariaLabel}
      checked={checked}
      disabled={disabled}
      onCheckedChange={onCheckedChange}
    />
  );
}

export function EntryAccessForm({ value, onSave }: EntryAccessFormProps) {
  const tSettings = useTranslations("settings");
  const tAuth = useTranslations("auth");
  const router = useRouter();
  const [current, setCurrent] = useState(value);
  const [isPending, startTransition] = useTransition();

  const labels: Record<(typeof METHOD_KEYS)[number], string> = {
    username: tAuth("homeChooserUsername"),
    code: tAuth("homeChooserPassword"),
    face: tAuth("homeChooserCamera"),
    nfc: tSettings("entryAccessNfc"),
  };

  function saveDevice(
    device: EntryAccessDevice,
    key: keyof EntryAccessMethods,
    checked: boolean,
  ): void {
    const next: EntryAccessByDevice = {
      computer: { ...current.computer },
      mobile: { ...current.mobile },
    };
    next[device] = { ...next[device], [key]: checked };
    setCurrent(next);
    startTransition(async () => {
      try {
        await onSave(next);
        showSuccessToast(tSettings("saved"));
        router.refresh();
      } catch (error) {
        setCurrent(current);
        rethrowIfNavigationError(error);
        showErrorToast(tSettings("error"));
      }
    });
  }

  function renderDeviceSection(device: EntryAccessDevice): ReactNode {
    const methods = current[device];
    const deviceLabel = tSettings(
      device === "computer" ? "entryAccessComputer" : "entryAccessMobile",
    );
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-semibold">{deviceLabel}</h3>
        {METHOD_KEYS.map((key) => (
          <MethodSwitchRow
            key={`${device}-${key}`}
            id={`entry-access-${device}-${key}`}
            label={labels[key]}
            ariaLabel={`${deviceLabel}: ${labels[key]}`}
            checked={methods[key]}
            disabled={isPending}
            onCheckedChange={(checked) => saveDevice(device, key, checked)}
          />
        ))}
      </div>
    );
  }

  return (
    <section className="max-w-sm space-y-6">
      <h2 className="text-lg font-semibold">{tSettings("entryAccessHeading")}</h2>
      {renderDeviceSection("computer")}
      {renderDeviceSection("mobile")}
    </section>
  );
}
