import { z } from "zod";

export const WORKDAY_ACTIONS = ["work", "off"] as const;
export type WorkdayAction = (typeof WORKDAY_ACTIONS)[number];

export const WORKDAY_SCOPES = ["global", "team", "user"] as const;
export type WorkdayScope = (typeof WORKDAY_SCOPES)[number];

export const DEFAULT_WORKDAY_TIMEZONE = "America/Sao_Paulo";
export const WORKDAY_NAME_MAX_LENGTH = 128;
export const WORKDAY_DESCRIPTION_MAX_LENGTH = 1000;
export const WORKDAY_TIMEZONE_MAX_LENGTH = 64;
export const MIN_DAY_OF_WEEK = 0;
export const MAX_DAY_OF_WEEK = 6;
export const MIN_MINUTE_OF_DAY = 0;
export const MAX_MINUTE_OF_DAY = 1440;
export const MINUTES_PER_HOUR = 60;
export const MAX_HOUR_OF_DAY = 24;

export const WORKDAY_TIMEZONE_OPTIONS = [
  "America/Sao_Paulo",
  "America/Manaus",
  "America/Cuiaba",
  "America/Campo_Grande",
  "America/Fortaleza",
  "America/Recife",
  "America/Belem",
  "America/Porto_Velho",
  "America/Rio_Branco",
  "America/Noronha",
  "UTC",
] as const;

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_HM_RE = /^(\d{2}):(\d{2})$/;

export function parseTimeToMinutes(value: string): number | null {
  const match = TIME_HM_RE.exec(value.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours === MAX_HOUR_OF_DAY && minutes === 0) return MAX_MINUTE_OF_DAY;
  if (hours < 0 || hours >= MAX_HOUR_OF_DAY) return null;
  if (minutes < 0 || minutes >= MINUTES_PER_HOUR) return null;
  return hours * MINUTES_PER_HOUR + minutes;
}

export function formatMinutesToTime(totalMinutes: number): string {
  const clamped = Math.max(
    MIN_MINUTE_OF_DAY,
    Math.min(MAX_MINUTE_OF_DAY, Math.trunc(totalMinutes)),
  );
  const hours = Math.floor(clamped / MINUTES_PER_HOUR);
  const minutes = clamped % MINUTES_PER_HOUR;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export const workdaySlotInputSchema = z
  .object({
    isRecurrent: z.boolean(),
    dayOfWeek: z.number().int().min(MIN_DAY_OF_WEEK).max(MAX_DAY_OF_WEEK).nullable(),
    date: z
      .string()
      .regex(ISO_DATE_RE, "invalidDate")
      .nullable(),
    allDay: z.boolean(),
    startMinute: z.number().int().min(MIN_MINUTE_OF_DAY).max(MAX_MINUTE_OF_DAY - 1).nullable(),
    endMinute: z.number().int().min(MIN_MINUTE_OF_DAY + 1).max(MAX_MINUTE_OF_DAY).nullable(),
  })
  .superRefine((slot, ctx) => {
    if (slot.isRecurrent) {
      if (slot.dayOfWeek === null || slot.date !== null) {
        ctx.addIssue({
          code: "custom",
          message: "invalidRecurrence",
          path: ["dayOfWeek"],
        });
      }
    } else if (slot.date === null || slot.dayOfWeek !== null) {
      ctx.addIssue({
        code: "custom",
        message: "invalidRecurrence",
        path: ["date"],
      });
    }

    if (slot.allDay) {
      if (slot.startMinute !== null || slot.endMinute !== null) {
        ctx.addIssue({
          code: "custom",
          message: "invalidAllDay",
          path: ["allDay"],
        });
      }
      return;
    }

    if (
      slot.startMinute === null ||
      slot.endMinute === null ||
      slot.endMinute <= slot.startMinute
    ) {
      ctx.addIssue({
        code: "custom",
        message: "invalidTimeRange",
        path: ["endMinute"],
      });
    }
  });

export type WorkdaySlotInput = z.infer<typeof workdaySlotInputSchema>;

const optionalIsoDateSchema = z
  .string()
  .trim()
  .optional()
  .refine((val) => !val || ISO_DATE_RE.test(val), { message: "invalidDate" });

export const workdayFormSchema = z
  .object({
    name: z.string().trim().min(1, "nameRequired").max(WORKDAY_NAME_MAX_LENGTH),
    description: z
      .string()
      .trim()
      .max(WORKDAY_DESCRIPTION_MAX_LENGTH)
      .optional(),
    action: z.enum(WORKDAY_ACTIONS),
    scope: z.enum(WORKDAY_SCOPES),
    timezone: z
      .string()
      .trim()
      .min(1)
      .max(WORKDAY_TIMEZONE_MAX_LENGTH),
    validFrom: optionalIsoDateSchema,
    validUntil: optionalIsoDateSchema,
    teamIds: z.array(z.string().uuid()),
    userIds: z.array(z.string().uuid()),
    slots: z.array(workdaySlotInputSchema).min(1, "slotsRequired"),
  })
  .superRefine((data, ctx) => {
    if (data.scope === "team" && data.teamIds.length === 0) {
      ctx.addIssue({
        code: "custom",
        message: "teamsRequired",
        path: ["teamIds"],
      });
    }
    if (data.scope === "user" && data.userIds.length === 0) {
      ctx.addIssue({
        code: "custom",
        message: "usersRequired",
        path: ["userIds"],
      });
    }
    if (data.validFrom && data.validUntil && data.validUntil < data.validFrom) {
      ctx.addIssue({
        code: "custom",
        message: "validityOrder",
        path: ["validUntil"],
      });
    }
  });

export type WorkdayFormInput = z.infer<typeof workdayFormSchema>;

export type NormalizedWorkdayInput = {
  name: string;
  description: string | null;
  action: WorkdayAction;
  scope: WorkdayScope;
  timezone: string;
  validFrom: string | null;
  validUntil: string | null;
  teamIds: string[];
  userIds: string[];
  slots: WorkdaySlotInput[];
};

export function normalizeWorkdayFormValues(
  data: WorkdayFormInput,
): NormalizedWorkdayInput {
  return {
    name: data.name.trim(),
    description: data.description?.trim() ? data.description.trim() : null,
    action: data.action,
    scope: data.scope,
    timezone: data.timezone.trim() || DEFAULT_WORKDAY_TIMEZONE,
    validFrom: data.validFrom?.trim() ? data.validFrom.trim() : null,
    validUntil: data.validUntil?.trim() ? data.validUntil.trim() : null,
    teamIds: data.scope === "team" ? [...new Set(data.teamIds)] : [],
    userIds: data.scope === "user" ? [...new Set(data.userIds)] : [],
    slots: data.slots,
  };
}

export { bulkDocumentIdsSchema as bulkWorkdayIdsSchema } from "./bulk-ids";
