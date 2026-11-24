"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { SwitchField } from "@/components/ui/switch-field";

export interface KioskProducingCardMetricSwitchesProps {
  showProducingStartedAt: boolean;
  showProducingExpectedTime: boolean;
  showProducingElapsed: boolean;
}

export function KioskProducingCardMetricSwitches({
  showProducingStartedAt,
  showProducingExpectedTime,
  showProducingElapsed,
}: KioskProducingCardMetricSwitchesProps) {
  const t = useTranslations("settings");
  const [startedAt, setStartedAt] = useState(showProducingStartedAt);
  const [expectedTime, setExpectedTime] = useState(showProducingExpectedTime);
  const [elapsed, setElapsed] = useState(showProducingElapsed);

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium">
        {t("kioskProducingCardTitle")}
      </legend>
      <input
        type="hidden"
        name="showProducingStartedAt"
        value={startedAt ? "true" : "false"}
      />
      <input
        type="hidden"
        name="showProducingExpectedTime"
        value={expectedTime ? "true" : "false"}
      />
      <input
        type="hidden"
        name="showProducingElapsed"
        value={elapsed ? "true" : "false"}
      />
      <SwitchField
        id="showProducingStartedAt"
        label={t("kioskShowProducingStartedAt")}
        checked={startedAt}
        onCheckedChange={setStartedAt}
      />
      <SwitchField
        id="showProducingExpectedTime"
        label={t("kioskShowProducingExpectedTime")}
        checked={expectedTime}
        onCheckedChange={setExpectedTime}
      />
      <SwitchField
        id="showProducingElapsed"
        label={t("kioskShowProducingElapsed")}
        checked={elapsed}
        onCheckedChange={setElapsed}
      />
    </fieldset>
  );
}
