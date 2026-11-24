export const DEFAULT_WORKDAY_TIMEZONE = "America/Sao_Paulo";
export const WORKDAY_DESCRIPTION_MAX_LENGTH = 1000;
export const WORKDAY_DESCRIPTION_MIN_REQUIRED = 15;
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
