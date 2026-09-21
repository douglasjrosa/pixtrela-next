import { getTranslations } from "next-intl/server";

import { LoginPageSkeleton } from "@/components/auth/login-page-skeleton";
import { ColaboratorHomeSkeleton } from "@/components/colaborator/colaborator-home-skeleton";
import { AppBoardSkeleton } from "@/components/layout/app-board-skeleton";
import { AppFormSkeleton } from "@/components/layout/app-form-skeleton";
import { AppPageSkeleton } from "@/components/layout/app-page-skeleton";

export async function RouteListLoading() {
  const t = await getTranslations("common");
  return <AppPageSkeleton label={t("loading")} />;
}

export async function RouteBoardLoading() {
  const t = await getTranslations("common");
  return <AppBoardSkeleton label={t("loading")} />;
}

export async function RouteFormLoading() {
  const t = await getTranslations("common");
  return <AppFormSkeleton label={t("loading")} />;
}

export async function RouteLoginLoading() {
  const t = await getTranslations("common");
  return <LoginPageSkeleton label={t("loading")} />;
}

export async function RouteColaboratorLoading() {
  const t = await getTranslations("common");
  return <ColaboratorHomeSkeleton label={t("loading")} />;
}
