import { getRequestConfig } from "next-intl/server";

import { APP_LOCALE } from "@/lib/i18n/locale";

export const LOCALE = APP_LOCALE;

export default getRequestConfig(async () => ({
  locale: LOCALE,
  messages: (await import(`../messages/${LOCALE}.json`)).default,
}));
