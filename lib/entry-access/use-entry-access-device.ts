"use client";

import { useEffect, useState } from "react";

import {
  entryDeviceFromMediaQuery,
  MOBILE_ENTRY_MEDIA_QUERY,
  type EntryAccessDevice,
} from "@/lib/business/entry-access";

function readIsMobile(): boolean {
  if (typeof window === "undefined") return false;
  if (typeof window.matchMedia !== "function") return false;
  return window.matchMedia(MOBILE_ENTRY_MEDIA_QUERY).matches;
}

export function useEntryAccessDevice(): EntryAccessDevice {
  const [device, setDevice] = useState<EntryAccessDevice>(() =>
    entryDeviceFromMediaQuery(readIsMobile()),
  );

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const media = window.matchMedia(MOBILE_ENTRY_MEDIA_QUERY);
    function sync(): void {
      setDevice(entryDeviceFromMediaQuery(media.matches));
    }
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  return device;
}
