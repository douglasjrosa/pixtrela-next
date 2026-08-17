import { getTranslations } from "next-intl/server";

import { AuthEntryTitle } from "@/components/auth/auth-entry-title";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { Card, CardContent } from "@/components/ui/card";

export default async function ForgotPasswordPage() {
  const t = await getTranslations("auth");
  const tApp = await getTranslations("app");

  return (
    <div className="flex w-full max-w-lg flex-col gap-6">
      <AuthEntryTitle>
        {t("forgotPasswordTitle")} — {tApp("name")}
      </AuthEntryTitle>
      <Card className="w-full">
        <CardContent className="pt-6">
          <ForgotPasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
