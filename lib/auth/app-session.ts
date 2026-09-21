import { cache } from "react";

import { auth } from "@/auth";

/** Per-request cached session (dedupes layout + page auth calls). */
export const getAppSession = cache(() => auth());
