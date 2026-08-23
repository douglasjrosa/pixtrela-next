"use client";

import { useEffect, useState, useTransition } from "react";
import { CircleDollarSign } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { updateShoppingListPrices } from "@/app/(app)/exchanges/[batchId]/actions";
import { Button } from "@/components/ui/button";
import { FormModalShell } from "@/components/ui/form-modal-shell";
import { NumberInput } from "@/components/ui/number-input";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import type { BatchShoppingLine } from "@/lib/repos/exchange-batches";
import { showErrorToast, showSuccessToast } from "@/lib/ui/app-toast";
import { cn } from "@/lib/utils";

export type ShoppingPriceRow = {
  awardId: string;
  title: string;
  actualPrice: number;
};

function toPriceRows(lines: BatchShoppingLine[]): ShoppingPriceRow[] {
  return lines.flatMap((line) =>
    line.awardId
      ? [
          {
            awardId: line.awardId,
            title: line.awardTitle,
            actualPrice: line.actualPrice,
          },
        ]
      : [],
  );
}

export interface ShoppingUpdatePricesButtonProps {
  lines: BatchShoppingLine[];
  batchId: string;
}

export function ShoppingUpdatePricesButton({
  lines,
  batchId,
}: ShoppingUpdatePricesButtonProps) {
  const tExchanges = useTranslations("exchanges");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const priceRows = toPriceRows(lines);
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<ShoppingPriceRow[]>(priceRows);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (open) {
      setRows(toPriceRows(lines));
    }
  }, [open, lines]);

  if (priceRows.length === 0) {
    return null;
  }

  function handlePriceChange(awardId: string, value: number): void {
    setRows((current) =>
      current.map((row) =>
        row.awardId === awardId ? { ...row, actualPrice: value } : row,
      ),
    );
  }

  function handleSave(): void {
    startTransition(async () => {
      try {
        await updateShoppingListPrices(batchId, {
          awards: rows.map((row) => ({
            awardId: row.awardId,
            actualPrice: row.actualPrice,
          })),
        });
        showSuccessToast(tExchanges("pricesSaved"));
        setOpen(false);
        router.refresh();
      } catch (error) {
        rethrowIfNavigationError(error);
        showErrorToast(tExchanges("pricesSaveFailed"));
      }
    });
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="no-print gap-2 text-sm"
        onClick={() => setOpen(true)}
      >
        <CircleDollarSign className="size-4 shrink-0" aria-hidden />
        {tExchanges("updatePrices")}
      </Button>

      {open ? (
        <FormModalShell
          open
          size="lgNarrow"
          fillBody={false}
          title={tExchanges("updatePricesTitle")}
          disabled={isPending}
          onClose={() => setOpen(false)}
          footerEnd={
            <>
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={() => setOpen(false)}
              >
                {tCommon("cancel")}
              </Button>
              <Button type="button" disabled={isPending} onClick={handleSave}>
                {tCommon("save")}
              </Button>
            </>
          }
        >
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2 pr-3 font-semibold">
                  {tExchanges("awardColumn")}
                </th>
                <th className="py-2 font-semibold">
                  {tExchanges("currentPriceColumn")}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.awardId}
                  className="border-b border-border/60"
                >
                  <td className="py-2 pr-3 align-middle">{row.title}</td>
                  <td className="py-2 align-middle">
                    <NumberInput
                      step="0.01"
                      className={cn("w-full max-w-40")}
                      disabled={isPending}
                      value={row.actualPrice}
                      onChange={(event) =>
                        handlePriceChange(
                          row.awardId,
                          Number(event.target.value),
                        )
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </FormModalShell>
      ) : null}
    </>
  );
}
