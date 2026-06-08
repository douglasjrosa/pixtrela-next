import { getTranslations } from "next-intl/server";

import { SessionExpiredNotice } from "@/components/auth/session-expired-notice";
import { LoginForm } from "@/components/login-form";
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
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{t("loginTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <SessionExpiredNotice reason={reason} />
          <LoginForm />
        </CardContent>
      </Card>
    </main>
  );
}
