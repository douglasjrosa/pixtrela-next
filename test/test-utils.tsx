import type { ReactElement } from "react";
import { fireEvent, render } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";

import messages from "@/messages/pt-BR.json";

/**
 * Types into a PasswordInput visible field (masked mode uses keyDown).
 */
export function typePassword(
  field: HTMLElement,
  value: string,
): void {
  for (const char of value) {
    fireEvent.keyDown(field, { key: char });
  }
}

/**
 * Render a component wrapped in the pt-BR i18n provider, mirroring the app.
 */
export function renderWithIntl(ui: ReactElement) {
  return render(
    <NextIntlClientProvider locale="pt-BR" messages={messages}>
      {ui}
    </NextIntlClientProvider>,
  );
}
