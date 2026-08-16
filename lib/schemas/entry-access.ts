import { z } from "zod";

import { ENTRY_ACCESS_SURFACES } from "@/lib/business/entry-access";

const methodsSchema = z.object({
  username: z.boolean(),
  code: z.boolean(),
  face: z.boolean(),
  nfc: z.boolean(),
});

export const entryAccessByDeviceSchema = z.object({
  computer: methodsSchema,
  mobile: methodsSchema,
});

export const entryAccessSettingsSchema = z.object({
  surface: z.enum(ENTRY_ACCESS_SURFACES),
  computer: methodsSchema,
  mobile: methodsSchema,
});

export type EntryAccessSettingsInput = z.infer<typeof entryAccessSettingsSchema>;
