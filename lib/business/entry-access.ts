export const ENTRY_ACCESS_SURFACES = ["login", "kiosk"] as const;
export type EntryAccessSurface = (typeof ENTRY_ACCESS_SURFACES)[number];

export const ENTRY_ACCESS_DEVICES = ["computer", "mobile"] as const;
export type EntryAccessDevice = (typeof ENTRY_ACCESS_DEVICES)[number];

export type EntryAccessMethods = {
  username: boolean;
  code: boolean;
  face: boolean;
  nfc: boolean;
};

export type EntryAccessByDevice = {
  computer: EntryAccessMethods;
  mobile: EntryAccessMethods;
};

export const DEFAULT_LOGIN_ENTRY_ACCESS: EntryAccessByDevice = {
  computer: {
    username: true,
    code: false,
    face: false,
    nfc: false,
  },
  mobile: {
    username: true,
    code: false,
    face: true,
    nfc: false,
  },
};

export const DEFAULT_KIOSK_ENTRY_ACCESS: EntryAccessByDevice = {
  computer: {
    username: true,
    code: false,
    face: false,
    nfc: false,
  },
  mobile: {
    username: false,
    code: true,
    face: true,
    nfc: false,
  },
};

export function defaultEntryAccessForSurface(
  surface: EntryAccessSurface,
): EntryAccessByDevice {
  return surface === "kiosk"
    ? DEFAULT_KIOSK_ENTRY_ACCESS
    : DEFAULT_LOGIN_ENTRY_ACCESS;
}

export function pickEntryAccessMethods(
  settings: EntryAccessByDevice,
  device: EntryAccessDevice,
): EntryAccessMethods {
  return settings[device];
}

export const MOBILE_ENTRY_MEDIA_QUERY = "(max-width: 767px)";

export function entryDeviceFromMediaQuery(matchesMobile: boolean): EntryAccessDevice {
  return matchesMobile ? "mobile" : "computer";
}
