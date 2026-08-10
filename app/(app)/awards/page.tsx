import { auth } from "@/auth";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import { ForbiddenMessage } from "@/components/auth/forbidden-message";
import {
  AwardManager,
  type AwardRow,
  type CurrencyOption,
} from "@/components/awards/award-manager";
import { APP_LIST_PAGE_SHELL_CLASS } from "@/components/layout/app-page-layout";
import type { Role } from "@/lib/auth/nav";
import { canManageAwards, canViewAwards } from "@/lib/auth/permissions";
import { mapAwardValues } from "@/lib/awards/map-award-values";
import { isDrizzleBackend } from "@/lib/db/backend";
import {
  listAwards as listAwardsRepo,
  listCurrencies as listCurrenciesRepo,
} from "@/lib/repos/awards";
import { STRAPI_TAGS, strapiFetch } from "@/lib/strapi";
import { eq } from "drizzle-orm";

import { awardPrices, currencies } from "@/drizzle/schema";
import { getDb } from "@/lib/db/client";

import {
  createAward,
  deleteAward,
  updateAward,
  uploadAwardImage,
} from "./actions";

const STRAPI_URL = process.env.STRAPI_URL ?? "http://127.0.0.1:1337";

interface StrapiList<T> {
  data: T[];
}

interface AwardEntity {
  documentId: string;
  name: string;
  title?: string | null;
  description?: string | null;
  warnings?: string | null;
  image?: { id: number; url?: string } | null;
  Value?: {
    numberOf?: number;
    currency?: {
      documentId?: string;
      name?: string;
      title?: string | null;
    } | null;
  }[] | null;
}

interface CurrencyEntity {
  documentId: string;
  name: string;
  title?: string | null;
}

function mediaUrl(path: string | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http") || path.startsWith("/")) return path;
  return `${STRAPI_URL}${path}`;
}

async function loadCurrencies(): Promise<CurrencyOption[]> {
  if (isDrizzleBackend()) {
    const rows = await listCurrenciesRepo();
    return rows.map((currency) => ({
      documentId: currency.id,
      name: currency.name,
      title: currency.title,
    }));
  }

  try {
    const res = await strapiFetch<StrapiList<CurrencyEntity>>(
      "/currencies",
      { strapiCache: { tags: [STRAPI_TAGS.currencies], revalidate: 60 } },
      {
        fields: ["documentId", "name", "title"],
        sort: "name:asc",
      },
    );
    return res.data.map((currency) => ({
      documentId: currency.documentId,
      name: currency.name,
      title: currency.title,
    }));
  } catch (error) {
    rethrowIfNavigationError(error);
    return [];
  }
}

async function loadAwards(): Promise<AwardRow[]> {
  if (isDrizzleBackend()) {
    const rows = await listAwardsRepo();
    const db = getDb();
    const result: AwardRow[] = [];
    for (const award of rows) {
      const prices = await db
        .select({
          numberOf: awardPrices.numberOf,
          currencyId: awardPrices.currencyId,
          currencyName: currencies.name,
          currencyTitle: currencies.title,
        })
        .from(awardPrices)
        .innerJoin(currencies, eq(awardPrices.currencyId, currencies.id))
        .where(eq(awardPrices.awardId, award.id));

      result.push({
        documentId: award.id,
        name: award.name,
        title: award.title,
        description: award.description,
        warnings: award.warnings,
        imageId: null,
        imageUrl: award.imageUrl,
        values: prices.map((price) => ({
          numberOf: Math.max(1, Math.floor(price.numberOf)),
          currencyDocumentId: price.currencyId,
        })),
      });
    }
    return result;
  }

  try {
    const res = await strapiFetch<StrapiList<AwardEntity>>(
      "/awards",
      { strapiCache: { tags: [STRAPI_TAGS.awards], revalidate: 60 } },
      {
        fields: ["documentId", "name", "title", "description", "warnings"],
        populate: {
          image: { fields: ["id", "url"] },
          Value: {
            populate: {
              currency: { fields: ["documentId", "name", "title"] },
            },
          },
        },
        sort: "name:asc",
      },
    );
    return res.data.map((award) => ({
      documentId: award.documentId,
      name: award.name,
      title: award.title,
      description: award.description,
      warnings: award.warnings,
      imageId: award.image?.id ?? null,
      imageUrl: mediaUrl(award.image?.url),
      values: mapAwardValues(award.Value),
    }));
  } catch (error) {
    rethrowIfNavigationError(error);
    return [];
  }
}

export default async function AwardsPage() {
  const session = await auth();
  const role = session?.user?.role as Role | undefined;

  if (!canViewAwards(role)) {
    return <ForbiddenMessage />;
  }

  const canManage = canManageAwards(role);
  const [awards, currencies] = await Promise.all([
    loadAwards(),
    loadCurrencies(),
  ]);

  return (
    <section className={APP_LIST_PAGE_SHELL_CLASS}>
      <AwardManager
        awards={awards}
        currencies={currencies}
        onCreate={createAward}
        onUpdate={updateAward}
        onDelete={deleteAward}
        onUploadImage={uploadAwardImage}
        canManage={canManage}
        canDelete={canManage}
      />
    </section>
  );
}
