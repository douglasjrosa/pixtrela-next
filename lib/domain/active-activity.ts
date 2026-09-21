import { eq } from "drizzle-orm";

import { activities } from "@/drizzle/schema";

/** Operational reads ignore archived activity rows. */
export const ACTIVE_ACTIVITY = eq(activities.active, true);
