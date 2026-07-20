const DAYS_IN_MONTH_FALLBACK = 31;

/**
 * Days until the exchange window opens again (inclusive of first day).
 * Returns 0 when the window is currently open.
 */
export function daysUntilExchangeWindow(
  firstDay: number,
  lastDay: number,
  today = new Date(),
): number {
  const day = today.getDate();
  if (day >= firstDay && day <= lastDay) {
    return 0;
  }
  if (day < firstDay) {
    return firstDay - day;
  }
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate() || DAYS_IN_MONTH_FALLBACK;
  return daysInMonth - day + firstDay;
}
