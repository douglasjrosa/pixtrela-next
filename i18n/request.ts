import { getRequestConfig } from "next-intl/server";

export const LOCALE = "pt-BR";

export default getRequestConfig(async () => ({
  locale: LOCALE,
  messages: (await import(`../messages/${LOCALE}.json`)).default,
}));
