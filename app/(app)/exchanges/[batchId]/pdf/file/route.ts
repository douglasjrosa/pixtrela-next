import { notFound } from "next/navigation";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { buildExchangePdfBuffer } from "@/lib/exchanges/build-exchange-pdf";
import {
  buildExchangePrintPdfFilename,
  isExchangePrintKind,
} from "@/lib/exchanges/print-pdf-filename";
import type { Role } from "@/lib/auth/nav";
import { canViewExchanges } from "@/lib/auth/permissions";
import { getBatchDetailForStaff } from "@/lib/repos/exchange-batches";

interface RouteContext {
  params: Promise<{ batchId: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  const session = await auth();
  const role = session?.user?.role as Role | undefined;
  const userId = session?.user?.id;

  if (!canViewExchanges(role) || !userId || !role) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { batchId } = await context.params;
  const kindParam = new URL(request.url).searchParams.get("kind");
  if (!kindParam || !isExchangePrintKind(kindParam)) {
    return NextResponse.json({ error: "Invalid kind" }, { status: 400 });
  }

  const detail = await getBatchDetailForStaff({ batchId, role, userId });
  if (!detail) notFound();

  const pdfBuffer = await buildExchangePdfBuffer(detail, kindParam);
  const filename = buildExchangePrintPdfFilename(
    kindParam,
    detail.month,
    detail.year,
  );

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
