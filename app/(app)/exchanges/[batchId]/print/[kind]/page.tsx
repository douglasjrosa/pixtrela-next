import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { auth } from "@/auth";
import { ForbiddenMessage } from "@/components/auth/forbidden-message";
import { DeliverySheetsPrint } from "@/components/exchanges/delivery-sheets-print";
import { ExchangePrintPreview } from "@/components/exchanges/exchange-print-preview";
import { ShoppingListPrint } from "@/components/exchanges/shopping-list-print";
import type { Role } from "@/lib/auth/nav";
import { canViewExchanges } from "@/lib/auth/permissions";
import {
  buildExchangePrintPdfFilename,
  isExchangePrintKind,
} from "@/lib/exchanges/print-pdf-filename";
import { getBatchDetailForStaff } from "@/lib/repos/exchange-batches";

interface PageProps {
  params: Promise<{ batchId: string; kind: string }>;
}

async function loadAuthorizedBatch(
  batchId: string,
  role: Role,
  userId: string,
) {
  const detail = await getBatchDetailForStaff({
    batchId,
    role,
    userId,
  });
  if (!detail) notFound();
  return detail;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { batchId, kind } = await params;
  if (!isExchangePrintKind(kind)) {
    return { title: "Print" };
  }

  const session = await auth();
  const role = session?.user?.role as Role | undefined;
  const userId = session?.user?.id;
  if (!canViewExchanges(role) || !userId || !role) {
    return { title: "Print" };
  }

  const detail = await loadAuthorizedBatch(batchId, role, userId);
  return {
    title: buildExchangePrintPdfFilename(kind, detail.month, detail.year),
  };
}

export default async function ExchangeBatchPrintPage({ params }: PageProps) {
  const session = await auth();
  const role = session?.user?.role as Role | undefined;
  const userId = session?.user?.id;

  if (!canViewExchanges(role) || !userId || !role) {
    return <ForbiddenMessage />;
  }

  const { batchId, kind } = await params;
  if (!isExchangePrintKind(kind)) notFound();

  const detail = await loadAuthorizedBatch(batchId, role, userId);
  const pdfFilename = buildExchangePrintPdfFilename(
    kind,
    detail.month,
    detail.year,
  );

  return (
    <ExchangePrintPreview mode={kind} pdfFilename={pdfFilename}>
      {kind === "shopping" ? (
        <ShoppingListPrint lines={detail.shoppingList} preview />
      ) : (
        <DeliverySheetsPrint deliveries={detail.deliveries} preview />
      )}
    </ExchangePrintPreview>
  );
}
