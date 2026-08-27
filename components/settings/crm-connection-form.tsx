import { getTranslations } from "next-intl/server";

import { FormSubmitButton } from "@/components/ui/form-submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export async function CrmConnectionForm({
  values,
  action,
}: {
  values: { webhookSecret: string };
  action: (formData: FormData) => void | Promise<void>;
}) {
  const tCommon = await getTranslations("common");
  const t = await getTranslations("settings.crm");

  return (
    <form action={action} className="max-w-md space-y-4">
      <h2 className="text-lg font-semibold">{t("title")}</h2>
      <p className="text-sm text-muted-foreground">{t("help")}</p>

      <div className="space-y-2">
        <Label htmlFor="webhookSecret">{t("webhookSecret")}</Label>
        <Input
          id="webhookSecret"
          name="webhookSecret"
          type="password"
          defaultValue={values.webhookSecret}
          required
        />
      </div>

      <FormSubmitButton label={tCommon("save")} />
    </form>
  );
}
