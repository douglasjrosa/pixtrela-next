import { z } from "zod";

import { LOG_ACTOR_SYSTEM, LOG_QUERY_MIN_CHARS } from "@/lib/logs/constants";

export const LOG_SORT_DIRECTIONS = ["asc", "desc"] as const;

export const logListFiltersSchema = z.object({
  actor: z.string().trim().optional(),
  route: z.string().trim().max(256).optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  q: z.string().trim().min(LOG_QUERY_MIN_CHARS).optional(),
  direction: z.enum(LOG_SORT_DIRECTIONS).default("desc"),
});

export type LogListFilters = z.infer<typeof logListFiltersSchema>;

export const LOG_ACTOR_FILTER_SYSTEM = LOG_ACTOR_SYSTEM;
