import { getTranslations } from "next-intl/server";

import { FormSubmitButton } from "@/components/ui/form-submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export async function RibermaxConnectionForm({
  values,
  action,
}: {
  values: { baseUrl: string; token: string };
  action: (formData: FormData) => void | Promise<void>;
}) {
  const tCommon = await getTranslations("common");
  const t = await getTranslations("settings.ribermax");

  return (
    <form action={action} className="max-w-md space-y-4">
      <h2 className="text-lg font-semibold">{t("title")}</h2>
      <p className="text-sm text-muted-foreground">{t("help")}</p>

      <div className="space-y-2">
        <Label htmlFor="baseUrl">{t("baseUrl")}</Label>
        <Input
          id="baseUrl"
          name="baseUrl"
          type="url"
          defaultValue={values.baseUrl}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="token">{t("token")}</Label>
        <Input
          id="token"
          name="token"
          type="password"
          defaultValue={values.token}
          required
        />
      </div>

      <FormSubmitButton label={tCommon("save")} />
    </form>
  );
}
