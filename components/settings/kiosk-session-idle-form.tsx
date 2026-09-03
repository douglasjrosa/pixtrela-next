import { getTranslations } from "next-intl/server";

import { FormSubmitButton } from "@/components/ui/form-submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DEFAULT_KIOSK_LIVE_CHAIN_INTERVAL_SECONDS,
  DEFAULT_KIOSK_QUEUE_PAGE_SIZE,
  MAX_KIOSK_LIVE_CHAIN_INTERVAL_SECONDS,
  MAX_KIOSK_QUEUE_PAGE_SIZE,
  MAX_KIOSK_SESSION_IDLE_SECONDS,
  MIN_KIOSK_LIVE_CHAIN_INTERVAL_SECONDS,
  MIN_KIOSK_QUEUE_PAGE_SIZE,
  MIN_KIOSK_SESSION_IDLE_SECONDS,
} from "@/lib/schemas/kiosk-setting";

export interface KioskSessionIdleFormProps {
  sessionIdleSeconds: number;
  maxSimultaneousSubtaskIntervalSeconds?: number;
  queuePageSize?: number;
  action: (formData: FormData) => void | Promise<void>;
}

export async function KioskSessionIdleForm({
  sessionIdleSeconds,
  maxSimultaneousSubtaskIntervalSeconds =
    DEFAULT_KIOSK_LIVE_CHAIN_INTERVAL_SECONDS,
  queuePageSize = DEFAULT_KIOSK_QUEUE_PAGE_SIZE,
  action,
}: KioskSessionIdleFormProps) {
  const tCommon = await getTranslations("common");
  const tSettings = await getTranslations("settings");

  const formKey = [
    sessionIdleSeconds,
    maxSimultaneousSubtaskIntervalSeconds,
    queuePageSize,
  ].join(":");

  return (
    <form key={formKey} action={action} className="max-w-sm space-y-4">
      <h2 className="text-lg font-semibold">{tSettings("kioskSession")}</h2>

      <div className="flex items-center gap-3">
        <Label htmlFor="sessionIdleSeconds" className="shrink-0">
          {tSettings("kioskSessionIdleSeconds")}
        </Label>
        <Input
          id="sessionIdleSeconds"
          name="sessionIdleSeconds"
          type="number"
          className="flex-1"
          min={MIN_KIOSK_SESSION_IDLE_SECONDS}
          max={MAX_KIOSK_SESSION_IDLE_SECONDS}
          step={1}
          key={`idle-${sessionIdleSeconds}`}
          defaultValue={sessionIdleSeconds}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="maxSimultaneousSubtaskIntervalSeconds">
          {tSettings("kioskLiveChainIntervalSeconds")}
        </Label>
        <Input
          id="maxSimultaneousSubtaskIntervalSeconds"
          name="maxSimultaneousSubtaskIntervalSeconds"
          type="number"
          min={MIN_KIOSK_LIVE_CHAIN_INTERVAL_SECONDS}
          max={MAX_KIOSK_LIVE_CHAIN_INTERVAL_SECONDS}
          step={1}
          key={`interval-${maxSimultaneousSubtaskIntervalSeconds}`}
          defaultValue={maxSimultaneousSubtaskIntervalSeconds}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="queuePageSize">{tSettings("kioskQueuePageSize")}</Label>
        <Input
          id="queuePageSize"
          name="queuePageSize"
          type="number"
          min={MIN_KIOSK_QUEUE_PAGE_SIZE}
          max={MAX_KIOSK_QUEUE_PAGE_SIZE}
          step={1}
          key={`page-size-${queuePageSize}`}
          defaultValue={queuePageSize}
          required
        />
      </div>

      <FormSubmitButton label={tCommon("save")} />
    </form>
  );
}
