import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { AuthEntryTitle } from "@/components/auth/auth-entry-title";
import { LoginEntryClient } from "@/components/auth/login-entry-client";
import { SessionExpiredNotice } from "@/components/auth/session-expired-notice";
import { Card, CardContent } from "@/components/ui/card";
import { loadEntryAccessSettings } from "@/lib/entry-access/load-entry-access";

interface LoginPageProps {
  searchParams: Promise<{ reason?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const t = await getTranslations("auth");
  const tApp = await getTranslations("app");
  const { reason } = await searchParams;
  const accessSettings = await loadEntryAccessSettings("login");

  return (
    <div className="flex w-full max-w-lg flex-col gap-6">
      <AuthEntryTitle>
        {t("entryTitlePrefix")} {tApp("name")}
      </AuthEntryTitle>
      <Card className="w-full">
        <CardContent className="pt-6">
          <SessionExpiredNotice reason={reason} />
          <Suspense fallback={null}>
            <LoginEntryClient accessSettings={accessSettings} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
