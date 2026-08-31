"use client";

import { useSyncExternalStore } from "react";

import {
  entryDeviceFromMediaQuery,
  MOBILE_ENTRY_MEDIA_QUERY,
  type EntryAccessDevice,
} from "@/lib/business/entry-access";

function getServerSnapshot(): EntryAccessDevice {
  return "computer";
}

function getSnapshot(): EntryAccessDevice {
  if (typeof window.matchMedia !== "function") {
    return "computer";
  }
  return entryDeviceFromMediaQuery(
    window.matchMedia(MOBILE_ENTRY_MEDIA_QUERY).matches,
  );
}

function subscribe(callback: () => void): () => void {
  if (typeof window.matchMedia !== "function") {
    return () => {};
  }
  const media = window.matchMedia(MOBILE_ENTRY_MEDIA_QUERY);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

/** SSR-safe device bucket for entry-access settings (computer vs mobile). */
export function useEntryAccessDevice(): EntryAccessDevice {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
