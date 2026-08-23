import * as React from "react";

import { APP_LOCALE } from "@/lib/i18n/locale";
import { cn } from "@/lib/utils";

function defaultSpellCheck(type?: string): boolean | undefined {
  if (type == null || type === "text" || type === "search") {
    return false;
  }
  return undefined;
}

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, lang = APP_LOCALE, spellCheck, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      lang={lang}
      spellCheck={spellCheck ?? defaultSpellCheck(type)}
      className={cn(
        "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export { Input };
