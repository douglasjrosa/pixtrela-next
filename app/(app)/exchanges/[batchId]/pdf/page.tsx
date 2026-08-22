import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { auth } from "@/auth";
import { ForbiddenMessage } from "@/components/auth/forbidden-message";
import { ExchangePdfViewer } from "@/components/exchanges/exchange-pdf-viewer";
import type { Role } from "@/lib/auth/nav";
import { canViewExchanges } from "@/lib/auth/permissions";
import {
  buildExchangePrintPdfFilename,
  isExchangePrintKind,
} from "@/lib/exchanges/print-pdf-filename";
import { getBatchDetailForStaff } from "@/lib/repos/exchange-batches";

interface PageProps {
  params: Promise<{ batchId: string }>;
  searchParams: Promise<{ kind?: string }>;
}

export async function generateMetadata({
  params,
  searchParams,
}: PageProps): Promise<Metadata> {
  const { batchId } = await params;
  const { kind: kindRaw } = await searchParams;
  const kindParam = kindRaw;
  if (!kindParam || !isExchangePrintKind(kindParam)) {
    return { title: "PDF" };
  }

  const session = await auth();
  const role = session?.user?.role as Role | undefined;
  const userId = session?.user?.id;
  if (!canViewExchanges(role) || !userId || !role) {
    return { title: "PDF" };
  }

  const detail = await getBatchDetailForStaff({ batchId, role, userId });
  if (!detail) return { title: "PDF" };

  return {
    title: buildExchangePrintPdfFilename(kindParam, detail.month, detail.year),
  };
}

export default async function ExchangeBatchPdfPage({
  params,
  searchParams,
}: PageProps) {
  const session = await auth();
  const role = session?.user?.role as Role | undefined;
  const userId = session?.user?.id;

  if (!canViewExchanges(role) || !userId || !role) {
    return <ForbiddenMessage />;
  }

  const { batchId } = await params;
  const { kind: kindRaw } = await searchParams;
  const kindParam = kindRaw;
  if (!kindParam || !isExchangePrintKind(kindParam)) notFound();

  const detail = await getBatchDetailForStaff({ batchId, role, userId });
  if (!detail) notFound();

  const pdfFilename = buildExchangePrintPdfFilename(
    kindParam,
    detail.month,
    detail.year,
  );

  return (
    <ExchangePdfViewer
      batchId={batchId}
      kind={kindParam}
      pdfFilename={pdfFilename}
      backHref={`/exchanges/${batchId}`}
    />
  );
}
