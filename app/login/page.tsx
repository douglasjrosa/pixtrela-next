import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { LoginEntryClient } from "@/components/auth/login-entry-client";
import { SessionExpiredNotice } from "@/components/auth/session-expired-notice";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface LoginPageProps {
  searchParams: Promise<{ reason?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const t = await getTranslations("auth");
  const { reason } = await searchParams;

  return (
    <main className="w-full max-w-lg">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{t("loginTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <SessionExpiredNotice reason={reason} />
          <Suspense fallback={null}>
            <LoginEntryClient />
          </Suspense>
        </CardContent>
      </Card>
    </main>
  );
}
