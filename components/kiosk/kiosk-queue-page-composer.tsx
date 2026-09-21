"use client";

import {
  KioskPanelClient,
  type KioskPanelClientProps,
} from "@/app/kiosk/[colaboratorId]/kiosk-panel-client";

export type KioskQueuePageComposerProps = KioskPanelClientProps;

export function KioskQueuePageComposer(props: KioskQueuePageComposerProps) {
  return <KioskPanelClient {...props} />;
}
