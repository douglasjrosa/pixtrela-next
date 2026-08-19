"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

const PRINT_MODE_ATTR = "data-exchanges-print";

export function ExchangesPrintButton({
  labelKey,
  mode,
}: {
  labelKey: "printShopping" | "printDeliveries";
  mode: "shopping" | "deliveries";
}) {
  const t = useTranslations("exchanges");

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="no-print"
      onClick={() => {
        document.body.setAttribute(PRINT_MODE_ATTR, mode);
        const cleanup = () => {
          document.body.removeAttribute(PRINT_MODE_ATTR);
          window.removeEventListener("afterprint", cleanup);
        };
        window.addEventListener("afterprint", cleanup);
        window.print();
      }}
    >
      {t(labelKey)}
    </Button>
  );
}
