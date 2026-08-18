import { AuthEntryTitle } from "@/components/auth/auth-entry-title";
import { cn } from "@/lib/utils";

/** Extra space above the kiosk home title, beyond route-theme padding. */
export const KIOSK_HOME_HEADING_TOP_CLASS = "pt-12 sm:pt-16";

export interface KioskHomeHeadingProps {
  title: string;
  totemName?: string | null;
}

export function KioskHomeHeading({ title, totemName }: KioskHomeHeadingProps) {
  const name = totemName?.trim() ?? "";

  return (
    <header
      className={cn(
        "flex flex-col items-center",
        KIOSK_HOME_HEADING_TOP_CLASS,
        name ? "gap-2" : null,
      )}
    >
      <AuthEntryTitle>{title}</AuthEntryTitle>
      {name ? (
        <p className="text-center text-lg font-medium sm:text-xl">{name}</p>
      ) : null}
    </header>
  );
}
