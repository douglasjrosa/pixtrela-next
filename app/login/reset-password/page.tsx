import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { AuthEntryTitle } from "@/components/auth/auth-entry-title";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { verifyPasswordResetTokenAction } from "@/app/login/password-reset-actions";
import { cn } from "@/lib/utils";

interface ResetPasswordPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const t = await getTranslations("auth");
  const tApp = await getTranslations("app");
  const { token = "" } = await searchParams;
  const valid = token ? await verifyPasswordResetTokenAction(token) : false;

  return (
    <div className="flex w-full max-w-lg flex-col gap-6">
      <AuthEntryTitle>
        {t("resetPasswordTitle")} — {tApp("name")}
      </AuthEntryTitle>
      <Card className="w-full">
        <CardContent className="pt-6">
          {valid ? (
            <ResetPasswordForm token={token} />
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-destructive" role="alert">
                {t("resetPasswordExpired")}
              </p>
              <Link
                href="/login/forgot-password"
                className={cn(buttonVariants({ variant: "outline" }), "w-full")}
              >
                {t("forgotPasswordSubmit")}
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
